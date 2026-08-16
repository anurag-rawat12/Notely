import { Queue } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const connection = new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
});

export const documentQueue = new Queue("document-processing", { connection });