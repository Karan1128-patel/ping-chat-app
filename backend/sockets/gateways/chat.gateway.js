import redis from "../../config/redis.js";
import * as messageModel from "../../model/chats.model.js";
import { messageEvents } from "../events/message.events.js";
import * as userModel from "../../model/user.model.js";

export default function registerChatGateway(io, socket) {
    socket.on("fetch_offline_messages", async () => {
        const userId = socket.userId;
        const deviceId = socket.deviceId;
        const redisKey = `offline:${userId}:${deviceId}`;
        const messageIds = await redis.lrange(redisKey, 0, -1);
        if (!messageIds.length) return;
        messageIds.forEach(msg => { socket.emit("chat_receive", JSON.parse(msg)); });
        await redis.del(redisKey);
    });

    socket.on("get_user_profile", async ({ user_id }) => {
        try {
            const user = await userModel.getUserByIdModel(user_id);
            socket.emit("user_profile", {success: true,data: user[0]});
        } catch (error) {
            socket.emit("user_profile", {success: false,message: "Failed to fetch user" });
        }
    });

    socket.on("message_read", async ({ message_id,sender_id, sender_device_id, receiver_id, receiver_device_id, conversation_id}) => {
        try {
            await messageModel.deleteMessage(message_id);
            const redisKey = `offline:${receiver_id}:${receiver_device_id}`;
            const messages =await redis.lrange(redisKey, 0, -1);
            for (const msgStr of messages) {
                const msg = JSON.parse(msgStr);
                if (msg.id === message_id) {
                    await redis.lrem(redisKey, 0, msgStr);
                    break;
                }
            }
            const senderRoom = `user:${sender_id}:device:${sender_device_id}`;
            io.to(senderRoom).emit("message_read_receipt",{message_id,conversation_id,status: "read"});
            console.log("🗑 Message deleted from DB & Redis after read");
        } catch (err) {
            console.error("❌ message_read error:", err);
        }

    });


}
