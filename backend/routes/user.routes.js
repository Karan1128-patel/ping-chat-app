import express from 'express';
import {
  createProfile,
  fetchDeviceIdByUserId,
  fetchIdentityKeyByUserId,
  fetchPreKeyBundle,
  fetchPreKeyCount,
  fetchPrivacyPolicy,
  fetchTermsAndConditions,
  fetchUserProfileByUserId,
  getUserProfile,
  logout,
  matchContacts,
  resendOtp,
  sendOtp,
  updateUserPresence,
  updateUserProfile,
  uploadAdditionalPreKeys,
  uploadKeyBundle,
  verifyOtp
} from '../controllers/user.controller.js';
import { authGuard } from '../middlewares/guard.middleware.js';
import redis from '../config/redis.js';

import { uploadProfile } from '../middlewares/multer.middleware.js';
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const fieldsConfig = [
  { name: 'profile_image', maxCount: 1 },
  { name: 'videoThumbnail', maxCount: 1 },
  { name: 'carReel', maxCount: 1 },
  { name: 'carImages', maxCount: 10 },
  { name: 'document', maxCount: 5 },
  { name: 'reelThumbnails', maxCount: 1 },
];

const router = express.Router();
// ----------------uncomment for rate limiter in live ----------------------------

// router.post("/send-otp", authLimiter, sendOtp);
// router.post("/verify-otp", authLimiter, verifyOtp);
// router.post("/resend-otp", authLimiter, resendOtp);

// ----------------------------end of rate limiter----------------------------

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// -----------------without using rate limiter comments on live ---------------------------
router.post("/create-profile", authGuard, createProfile);
router.get("/fetch-profile", authGuard, getUserProfile);
router.put("/update-profile", authGuard, uploadProfile.fields(fieldsConfig), updateUserProfile);
router.get("/fetch-terms-and-conditions", fetchTermsAndConditions);
router.get("/fetch-privacy-policy", fetchPrivacyPolicy);

router.post("/bundle", authGuard, uploadKeyBundle);
router.get("/bundle-by-user-id", authGuard, fetchPreKeyBundle);
router.get("/fetch-deviceId-by-user-id", authGuard, fetchDeviceIdByUserId);
router.get("/identityKey-by-user-id", authGuard, fetchIdentityKeyByUserId);
router.get("/prekey-count", authGuard, fetchPreKeyCount);
router.post("/uploads-prekeys", authGuard, uploadAdditionalPreKeys);

router.post("/match-contacts", authGuard, matchContacts);
router.post("/logout", authGuard, logout);
router.post("/fetch-profile-by-user-id", authGuard, fetchUserProfileByUserId);
router.post("/isUserOnlineAndOffline", authGuard, updateUserPresence);

// ----------------------------only for redish offline messges testing----------------------------

router.get("/debug/redis/offline/:userId/:deviceId", async (req, res) => {
  const { userId, deviceId } = req.params;
  const redisKey = `offline:${userId}:${deviceId}`;
  // await redis.flushdb();
  // console.log("✅ All Redis keys deleted (current DB)");
  console.log("Checking Redis Key:", redisKey);
  const messages = await redis.lrange(redisKey, 0, -1);
  res.json({ redisKey, count: messages.length, messages: messages.map(m => JSON.parse(m)) });
});

// ------------------------------end testing/debugging routes------------------------------


export default router;