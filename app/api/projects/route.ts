import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth0 } from "@/lib/auth0";

// GET /api/projects — list all projects for authenticated user
export async function GET() {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.sub.includes("|") ? session.user.sub.split("|")[1] : session.user.sub;
        const client = await clientPromise;
        const db = client.db();

        const projects = await db
            .collection("projects")
            .find({ userId })
            .sort({ updatedAt: -1, createdAt: -1 })
            .toArray();

        return NextResponse.json({ projects });
    } catch (err) {
        console.error("GET /api/projects error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = session.user.sub.includes("|") ? session.user.sub.split("|")[1] : session.user.sub;
        const { name, description, color } = await request.json();

        if (typeof name !== "string" || !name.trim()) {
            return NextResponse.json({ error: "Project name is required." }, { status: 400 });
        }

        const projectId = crypto.randomUUID();
        const now = new Date();

        const client = await clientPromise;
        await client.db().collection("projects").insertOne({
            _id: projectId as any,
            userId,
            name: name.trim().slice(0, 80),
            description: typeof description === "string" ? description.trim().slice(0, 300) : undefined,
            color: typeof color === "string" ? color : "default",
            createdAt: now,
            updatedAt: now,
        });

        return NextResponse.json({ projectId, name: name.trim() }, { status: 201 });
    } catch (err) {
        console.error("POST /api/projects error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
