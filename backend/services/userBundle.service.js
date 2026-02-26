import { ApiError } from "../utils/api.util.js";
import { CUSTOM_ERROR, INVALID, NOT_FOUND } from "../utils/message.util.js";
import * as userBundle from "../model/userBundle.model.js";



export const uploadKeyBundleService = async (userId, data) => {
  try {
    const { registrationId, deviceId, identityKey, signedPreKeyId, signedPreKey, signedPreKeySignature, preKeys, } = data;
    await userBundle.upsertIdentityKeyModel(userId, deviceId, registrationId, identityKey);
    await userBundle.insertSignedPreKeyModel(userId, deviceId, signedPreKeyId, signedPreKey, signedPreKeySignature);
    if (Array.isArray(preKeys) && preKeys.length > 0) {
      await userBundle.deleteAllPreKeysByUserAndDeviceModel(userId, deviceId);
      await userBundle.insertPreKeysModel(userId, deviceId, preKeys);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CUSTOM_ERROR, "Error while uploading key bundle", error, false);
  }
};

export const fetchPreKeyBundleService = async (userId) => {
  try {
    const identity = await userBundle.fetchIdentityKeyModel(userId);
    if (!identity) {
      throw new ApiError(NOT_FOUND, "User identity not found");
    }
    const signedPreKey = await userBundle.fetchLatestSignedPreKeyModel(userId);
    if (!signedPreKey) {
      throw new ApiError(NOT_FOUND, "Signed prekey not found");
    }
    const preKey = await userBundle.consumeOnePreKeyModel(userId);
    if (!preKey) {
      throw new ApiError(NOT_FOUND, "No prekeys available");
    }
    return {
      registrationId: identity.registration_id,
      deviceId: identity.device_id,
      identityKey: identity.identity_key,

      signedPreKeyId: signedPreKey.signed_prekey_id,
      signedPreKeyPublic: signedPreKey.signed_prekey,
      signedPreKeySignature: signedPreKey.signature,

      preKeyId: preKey.prekey_id,
      preKeyPublic: preKey.public_key,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(CUSTOM_ERROR, "Error in get prekey bundle", error, false);
  }
};

export const fetchDeviceIdByUserIdService = async (userId) => {
  const row = await userBundle.fetchActiveDeviceIdModel(userId);
  if (!row) {
    throw new ApiError(NOT_FOUND, "Device not found for user");
  }
  return row.device_id;
};

export const fetchIdentityKeyByUserIdService = async (userId) => {
  const row = await userBundle.fetchIdentityKeyOnlyModel(userId);
  if (!row) {
    throw new ApiError(NOT_FOUND, "Identity key not found");
  }
  return row.identity_key;
};

export const fetchPreKeyCountService = async (userId) => {
  const device = await userBundle.fetchActiveDeviceIdModel(userId);
  if (!device) {
    throw new ApiError(NOT_FOUND, "Device not found");
  }
  const countRow = await userBundle.fetchPreKeyCountByDeviceModel(userId, device.device_id);
  return Number(countRow?.count || 0);
};

export const uploadAdditionalPreKeysService = async (userId, deviceId, preKeys) => {
  if (!deviceId) {
    throw new ApiError(INVALID, "Device ID is required");
  }
  const insertedCount = await userBundle.insertAdditionalPreKeysModel(userId, deviceId, preKeys);
  return insertedCount;
};
