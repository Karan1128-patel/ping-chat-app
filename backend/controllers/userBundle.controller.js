import { ApiError, apiHandler, apiResponse } from "../utils/api.util.js";
import * as userBundleService from "../services/userBundle.service.js";
import { CUSTOM_SUCCESS, INVALID } from "../utils/message.util.js";
import { getMessageByLang } from "../utils/misc.util.js";


export const uploadKeyBundle = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const userId = id;
    const payload = req.body;
    let isbundleCreated = await userBundleService.uploadKeyBundleService(userId, payload);
    if (isbundleCreated == false) {
        throw new ApiError(INVALID, getMessageByLang(language, "BUNDLE_CREATE_FAILED"));
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "BUNDLE_CREATED"), true, res);
});

export const fetchPreKeyBundle = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    let userId = req.query.userId;
    const content = await userBundleService.fetchPreKeyBundleService(userId);
    if (content.status === false) {
        throw new ApiError(INVALID, getMessageByLang(language, "PRE_KEY_BUNDLE_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PRE_KEY_BUNDLE_FETCHED"), content, res);
});

export const fetchDeviceIdByUserId = apiHandler(async (req, res) => {
    const { language } = req.user;
    let userId = req.query.userId;
    const deviceId = await userBundleService.fetchDeviceIdByUserIdService(userId);
    if (!deviceId) {
        throw new ApiError(INVALID, getMessageByLang(language, "DEVICE_ID_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "DEVICE_ID_FETCHED"), { device_id: deviceId }, res);
});

export const fetchIdentityKeyByUserId = apiHandler(async (req, res) => {
    const { language } = req.user;
    let userId = req.query.userId;
    const identityKey = await userBundleService.fetchIdentityKeyByUserIdService(userId);
    if (!identityKey) {
        throw new ApiError(INVALID, getMessageByLang(language, "IDENTITY_KEY_NOT_FOUND"), {}, false);
    }
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "IDENTITY_KEY_FETCHED"), { identity_key: identityKey }, res);
});

export const fetchPreKeyCount = apiHandler(async (req, res) => {
    const { id, language } = req.user;
    const count = await userBundleService.fetchPreKeyCountService(id);
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
    const insertedCount = await userBundleService.uploadAdditionalPreKeysService(userId, deviceId, preKeys);
    return apiResponse(CUSTOM_SUCCESS, getMessageByLang(language, "PREKEY_UPLOADED"), { inserted: insertedCount }, res);
});
