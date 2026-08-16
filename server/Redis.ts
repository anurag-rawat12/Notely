import Redis from "ioredis"
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });


const client = new Redis(process.env.REDIS_URL as string);
await client.set('foo', 'bar');