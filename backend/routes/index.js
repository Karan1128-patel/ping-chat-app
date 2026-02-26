import express from 'express';
import userRoutes from './user.routes.js';
import chatsRoutes from './chats.routes.js';
import userBundleRoutes from './userBundle.routes.js';



const router = express.Router();

router.use('/user', userRoutes);
router.use('/chats', chatsRoutes);
router.use('/userBundle', userBundleRoutes);


export default router;

