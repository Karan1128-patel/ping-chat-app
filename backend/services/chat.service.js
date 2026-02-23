import redis from "../config/redis.js";
import * as messageModel from "../model/chats.model.js";
import { messageEvents } from "../sockets/events/message.events.js";
import { getIO } from "../sockets/socket.instance.js";

export const saveMessage = async (data) => {
  return await messageModel.insertMessage(data);
};

export const markDelivered = async (messageIds, userId) => {
  return await messageModel.markDeliveredModel(messageIds, userId);
};

export const markSeen = async (ids, userId) => {
  return await messageModel.markSeenModel(ids, userId);
};

export const sendMessageServiceBySocket = async ({
  sender_id, sender_device_id, receiver_id, reciver_device_id, conversation_id, encrypted_payload,
  created_at, message_type, timestamp,
}) => {
  const io = getIO();
  const messageId = conversation_id;
  const formattedMsg = {
    id: messageId, sender_id, sender_device_id, receiver_id, reciver_device_id,
    conversation_id, created_at, encrypted_payload, message_type, timestamp, status: "sent"
  };
  const redisKey = `offline:${receiver_id}:${reciver_device_id}`;
  await redis.rpush(redisKey, JSON.stringify(formattedMsg));
  const senderRoom = `user:${sender_id}:device:${sender_device_id}`;
  io.to(senderRoom).emit("message_sent_ack", { message_id: messageId, conversation_id, status: "sent" });

  const receiverRoom = `user:${receiver_id}:device:${reciver_device_id}`;
  const sockets = await io.in(receiverRoom).fetchSockets();

  if (sockets.length > 0) {
    io.to(receiverRoom).emit("chat_receive", { ...formattedMsg, status: "delivered" });
    console.log("✅ Real-time sent to receiver device:", reciver_device_id);
    io.to(senderRoom).emit("message_delivered", { message_id: messageId, conversation_id, status: "delivered" });
  }

  setTimeout(async () => {
    try {
      const stillOnline = await io.in(receiverRoom).fetchSockets();
      if (stillOnline.length === 0) {
        const messages = await redis.lrange(redisKey, 0, -1);
        if (messages.length > 0) {
          for (const msgStr of messages) {
            const msg = JSON.parse(msgStr);
            await messageModel.insertMessage({
              id: msg.conversation_id, sender_id: msg.sender_id, receiver_id: msg.receiver_id,
              conversation_id: msg.conversation_id, encrypted_payload: msg.encrypted_payload,
              created_at: msg.created_at, message_type: msg.message_type, status: "sent", sender_device_id: msg.sender_device_id,
              reciver_device_id: msg.reciver_device_id,timestamp: msg.timestamp
            });
          }
          await redis.del(redisKey);
          console.log("✅ Redis → DB moved after 1 min");
        }
      }
    } catch (err) {
      console.error("❌ Background DB move error:", err);
    }
  }, 60000);
  return formattedMsg;
};

export const messageReadService = async (data) => {
  messageEvents.emit("message_read", data);
  return { success: true };
};
