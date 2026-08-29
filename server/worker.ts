/**
 * BullMQ Worker — run alongside the Next.js dev server:
 *   npm run worker:dev
 *
 * Processes two queues:
 *   1. chat-generation  — calls FastAPI /chat | /ask | /generate-flashcards,
 *                          writes the assistant message to MongoDB.
 *   2. document-processing — sends a file (base64) to FastAPI /upload,
 *                             optionally triggers a chat generation job after.
 */

import { Worker, type Job } from "bullmq";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import Redis from "ioredis";
import http from "http";
import type { ChatJobPayload, DocumentJobPayload } from "../lib/Types";

dotenv.config({ path: ".env.local" });

// ─── Connections ──────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL as string;
const MONGODB_URI = process.env.MONGODB_URI as string;
const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";
const QDRANT_ENDPOINT = process.env.QDRANT_ENDPOINT ?? process.env.QDRANT_URL;
const WORKER_URL = process.env.WORKER_URL ?? process.env.RENDER_EXTERNAL_URL;

const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    tls: REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

let _mongoClient: MongoClient | null = null;
async function getDb() {
    if (!_mongoClient) {
        _mongoClient = new MongoClient(MONGODB_URI);
        await _mongoClient.connect();
    }
    return _mongoClient.db();
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractText(content: unknown): string {
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
        return content
            .map((block: unknown) => {
                if (typeof block === "object" && block !== null) {
                    const b = block as Record<string, unknown>;
                    if (b.type === "text" && typeof b.text === "string") return b.text;
                }
                if (typeof block === "string") return block;
                return "";
            })
            .join("")
            .trim();
    }
    return String(content ?? "").trim();
}

function getCourseQuery(courseId: string) {
    return { _id: courseId } as any;
}

// ─── Chat Generation Worker ───────────────────────────────────────────────

const chatWorker = new Worker<ChatJobPayload>(
    "chat-generation",
    async (job: Job<ChatJobPayload>) => {
        const { courseId, userId, message, mode, history } = job.data;

        const endpoint =
            mode === "chat"
                ? "/chat"
                : mode === "ask"
                    ? "/ask"
                    : "/generate-flashcards";

        const body =
            mode === "flashcards"
                ? { query: message, user_id: userId, course_id: courseId, num_cards: 5 }
                : mode === "ask"
                    ? { query: message, user_id: userId, course_id: courseId }
                    : { query: message, history };

        // Call FastAPI
        const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`FastAPI ${endpoint} failed (${res.status}): ${text}`);
        }

        const generation = (await res.json()) as Record<string, unknown>;

        // Build assistant message
        const now = new Date();
        const assistantMessage: Record<string, unknown> = {
            role: "assistant",
            type: mode === "flashcards" ? "flashcards" : mode === "ask" ? "answer" : "chat",
            createdAt: now,
        };

        if (mode === "flashcards") {
            assistantMessage.flashcards = Array.isArray(generation.flashcards) ? generation.flashcards : [];
        } else {
            const rawContent =
                generation.answer ?? generation.message ?? generation.response ?? generation.content ?? generation;
            assistantMessage.content =
                typeof rawContent === "string" ? rawContent : extractText(rawContent);
            if (mode === "ask" && Array.isArray(generation.sources)) {
                assistantMessage.sources = generation.sources;
            }
        }

        // Save to MongoDB
        const db = await getDb();
        await db.collection("courses").updateOne(
            getCourseQuery(courseId),
            {
                $push: { "chat.messages": assistantMessage as any },
                $set: { "chat.updatedAt": now },
            } as any
        );

        return assistantMessage;
    },
    {
        connection,
        concurrency: 5,
        removeOnComplete: { count: 200, age: 60 * 60 },
        removeOnFail: { count: 100, age: 60 * 60 * 24 },
    }
);

// ─── Document Processing Worker ───────────────────────────────────────────

