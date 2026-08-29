import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const getRedisClient = () => {
    return new Redis(process.env.REDIS_URL as string, {
        maxRetriesPerRequest: null,
        tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
    });
};