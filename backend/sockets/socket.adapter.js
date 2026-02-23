// import { createAdapter } from "@socket.io/redis-adapter";
// import { createClient } from "redis";

// export const initSocketAdapter = async (io) => {
//   const pubClient = createClient({ url: process.env.REDIS_URL });
//   const subClient = pubClient.duplicate();

//   await pubClient.connect();
//   await subClient.connect();

//   io.adapter(createAdapter(pubClient, subClient));
//   console.log("✅ Redis Socket Adapter Connected");
// };


// ----------------------------render on live so right now i m using this one pproch

import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

export const initSocketAdapter = async (io) => {
  // ✅ If Redis not configured → skip adapter
  if (!process.env.REDIS_URL) {
    console.log("⚠️ Redis Socket Adapter disabled (no REDIS_URL)");
    return;
  }

  try {
    const pubClient = createClient({
      url: process.env.REDIS_URL,
    });

    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));

    console.log("✅ Redis Socket Adapter Connected");
  } catch (err) {
    console.error("❌ Redis Adapter failed:", err.message);
  }
};