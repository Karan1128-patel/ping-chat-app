import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,

  // 🔥 REQUIRED FOR BULLMQ
  maxRetriesPerRequest: null,
  enableReadyCheck: false,

});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});

export default redis;



// ----------------------------render on live so right now i m using this one pproch

// import Redis from "ioredis";

// let redis = null;

// if (process.env.REDIS_URL) {
//   // Production (Render / Cloud)
//   redis = new Redis(process.env.REDIS_URL, {
//     maxRetriesPerRequest: null,
//   });

//   redis.on("connect", () => {
//     console.log("✅ Redis connected");
//   });

//   redis.on("error", (err) => {
//     console.error("❌ Redis error:", err.message);
//   });
// } else {
//   console.log("⚠️ Redis disabled (no REDIS_URL provided)");
// }

// export default redis;
