import express from 'express';
import {
  fetchDeviceIdByUserId,
  fetchIdentityKeyByUserId,
  fetchPreKeyBundle,
  fetchPreKeyCount,
  uploadAdditionalPreKeys,
  uploadKeyBundle,
} from '../controllers/userBundle.controller.js';
import { authGuard } from '../middlewares/guard.middleware.js';


const router = express.Router();

router.post("/bundle", authGuard, uploadKeyBundle);
router.get("/bundle-by-user-id", authGuard, fetchPreKeyBundle);
router.get("/fetch-deviceId-by-user-id", authGuard, fetchDeviceIdByUserId);
router.get("/identityKey-by-user-id", authGuard, fetchIdentityKeyByUserId);
router.get("/prekey-count", authGuard, fetchPreKeyCount);
router.post("/uploads-prekeys", authGuard, uploadAdditionalPreKeys);


export default router;