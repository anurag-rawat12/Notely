import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({ error: "Direct upload endpoint not implemented. Use /api/chat or /api/upload/avatar." }, { status: 501 });
}