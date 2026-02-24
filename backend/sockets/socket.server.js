import { Server } from "socket.io";
import { setIO } from "./socket.instance.js";
import { socketAuth } from "./socket.auth.js";
import { initSocketAdapter } from "./socket.adapter.js";
import { initMessageListener } from "./events/message.listener.js";
import * as messageModel from "../model/chats.model.js";
import chatGateway from "./gateways/chat.gateway.js";
import redis from "../config/redis.js";

export const initSocketServer = async (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    }
  });

  setIO(io);
  await initSocketAdapter(io);
  initMessageListener();
  io.use(socketAuth);

  io.on("connection", async (socket) => {
    try {
      const { userId, deviceId } = socket;
      const deviceRoom = `user:${userId}:device:${deviceId}`;
      await socket.join(deviceRoom);
      try {
        await messageModel.setUserOnline(userId, deviceId);
      } catch (e) {
        console.error("Set user online error:", e);
      }
      console.log("🟢 Socket connected:", socket.id, "User:", userId, "Device:", deviceId);
      socket.emit("socket_ready");
      let allMessages = [];
      let dbMessages = [];
      try {
        dbMessages = await messageModel.getPendingMessagesByDevice(userId, deviceId);
      } catch (e) {
        console.error("DB fetch error:", e);
        dbMessages = [];
      }
      if (!Array.isArray(dbMessages)) { dbMessages = []; }
      allMessages.push(...dbMessages.map(msg => ({ ...msg, created_at: msg.created_at ? new Date(msg.created_at).getTime() : Date.now() }))
      );

      const redisKey = `offline:${userId}:${deviceId}`;
      let redisMessages = [];
      try {
        redisMessages = await redis.lrange(redisKey, 0, -1);
      } catch (e) {
        console.error("Redis fetch error:", e);
        redisMessages = [];
      }
      if (!Array.isArray(redisMessages)) { redisMessages = []; }

      for (const msgStr of redisMessages) {
        try {
          const msg = JSON.parse(msgStr); allMessages.push({ ...msg, created_at: msg.created_at ? new Date(msg.created_at).getTime() : Date.now() });
        } catch (e) {
          console.error("Redis parse error:", e);
        }
      }
      allMessages.sort((a, b) => a.created_at - b.created_at);

      // setTimeout(() => {
      //   for (const msg of allMessages) {
      //     socket.emit("chat_receive", { ...msg, encrypted_payload: msg.encrypted_payload ? msg.encrypted_payload.toString() : null });
      //     const senderRoom = `user:${msg.sender_id}:device:${msg.sender_device_id}`;
      //     io.to(senderRoom).emit("message_delivered", { message_id: msg.id, conversation_id: msg.conversation_id, status: "delivered" });
      //   }
      // }, 500);

      // ---------------------------new flow------------------------------------------------------//
      setTimeout(async () => {
        for (const msg of allMessages) {
          if (msg.status !== "sent") continue;
          socket.emit("chat_receive", {...msg,encrypted_payload: msg.encrypted_payload? msg.encrypted_payload.toString(): null});
          const senderRoom =`user:${msg.sender_id}:device:${msg.sender_device_id}`;
          io.to(senderRoom).emit("message_delivered", {message_id: msg.id,conversation_id: msg.conversation_id,status: "delivered"});

          //UPDATE DB IF MESSAGE CAME FROM DB
          if (!msg.source || msg.source === "db") {
            await messageModel.updateMessageStatus(msg.id, "delivered");
          }
 
          // 🔥 UPDATE REDIS IF MESSAGE CAME FROM REDIS
          if (msg.source === "redis") {
            const redisKey = `offline:${userId}:${deviceId}`;
            const messages = await redis.lrange(redisKey, 0, -1);
            for (const msgStr of messages) {
              const redisMsg = JSON.parse(msgStr);
              if (redisMsg.id === msg.id) {
                const updatedMsg = {...redisMsg,status: "delivered"};
                await redis.lrem(redisKey, 0, msgStr);
                await redis.rpush(redisKey, JSON.stringify(updatedMsg));
                break;
              }
            }
          }
        }
      }, 500);

      // --------------------------end of flow ------------------------------------------------------//
      chatGateway(io, socket);

      socket.on("disconnect", async () => {
        try {
          await messageModel.setUserOffline(userId, deviceId);
        } catch (e) {
          console.error("Set user offline error:", e);
        }
        console.log("🔴 Socket disconnected:", socket.id);
      });
    } catch (err) {
      console.error("❌ Socket Error:", err);
      socket.disconnect(true);
    }
  });


};
