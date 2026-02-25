import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const messageQueue = new Queue("messageQueue", {
    connection: redis,
});