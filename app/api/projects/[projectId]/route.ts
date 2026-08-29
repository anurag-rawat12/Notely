import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth0 } from "@/lib/auth0";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ projectId: string }> };

function userId(session: { user: { sub: string } }) {
    const sub = session.user.sub;
    return sub.includes("|") ? sub.split("|")[1] : sub;
}

// GET /api/projects/[projectId] — get project + its chats
export async function GET(_req: NextRequest, context: Context) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const uid = userId(session);
        const { projectId } = await context.params;

        const client = await clientPromise;
        const db = client.db();

        const project = await db.collection("projects").findOne({ _id: projectId as any, userId: uid });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        const chats = await db
            .collection("courses")
            .find({ projectId, userId: uid })
            .sort({ pinned: -1, "chat.updatedAt": -1, createdAt: -1 })
            .project({ "chat.messages": 0 }) // Don't return full message payloads in list view
            .toArray();

        return NextResponse.json({ project, chats });
    } catch (err) {
        console.error("GET /api/projects/[projectId] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/projects/[projectId] — rename or update project
export async function PATCH(request: NextRequest, context: Context) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const uid = userId(session);
        const { projectId } = await context.params;
        const { name, description, color } = await request.json();

        const updates: Record<string, unknown> = { updatedAt: new Date() };
        if (typeof name === "string" && name.trim()) updates.name = name.trim().slice(0, 80);
        if (typeof description === "string") updates.description = description.trim().slice(0, 300);
        if (typeof color === "string") updates.color = color;

        const client = await clientPromise;
        const result = await client
            .db()
            .collection("projects")
            .updateOne({ _id: projectId as any, userId: uid }, { $set: updates });

        if (!result.matchedCount) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("PATCH /api/projects/[projectId] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/projects/[projectId] — delete project and all its chats
export async function DELETE(_req: NextRequest, context: Context) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const uid = userId(session);
        const { projectId } = await context.params;

        const client = await clientPromise;
        const db = client.db();

        // Delete all chats inside the project
        await db.collection("courses").deleteMany({ projectId, userId: uid });

        // Delete the project itself
        const result = await db.collection("projects").deleteOne({ _id: projectId as any, userId: uid });
        if (!result.deletedCount) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("DELETE /api/projects/[projectId] error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
