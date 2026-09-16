import { Queue } from "bullmq";
import { createRedisConnection } from "./redis.js";

export let feedQueue = null;
let feedQueueConnection = null;

export const startFeedQueue = async () => {
  if (feedQueue) return feedQueue;

  feedQueueConnection = createRedisConnection("social-forum-feed-queue");
  feedQueue = new Queue("feedQueue", {
    connection: feedQueueConnection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 500,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    },
  });

  await feedQueue.waitUntilReady();
  return feedQueue;
};

// Hàm hỗ trợ thêm Job vào hàng đợi
export const addJobToFeedQueue = async (jobName, data) => {
  if (!feedQueue) throw new Error("Feed queue is not ready");
  return feedQueue.add(jobName, data);
};

export const stopFeedQueue = async () => {
  if (!feedQueue) return;
  await feedQueue.close();
  feedQueue = null;
  if (feedQueueConnection && !["end", "wait"].includes(feedQueueConnection.status)) {
    await feedQueueConnection.quit();
  }
  feedQueueConnection = null;
};
