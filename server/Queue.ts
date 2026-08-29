import { Queue } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const connection = new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

/** Queue for enqueueing chat/ask/flashcard generation jobs */
export const chatQueue = new Queue("chat-generation", { connection });

/** Queue for document upload processing (file → FastAPI RAG indexing) */
export const documentQueue = new Queue("document-processing", { connection });