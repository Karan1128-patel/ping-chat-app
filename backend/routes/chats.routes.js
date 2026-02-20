import express from 'express';
import {
    messageRead,
    sendMessage
} from '../controllers/chats.controller.js';
import { authGuard } from '../middlewares/guard.middleware.js';

const router = express.Router();

router.post("/send-message", authGuard, sendMessage)
router.post("/message-read",authGuard,messageRead);


export default router;