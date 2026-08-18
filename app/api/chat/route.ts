import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth0 } from "@/lib/auth0";
import type { ChatMessage, Flashcard } from "@/lib/Types";
import { extractTextContent } from "@/lib/utils";
import { getCourseIdQuery } from "@/lib/server-utils";

type Mode = "chat" | "ask" | "flashcards";

type CourseDocument = {
    _id: unknown;
    userId: string;
    collaborators?: string[];
    chat: {
        messages: ChatMessage[];
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

    const message =
        typeof messageValue === "string" ? messageValue.trim() : "";

    const mode = modeValue as Mode;

    const files = formData
        .getAll("files")
        .filter((value): value is File => value instanceof File);

    // Validate required fields
    if (
        !userId ||
        typeof userId !== "string" ||
        !courseId ||
        typeof courseId !== "string"
    ) {
        return error("user_id and course_id are required.");
    }

    if (!(["chat", "ask", "flashcards"] as const).includes(mode)) {
        return error("Invalid mode.");
    }

    if (!message && files.length === 0) {
        return error("A message or file is required.");
    }

    // FastAPI configuration
    const fastApiUrl =
        process.env.FASTAPI_URL ??
        "http://localhost:8000";

    if (!fastApiUrl) {
        return error(
            "FASTAPI_URL (or BACKEND_URL) is not configured.",
            500,
        );
    }

    // Authentication
    const session = await auth0.getSession();

    const auth0ID = session?.user?.sub.split("|")[1];
    const userEmail = session?.user?.email;

    // Database
    const client = await clientPromise;
    const courses = client
        .db()
        .collection<CourseDocument>("courses");

    const course = await courses.findOne(
        getCourseIdQuery(courseId) as any,
    );

    if (!course) {
        return error("Course not found.", 404);
    }

    const isOwner = course.userId === auth0ID;

    const isCollaborator = Boolean(
        userEmail && course.collaborators?.includes(userEmail),
    );

    if (!isOwner && !isCollaborator) {
        return error("Access denied to this course.", 403);
    }

    // Upload files to FastAPI
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
            return error(
                "Could not reach the FastAPI service for upload.",
                502,
            );
        }

        if (!uploadRes.ok) {
            return error(
                `Upload failed: ${await uploadRes.text()}`,
                502,
            );
        }

        uploadResults.push(await uploadRes.json());
    }

    // Add user message to chat
    const now = new Date();
    const messages = course.chat?.messages ?? [];
    const lastMsg = messages[messages.length - 1];

    // Check if the message was already added optimistically
    const isAlreadyAdded =
        lastMsg &&
        lastMsg.role === "user" &&
        lastMsg.content === message;

    if (!isAlreadyAdded && (message || files.length > 0)) {
        const userMessage: ChatMessage = {
            role: "user",
            type: mode,
            createdAt: now,
        };

        if (message) {
            userMessage.content = message;
        }

        await courses.updateOne(
            getCourseIdQuery(courseId) as any,
            {
                $push: {
                    "chat.messages": userMessage,
                },
                $set: {
                    "chat.updatedAt": now,
                },
            } as any,
        );
    }

    // If there is no message, only return upload results
    if (!message) {
        return NextResponse.json({
            message: null,
            uploads: uploadResults,
        });
    }

    // Build conversation history from existing messages (all prior turns, text-only)
    const chatHistory = (course.chat?.messages ?? [])
        .filter((msg) => msg.content && typeof msg.content === "string" && msg.content.trim())
        .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content!.trim(),
        }));

    // Determine FastAPI endpoint
    const endpoint =
        mode === "chat"
            ? "/chat"
            : mode === "ask"
                ? "/ask"
                : "/generate-flashcards";

    const body =
        mode === "flashcards"
            ? {
                query: message,
                user_id: userId,
                course_id: courseId,
                num_cards: 5,
            }
            : mode === "ask"
                ? {
                    query: message,
                    user_id: userId,
                    course_id: courseId,
                }
                : {
                    // chat mode — include full history so LLM has context
                    query: message,
                    history: chatHistory,
                };

    // Generate response from FastAPI
    let generationRes: Response;

    try {
        generationRes = await fetch(`${fastApiUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    } catch {
        return error(
            "Could not reach the FastAPI service for generation.",
            502,
        );
    }

    if (!generationRes.ok) {
        return error(
            `Generation failed: ${await generationRes.text()}`,
            502,
        );
    }

    const generation =
        (await generationRes.json()) as Record<string, unknown>;

    console.log("Generation response:", generation);

    // Build assistant message
    const assistantMessage: ChatMessage = {
        role: "assistant",
        type:
            mode === "flashcards"
                ? "flashcards"
                : mode === "ask"
                    ? "answer"
                    : "chat",
        createdAt: new Date(),
    };

    if (mode === "flashcards") {
        assistantMessage.flashcards = (
            Array.isArray(generation.flashcards)
                ? generation.flashcards
                : []
        ) as Flashcard[];
    } else {
        const rawContent =
            generation.answer ??
            generation.message ??
            generation.response ??
            generation.content ??
            generation;

        assistantMessage.content =
            typeof rawContent === "string"
                ? rawContent
                : extractTextContent(rawContent);

        if (
            mode === "ask" &&
            Array.isArray(generation.sources)
        ) {
            assistantMessage.sources =
                generation.sources as number[];
        }
    }

    // Save assistant message
    await courses.updateOne(
        getCourseIdQuery(courseId) as any,
        {
            $push: {
                "chat.messages": assistantMessage,
            },
            $set: {
                "chat.updatedAt": assistantMessage.createdAt,
            },
        } as any,
    );

    return NextResponse.json({
        message: assistantMessage,
        uploads: uploadResults,
    });
}