const documentWorker = new Worker<DocumentJobPayload>(
    "document-processing",
    async (job: Job<DocumentJobPayload>) => {
        const { courseId, userId, fileBase64, fileName, fileMime } = job.data;

        // Re-create the file from base64
        const bytes = Buffer.from(fileBase64, "base64");
        const blob = new Blob([bytes], { type: fileMime });
        const file = new File([blob], fileName, { type: fileMime });

        const form = new FormData();
        form.append("file", file);
        form.append("user_id", userId);
        form.append("course_id", courseId);

        const uploadRes = await fetch(`${FASTAPI_URL}/upload`, {
            method: "POST",
            body: form,
        });

        if (!uploadRes.ok) {
            const text = await uploadRes.text();
            throw new Error(`FastAPI /upload failed (${uploadRes.status}): ${text}`);
        }

        const uploadResult = await uploadRes.json();

        // Update job status in MongoDB
        const db = await getDb();
        await db.collection("courses").updateOne(
            getCourseQuery(courseId),
            { $set: { "lastUpload": { fileName, status: "processed", uploadedAt: new Date() } } } as any
        );

        return { uploadResult, fileName };
    },
    {
        connection,
        concurrency: 3,
        removeOnComplete: { count: 100, age: 60 * 60 },
        removeOnFail: { count: 50, age: 60 * 60 * 24 },
    }
);

// ─── Lifecycle ────────────────────────────────────────────────────────────

chatWorker.on("completed", (job: Job) => {
    console.log(`[chat-worker] ✓ Job ${job.id} (courseId=${job.data.courseId}) completed`);
});
chatWorker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(`[chat-worker] ✗ Job ${job?.id} failed: ${err.message}`);
});

documentWorker.on("completed", (job: Job) => {
    console.log(`[doc-worker] ✓ Job ${job.id} (file=${job.data.fileName}) completed`);
});
documentWorker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(`[doc-worker] ✗ Job ${job?.id} failed: ${err.message}`);
});

process.on("SIGINT", async () => {
    console.log("Shutting down workers...");
    await chatWorker.close();
    await documentWorker.close();
    await connection.quit();
    process.exit(0);
});

// ─── HTTP Health Server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const server = http.createServer((req, res) => {
    if (req.url === "/ping" || req.url === "/health" || req.url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                status: "ok",
                service: "notely-bullmq-worker",
                timestamp: new Date().toISOString(),
            })
        );
        return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
});

server.listen(PORT, () => {
    console.log(`🚀 BullMQ Worker health check server listening on port ${PORT}`);
    console.log("🚀 Notely Workers active — listening on: chat-generation | document-processing");
});

// ─── Auto Keep-Alive Pinger (Prevents Render / Qdrant Free Tier Sleeping) ──
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

async function pingServices() {
    const timestamp = new Date().toISOString();
    console.log(`[keep-alive] 🔄 Running keep-alive ping at ${timestamp}...`);

    // 1. Ping FastAPI
    if (FASTAPI_URL && !FASTAPI_URL.includes("localhost")) {
        try {
            const res = await fetch(`${FASTAPI_URL}/ping`);
            console.log(`[keep-alive] ✓ FastAPI ping response: ${res.status}`);
        } catch (err: any) {
            console.warn(`[keep-alive] ⚠️ FastAPI ping failed: ${err.message}`);
        }
    }

    // 2. Ping Qdrant Cloud
    if (QDRANT_ENDPOINT && !QDRANT_ENDPOINT.includes("localhost")) {
        try {
            const cleanUrl = QDRANT_ENDPOINT.replace(/\/$/, "");
            const res = await fetch(`${cleanUrl}/healthz`);
            console.log(`[keep-alive] ✓ Qdrant ping response: ${res.status}`);
        } catch (err: any) {
            console.warn(`[keep-alive] ⚠️ Qdrant ping failed: ${err.message}`);
        }
    }

    // 3. Self-ping Worker (if URL provided)
    if (WORKER_URL && !WORKER_URL.includes("localhost")) {
        try {
            const cleanUrl = WORKER_URL.replace(/\/$/, "");
            const res = await fetch(`${cleanUrl}/ping`);
            console.log(`[keep-alive] ✓ Worker self-ping response: ${res.status}`);
        } catch (err: any) {
            console.warn(`[keep-alive] ⚠️ Worker self-ping failed: ${err.message}`);
        }
    }
}

// Initial delay before first ping, then recurring every 10 minutes
setTimeout(() => {
    pingServices();
    setInterval(pingServices, PING_INTERVAL_MS);
}, 60 * 1000);
