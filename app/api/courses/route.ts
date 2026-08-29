import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCourseIdQuery } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const { userId, name, courseId, projectId, initialMessage, mode } = await request.json();

        if (typeof userId !== "string" || !userId) {
            return NextResponse.json({ error: "userId is required." }, { status: 400 });
        }

        const finalCourseId = (typeof courseId === "string" && courseId.trim())
            ? courseId.trim()
            : crypto.randomUUID();

        const courseTitle = (typeof name === "string" && name.trim())
            ? name.trim().slice(0, 100)
            : "New conversation";

        const now = new Date();
        const initialMessages = [];
        if (typeof initialMessage === "string" && initialMessage.trim()) {
            initialMessages.push({
                role: "user",
                content: initialMessage.trim(),
                type: mode ?? "chat",
                createdAt: now,
            });
        }

        const doc: Record<string, unknown> = {
            _id: finalCourseId,
            userId,
            name: courseTitle,
            chat: { messages: initialMessages, updatedAt: now },
            createdAt: now,
        };

        // Attach to project if provided
        if (typeof projectId === "string" && projectId.trim()) {
            doc.projectId = projectId.trim();
        }

        const client = await clientPromise;
        await client.db().collection("courses").insertOne(doc as any);

        return NextResponse.json({ courseId: finalCourseId }, { status: 201 });
    } catch (error) {
        console.error("Error creating course:", error);
        return NextResponse.json({ error: "Failed to create course." }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { courseId, userId, name, pinned } = await request.json();
        if (typeof courseId !== "string" || !courseId || typeof userId !== "string") {
            return NextResponse.json({ error: "A valid courseId and userId are required." }, { status: 400 });
        }

        const updates: { name?: string; pinned?: boolean; "chat.updatedAt": Date } = { "chat.updatedAt": new Date() };
        if (name !== undefined) {
            if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Course name cannot be empty." }, { status: 400 });
            updates.name = name.trim().slice(0, 100);
        }
        if (pinned !== undefined) {
            if (typeof pinned !== "boolean") return NextResponse.json({ error: "pinned must be a boolean." }, { status: 400 });
            updates.pinned = pinned;
        }

        const client = await clientPromise;
        const result = await client.db().collection("courses").updateOne(
            { ...getCourseIdQuery(courseId), userId } as any,
            { $set: updates },
        );
        if (!result.matchedCount) return NextResponse.json({ error: "Course not found." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "Failed to update course." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get("course_id");
        const userId = searchParams.get("user_id");
        if (!courseId || !userId) {
            return NextResponse.json({ error: "A valid course_id and user_id are required." }, { status: 400 });
        }

        const client = await clientPromise;
        const result = await client.db().collection("courses").deleteOne({ 
            ...getCourseIdQuery(courseId), 
            userId 
        } as any);
        if (!result.deletedCount) return NextResponse.json({ error: "Course not found." }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting course:", error);
        return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
    }
}
