import { NextRequest, NextResponse } from "next/server";
import { chatQueue } from "@/server/Queue";

type Context = { params: Promise<{ jobId: string }> };

const POLL_INTERVAL_MS = 800;

export async function GET(_req: NextRequest, context: Context) {
    try {
        const { jobId } = await context.params;
        if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

        const job = await chatQueue.getJob(jobId);

        if (!job) {
            return NextResponse.json({ status: "not_found" }, { status: 404 });
        }

        const state = await job.getState();
        const result = job.returnvalue ?? null;
        const failReason = job.failedReason ?? null;

        return NextResponse.json({
            jobId,
            status: state,          // waiting | active | completed | failed | delayed
            result,
            error: failReason,
            attemptsMade: job.attemptsMade,
        });
    } catch (err) {
        console.error("GET /api/jobs/[jobId] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
