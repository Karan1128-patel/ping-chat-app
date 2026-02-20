import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

export const initSocketAdapter = async (io) => {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));
  console.log("✅ Redis Socket Adapter Connected");
};
