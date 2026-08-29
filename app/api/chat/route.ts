import { NextRequest, NextResponse } from "next/server";
import { getCourseIdQuery } from "@/lib/server-utils";
import clientPromise from "@/lib/mongodb";
import { chatQueue } from "@/server/Queue";
import { auth0 } from "@/lib/auth0";
import type { ChatJobPayload } from "@/lib/Types";

type Mode = "chat" | "ask" | "flashcards";

type CourseDocument = {
    _id: unknown;
    userId: string;
    collaborators?: string[];
    chat: {
        messages: Array<{
            role: "user" | "assistant";
            type: string;
            content?: string;
            createdAt: Date;
        }>;
        updatedAt: Date;
    };
};

function error(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();

    const messageValue = formData.get("message");
    const modeValue = formData.get("mode");
    const userId = formData.get("user_id");
    const courseId = formData.get("course_id");

    const message = typeof messageValue === "string" ? messageValue.trim() : "";
    const mode = modeValue as Mode;

    const files = formData
        .getAll("files")
        .filter((value): value is File => value instanceof File);

    // Validate required fields
    if (!userId || typeof userId !== "string" || !courseId || typeof courseId !== "string") {
        return error("user_id and course_id are required.");
    }

    if (!(["chat", "ask", "flashcards"] as const).includes(mode)) {
        return error("Invalid mode.");
    }

    if (!message && files.length === 0) {
        return error("A message or file is required.");
    }

    const fastApiUrl = process.env.FASTAPI_URL ?? "http://localhost:8000";

    // Authentication
    const session = await auth0.getSession();
    const auth0ID = session?.user?.sub.includes("|")
        ? session.user.sub.split("|")[1]
        : session?.user?.sub;
    const userEmail = session?.user?.email;

    // Database
    const client = await clientPromise;
    const courses = client.db().collection<CourseDocument>("courses");

    const course = await courses.findOne(getCourseIdQuery(courseId) as any);
    if (!course) return error("Course not found.", 404);

    const isOwner = course.userId === auth0ID;
    const isCollaborator = Boolean(userEmail && course.collaborators?.includes(userEmail));
    if (!isOwner && !isCollaborator) return error("Access denied to this course.", 403);

    // ── Upload files to FastAPI (synchronous — relatively fast) ──────────
    const uploadResults: unknown[] = [];

    for (const file of files) {
        const forwardForm = new FormData();
        forwardForm.append("file", file);
        forwardForm.append("user_id", userId);
        forwardForm.append("course_id", courseId);

        let uploadRes: Response;
        try {
            uploadRes = await fetch(`${fastApiUrl}/upload`, {
                method: "POST",
                body: forwardForm,
            });
        } catch {
            return error("Could not reach the FastAPI service for upload.", 502);
        }

        if (!uploadRes.ok) {
            return error(`Upload failed: ${await uploadRes.text()}`, 502);
        }
        uploadResults.push(await uploadRes.json());
    }

    // ── Save user message to MongoDB ─────────────────────────────────────
    const now = new Date();
    const messages = course.chat?.messages ?? [];
    const lastMsg = messages[messages.length - 1];
    const isAlreadyAdded = lastMsg && lastMsg.role === "user" && lastMsg.content === message;

    if (!isAlreadyAdded && (message || files.length > 0)) {
        const userMessage: Record<string, unknown> = {
            role: "user",
            type: mode,
            createdAt: now,
        };
        if (message) userMessage.content = message;

        await courses.updateOne(
            getCourseIdQuery(courseId) as any,
            { $push: { "chat.messages": userMessage as any }, $set: { "chat.updatedAt": now } } as any
        );
    }

    if (!message) {
        return NextResponse.json({ message: null, uploads: uploadResults });
    }

    // ── Build history (text-only prior turns) ─────────────────────────────
    const history = (course.chat?.messages ?? [])
        .filter((m) => m.content && typeof m.content === "string" && m.content.trim())
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.trim() }));

    // ── Enqueue BullMQ job (async) — return jobId immediately ────────────
    const job = await chatQueue.add(
        "generate",
        {
            jobType: mode,
            courseId,
            userId,
            message,
            mode,
            history,
        } satisfies ChatJobPayload,
        {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
        }
    );

    return NextResponse.json({
        jobId: job.id,
        status: "queued",
        uploads: uploadResults,
    });
}