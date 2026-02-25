import { Worker } from "bullmq";
import redis from "../config/redis.js";
import { getIO } from "../sockets/socket.instance.js";
import * as messageModel from "../model/chats.model.js";

const worker = new Worker("messageQueue", async (job) => {
    const { receiverRoom, redisKey } = job.data;
    const io = getIO();
    const stillOnline = await io.in(receiverRoom).fetchSockets();
    if (stillOnline.length === 0) {
        const messages = await redis.lrange(redisKey, 0, -1);
        if (messages.length > 0) {
            for (const msgStr of messages) {
                const msg = JSON.parse(msgStr);
                await messageModel.insertMessage(msg);
            }
            await redis.del(redisKey);
            console.log("✅ Redis → DB moved by BullMQ");
        }
    }
},
    { connection: redis }
);

export default worker;