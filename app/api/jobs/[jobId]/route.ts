import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Job polling endpoint — kept as a stub in case needed later.
// BullMQ/Redis has been removed; this returns not_found for all jobs.
export async function GET() {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
}
