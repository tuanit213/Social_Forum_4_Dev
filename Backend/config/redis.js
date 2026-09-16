import Redis from "ioredis";

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getRedisConfig = () => ({
  url: process.env.REDIS_URL?.trim() || "",
  host: process.env.REDIS_HOST?.trim() || "127.0.0.1",
  port: parseInteger(process.env.REDIS_PORT, 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInteger(process.env.REDIS_DB, 0),
  connectTimeout: parseInteger(process.env.REDIS_CONNECT_TIMEOUT_MS, 5000),
  maxRetries: parseInteger(process.env.REDIS_MAX_RETRIES, 10),
});

export const createRedisConnection = (name = "redis") => {
  const config = getRedisConfig();
  const commonOptions = {
    connectionName: name,
    lazyConnect: true,
    enableReadyCheck: true,
    connectTimeout: config.connectTimeout,
    maxRetriesPerRequest: null,
    retryStrategy(attempt) {
      if (attempt > config.maxRetries) return null;
      return Math.min(attempt * 250, 5000);
    },
  };

  const client = config.url
    ? new Redis(config.url, commonOptions)
    : new Redis({
        ...commonOptions,
        host: config.host,
        port: config.port,
        password: config.password,
        db: config.db,
      });

  client.on("error", (error) => {
    console.error(`[${name}] Redis error: ${error.message}`);
  });

  return client;
};

const redisClient = createRedisConnection("social-forum-app");

export const connectRedis = async () => {
  if (redisClient.status === "wait") await redisClient.connect();
  const response = await redisClient.ping();
  if (response !== "PONG") throw new Error("Redis ping failed");
  console.log("Redis connected");
  return true;
};

export const isRedisReady = () => redisClient.status === "ready";

export const getRedisHealth = () => ({
  ready: isRedisReady(),
  state: redisClient.status,
});

export const disconnectRedis = async () => {
  if (!["end", "wait"].includes(redisClient.status)) {
    await redisClient.quit();
  }
};

export default redisClient;
