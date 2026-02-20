import { ApiError, apiHandler, apiResponse } from "../utils/api.util.js";
import * as userService from "../services/user.service.js";
import { ADD_SUCCESS, CUSTOM_SUCCESS, FETCH, LOGIN, UPDATE_SUCCESS, REQUIRED, INVALID, NOT_FOUND } from "../utils/message.util.js";
import { getFileType, getMessageByLang } from "../utils/misc.util.js";
import * as userModel from "../model/user.model.js";
// -------Yogesh code for testing purpose only------------------
import * as messageModel from "../model/chats.model.js";
import jwt from 'jsonwebtoken';
import { getIO } from "../sockets/socket.instance.js";

export const sendOtp = apiHandler(async (req, res) => {
    const { phone_number, country_code, lang } = req.body;
    let language = lang ? lang : "en";
    if (!phone_number || !country_code) {
        return apiResponse(REQUIRED, "Phone number", null, res);
    }
    let data = await userService.sendOtpService({ phone_number, country_code });
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "OTP_SENT"), data, res);
});

export const verifyOtp = apiHandler(async (req, res) => {
    const { phone_number, country_code, otp, lang } = req.body;
    let language = lang ? lang : "en";
    let phoneHash = await userService.verifyOtpService({ phone_number, country_code, otp, language });
    let user = await userModel.getUserByPhoneHash(phoneHash);
    if (!phoneHash) {
        throw new ApiError(INVALID, getMessageByLang(language, "OTP_INVALID"));
    }
    const token = jwt.sign({ phone_hash: phoneHash, id: user[0].id, language: user[0].language }, process.env.JWT_SECRET, { expiresIn: "30d" });
    let userDetails = { token: token, user_id: user[0].id, language: user[0].language };
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "OTP_VERIFIED"), userDetails, res);
});

export const resendOtp = apiHandler(async (req, res) => {
    const { phone_number, country_code, lang = "en" } = req.body;
    if (!phone_number || !country_code) {
        throw new ApiError(REQUIRED, getMessageByLang(lang, "PHONE_REQUIRED"));
    }
    const result = await userService.resendOtpService({ phone_number, country_code, lang });
    if (!result.success) {
        throw new ApiError(INVALID, getMessageByLang(lang, result.reason));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(lang, "OTP_RESENT"), result, res);
});

export const createProfile = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const isProfileCreated = await userService.profileCreateServices({ ...req.body, id });
    if (isProfileCreated == false) {
        throw new ApiError(INVALID, getMessageByLang(language, "PROFILE_CREATE_FAILED"));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PROFILE_CREATED"), isProfileCreated, res);
});

export const getUserProfile = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const user = await userService.getUserProfileService(id);
    if (user.status === false) {
        throw new ApiError(NOT_FOUND, getMessageByLang(language, "USER_NOT_FOUND"));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "USER_PROFILE_FETCHED"), user, res);
});

export const updateUserProfile = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const updatedUser = await userService.updateUserProfileService(id, req.body, req.files);
    if (updatedUser.status === false) {
        throw new ApiError(NOT_FOUND, getMessageByLang(language, "USER_NOT_FOUND"));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PROFILE_UPDATED"), updatedUser, res);
});

export const fetchTermsAndConditions = apiHandler(async (req, res) => {
    let language = 'en';
    const content = await userService.fetchTermsAndConditionsService();
    if (content.status === false) {
        throw new ApiError(INVALID, getMessageByLang(language, "TERMS_AND_CONDITIONS_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "TERMS_AND_CONDITIONS_FETCHED"), content, res);
});

export const fetchPrivacyPolicy = apiHandler(async (req, res) => {
    let language = 'en';
    const content = await userService.fetchPrivacyPolicyService();
    if (content.status === false) {
        throw new ApiError(INVALID, getMessageByLang(language, "PRIVACY_POLICY_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PRIVACY_POLICY_FETCHED"), content, res);
});

export const uploadKeyBundle = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const userId = id;
    const payload = req.body;
    let isbundleCreated = await userService.uploadKeyBundleService(userId, payload);
    if (isbundleCreated == false) {
        throw new ApiError(INVALID, getMessageByLang(language, "BUNDLE_CREATE_FAILED"));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "BUNDLE_CREATED"), true, res);
});

export const fetchPreKeyBundle = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    let userId = req.query.userId;
    const content = await userService.fetchPreKeyBundleService(userId);
    if (content.status === false) {
        throw new ApiError(INVALID, getMessageByLang(language, "PRE_KEY_BUNDLE_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PRE_KEY_BUNDLE_FETCHED"), content, res);
});

