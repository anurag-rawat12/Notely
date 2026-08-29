import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { connection } from "@/server/Queue";

export const dynamic = "force-dynamic";

export async function GET() {
    const results: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    const fastApiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";
    const qdrantEndpoint = process.env.QDRANT_ENDPOINT ?? process.env.QDRANT_URL;
    const workerUrl = process.env.WORKER_URL;

    // 1. Ping FastAPI
    try {
        const start = Date.now();
        const res = await fetch(`${fastApiUrl}/ping`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
        results.fastapi = { status: res.ok ? "healthy" : `status_${res.status}`, latencyMs: Date.now() - start };
    } catch (err: any) {
        results.fastapi = { status: "unreachable", error: err.message };
    }

    // 2. Ping Worker
    if (workerUrl) {
        try {
            const start = Date.now();
            const res = await fetch(`${workerUrl}/ping`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
            results.worker = { status: res.ok ? "healthy" : `status_${res.status}`, latencyMs: Date.now() - start };
        } catch (err: any) {
            results.worker = { status: "unreachable", error: err.message };
        }
    }

    // 3. Ping Qdrant
    if (qdrantEndpoint) {
        try {
            const cleanUrl = qdrantEndpoint.replace(/\/$/, "");
            const start = Date.now();
            const res = await fetch(`${cleanUrl}/healthz`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
            results.qdrant = { status: res.ok ? "healthy" : `status_${res.status}`, latencyMs: Date.now() - start };
        } catch (err: any) {
            results.qdrant = { status: "unreachable", error: err.message };
        }
    }

    // 4. Ping MongoDB
    try {
        const start = Date.now();
        const client = await clientPromise;
        await client.db().command({ ping: 1 });
        results.mongodb = { status: "healthy", latencyMs: Date.now() - start };
    } catch (err: any) {
        results.mongodb = { status: "unreachable", error: err.message };
    }

    // 5. Ping Redis
    try {
        const start = Date.now();
        await connection.ping();
        results.redis = { status: "healthy", latencyMs: Date.now() - start };
    } catch (err: any) {
        results.redis = { status: "unreachable", error: err.message };
    }

    const allHealthy = Object.values(results).every((r) => r.status === "healthy");

    return NextResponse.json(
        {
            status: allHealthy ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            services: results,
        },
        { status: allHealthy ? 200 : 207 }
    );
}
