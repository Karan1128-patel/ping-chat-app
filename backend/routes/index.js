import express from 'express';
import userRoutes from './user.routes.js';
import chatsRoutes from './chats.routes.js';



const router = express.Router();

router.use('/user', userRoutes);
router.use('/chats', chatsRoutes);


export default router;

