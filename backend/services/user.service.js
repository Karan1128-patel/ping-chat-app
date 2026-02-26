import crypto from "crypto";
import redis from "../config/redis.js";
import twilio from "twilio";
import { ApiError } from "../utils/api.util.js";
import { CUSTOM_ERROR, INVALID, NOT_FOUND } from "../utils/message.util.js";
import * as userModel from "../model/user.model.js";
import { CustomImagePath } from "../utils/misc.util.js";
const OTP_TTL = 60;
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const hashPhone = (country, phone) => {
  return crypto.createHash("sha256").update(`${country}${phone}`).digest("hex");
};

export const sendOtpService = async ({ country_code, phone_number }) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const phoneHash = hashPhone(country_code, phone_number);
  await redis.set(`otp:${phoneHash}`, otp, "EX", 60);
  if (process.env.OTP_PROVIDER !== "twilio") {
    console.log("📨 MOCK OTP");
    console.log("Phone:", `${country_code}${phone_number}`);
    console.log("OTP:", otp);
    return otp;
  }
  await twilioClient.messages.create({
    body: `Your Ping OTP is ${otp}`,
    from: process.env.TWILIO_PHONE,
    to: `${country_code}${phone_number}`,
  });
  return otp;
};

export const verifyOtpService = async ({ country_code, phone_number, otp, language }) => {
  const phoneHash = hashPhone(country_code, phone_number);
  const savedOtp = await redis.get(`otp:${phoneHash}`);
  if (!savedOtp || savedOtp !== otp) return false;
  await redis.del(`otp:${phoneHash}`);
  let user = await userModel.getUserByPhoneHash(phoneHash);
  if (user.length === 0) {
    await userModel.createUnverifiedUser({ phone_hash: phoneHash, country_code, language });
  }
  return phoneHash;
};

export const resendOtpService = async ({ phone_number, country_code }) => {
  const phoneHash = hashPhone(country_code, phone_number);
  const redisKey = `otp:${phoneHash}`;
  const existingOtp = await redis.get(redisKey);
  if (existingOtp) {
    return { success: false, reason: "OTP_ALREADY_SENT" };
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(redisKey, otp, "EX", OTP_TTL);
  console.log(`📲 Resent OTP: ${otp} to ${country_code}${phone_number}`);
  return { success: true, otp: otp };
};

export const profileCreateServices = async (data) => {
  let obj = { username: data.username, descriptions: data.descriptions, }
  let user = await userModel.createProfileModel(obj, data.id);
  if (user.affectedRows === 0) {
    return false;
  }
  return user[0];
};

export const getUserProfileService = async (user_id) => {
  try {
    let user = await userModel.getUserByIdModel(user_id);
    if (user.length === 0) {
      return { status: false };
    }
    let userProfile = await CustomImagePath(user[0].profile_image);
    user[0].profile_image = userProfile
    return user[0];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CUSTOM_ERROR, "Error in get user profile", error, false);
  }
};

export const updateUserProfileService = async (user_id, data, file) => {
  try {
    const user = await userModel.getUserByIdModel(user_id);
    if (!user || user.length === 0) {
      return { status: false };
    }
    if (file && file.profile_image && file.profile_image.length > 0) {
      data.profile_image = file.profile_image[0].filename;
    } else {
      delete data.profile_image;
    }
    const updatedUser = await userModel.updateProfileModel(data, user_id);
    if (!updatedUser || updatedUser.affectedRows === 0) {
      return { status: false };
    }
    return updatedUser;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CUSTOM_ERROR, "Error in update user profile", error, false);
  }
};


export const fetchTermsAndConditionsService = async () => {
  try {
    let content = await userModel.fetchTermsAndConditionsModel();
    if (content.length === 0) {
      return { status: false };
    }
    return content[0];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CUSTOM_ERROR, "Error in get terms and conditions", error, false);
  }
};

export const fetchPrivacyPolicyService = async () => {
  try {
    let content = await userModel.fetchPrivacyPolicyModel();
    if (content.length === 0) {
      return { status: false };
    }
    return content[0];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CUSTOM_ERROR, "Error in get privacy policy", error, false);
  }
};

export const matchContactsService = async (phones) => {
  const hashToPlainMap = new Map();
  phones.forEach((fullPhone) => {
    const hash = hashPhone("", fullPhone);
    hashToPlainMap.set(hash, fullPhone);
  });
  const hashes = Array.from(hashToPlainMap.keys());
  const users = await userModel.fetchUsersByPhoneHashesModel(hashes);
  let result;
  return result = await Promise.all(
    users.map(async (user) => {
      const deviceId = await userModel.fetchActiveDeviceIdModel(user.id);
      let userProfile = await CustomImagePath(user.profile_image);

      return {
        device_id: deviceId ? deviceId.device_id : null,
        user_id: user.id,
        username: user.username,
        user_profile: userProfile,
        phone: hashToPlainMap.get(user.phone_number),
      };
    })
  );

};

export const deleteUserKeysService = async (userId, deviceId) => {
  await userModel.deleteIdentityKeyModel(userId, deviceId);
  await userModel.deletePreKeysModel(userId, deviceId);
  await userModel.deleteSignedPreKeysModel(userId, deviceId);

  const redisKey = `offline:${userId}:${deviceId}`;
  await redis.del(redisKey);

  const unreadPattern = `unread:${userId}:*`;
  const unreadKeys = await redis.keys(unreadPattern);

  if (unreadKeys.length > 0) {
    await redis.del(unreadKeys);
  }
  return { userId, deviceId, deleted: true };
};

export const getUserProfileServiceByUserId = async (user_ids) => {
  try {
    const users = await userModel.getUsersByIdsModel(user_ids);
    if (!users || users.length === 0) {
      return { status: false };
    }

    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        const imagePath = await CustomImagePath(user.profile_image);

        return {
          ...user,
          profile_image: imagePath,
        };
      })
    );

    return updatedUsers;

  } catch (error) {
    if (error instanceof ApiError) throw error;

    throw new ApiError(
      CUSTOM_ERROR,
      "Error in get user profile",
      error,
      false
    );
  }
};
