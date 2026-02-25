import redis from "../../config/redis.js";
import * as messageModel from "../../model/chats.model.js";
import { messageEvents } from "./message.events.js";
import { getIO } from "../socket.instance.js";
import { getMessageSourceData } from "../../utils/api.util.js";

let initialized = false;

export const initMessageListener = () => {
    if (initialized) return;
    initialized = true;

    messageEvents.on("message_created", async (data) => {
        const io = getIO();
        const { formattedMsg, receiver_id, conversation_id } = data;
        const room = `user:${receiver_id}`;
        const sockets = await io.in(room).fetchSockets();
        if (sockets.length > 0) {
            io.to(room).emit("chat_receive", { ...formattedMsg, status: 'delivered' });
        } else {
            await redis.incr(`unread:${receiver_id}:${conversation_id}`);
        }
    });

    messageEvents.on("message_read", async (data) => {
        try {
            const { message_id, receiver_id, conversation_id } = data;
            const io = getIO();

            const messageData = await getMessageSourceData(message_id, receiver_id, conversation_id);
            if (!messageData) { console.log("Message not found anywhere"); return }
            const { sender_id, sender_device_id } = messageData;
            await messageModel.deleteMessage(message_id);
            const pattern = `offline:${receiver_id}:*`;
            const keys = await redis.keys(pattern);
            for (const key of keys) {
                const messages = await redis.lrange(key, 0, -1);
                for (const msgStr of messages) {
                    const msg = JSON.parse(msgStr);
                    if (msg.id === message_id) {
                        await redis.lrem(key, 0, msgStr);
                    }
                }
            }
            const unreadKey = `unread:${receiver_id}:${conversation_id}`;
            const unreadCount = await redis.get(unreadKey);
            if (unreadCount && parseInt(unreadCount) > 0) {
                await redis.decr(unreadKey);
            }
            const senderRoom = `user:${sender_id}:device:${sender_device_id}`;
            io.to(senderRoom).emit("message_read_receipt", { message_id, conversation_id, status: "read" });
            console.log("🗑 Message fully removed from DB & Redis");
        } catch (err) {
            console.error("❌ message_read listener error:", err);
        }
    });

    

};