export const fetchDeviceIdByUserId = apiHandler(async (req, res) => {
    const { language } = req.user;
    let userId = req.query.userId;
    const deviceId = await userService.fetchDeviceIdByUserIdService(userId);
    if (!deviceId) {
        throw new ApiError(INVALID, getMessageByLang(language, "DEVICE_ID_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "DEVICE_ID_FETCHED"), { device_id: deviceId }, res);
});

export const fetchIdentityKeyByUserId = apiHandler(async (req, res) => {
    const { language } = req.user;
    let userId = req.query.userId;
    const identityKey = await userService.fetchIdentityKeyByUserIdService(userId);
    if (!identityKey) {
        throw new ApiError(INVALID, getMessageByLang(language, "IDENTITY_KEY_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "IDENTITY_KEY_FETCHED"), { identity_key: identityKey }, res);
});

export const fetchPreKeyCount = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const count = await userService.fetchPreKeyCountService(id);
    if (count === null) {
        throw new ApiError(INVALID, getMessageByLang(language, "PREKEY_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PREKEY_COUNT_FETCHED"), { count }, res);
});

export const uploadAdditionalPreKeys = apiHandler(async (req, res) => {
    const { language, id } = req.user;
    const { deviceId, preKeys } = req.body;

    let userId = id;
    if (!Array.isArray(preKeys) || preKeys.length === 0) {
        throw new ApiError(INVALID, getMessageByLang(language, "PREKEY_REQUIRED"), {}, false);
    }
    const insertedCount = await userService.uploadAdditionalPreKeysService(userId, deviceId, preKeys);
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PREKEY_UPLOADED"), { inserted: insertedCount }, res);
});

export const matchContacts = apiHandler(async (req, res) => {
    const { language } = req.user;
    const { phones } = req.body;
    if (!Array.isArray(phones) || phones.length === 0) {
        throw new ApiError(INVALID, getMessageByLang(language, "PHONE_REQUIRED"), {}, false);
    }
    const matched = await userService.matchContactsService(phones);
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "CONTACTS_FETCHED"), { matched }, res);
});

export const logout = async (req, res, next) => {
    try {
        const { id, language } = req.user;
        const { deviceId } = req.body;
        const result = await userService.deleteUserKeysService(id, deviceId);
        return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "USER_KEYS_DELETED"), result, res);
    } catch (error) {
        next(error);
    }
};

export const fetchUserProfileByUserId = apiHandler(async (req, res) => {
    const { users } = req.body;
    const user = await userService.getUserProfileServiceByUserId(users);
    if (user.status === false) {
        throw new ApiError(NOT_FOUND, getMessageByLang('en', "USER_NOT_FOUND"));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang('en', "USER_PROFILE_FETCHED"), user, res);
});

export const updateUserPresence = apiHandler(async (req, res) => {
    const userId = req.user.id;
    const { device_id: deviceId, is_online } = req.body;
    if (!deviceId) {
        throw new ApiError(CUSTOM_ERROR, getMessageByLang('en', "DEVICE_ID_REQUIRED"));
    }
    if (is_online === undefined) {
        throw new ApiError(CUSTOM_ERROR, getMessageByLang('en', "ONLINE_STATUS_REQUIRED"));
    }
    let result;
    if (Number(is_online) === 1) {
        result = await messageModel.setUserOnline(userId, deviceId);
    } else {
        result = await messageModel.setUserOffline(userId, deviceId);
    }
    if (!result) {
        throw new ApiError(CUSTOM_ERROR, getMessageByLang('en', "USER_STATUS_UPDATE_FAILED"));
    }
    const user = await userModel.getUserByIdModel(userId);
    const io = getIO();
    io.emit("user_profile", { success: true, data: user[0] });
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang('en', "USER_STATUS_UPDATED"), result, res);
});
