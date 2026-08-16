import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth0 } from "@/lib/auth0";
import { getCourseIdQuery } from "@/lib/server-utils";

type Context = {
    params: Promise<{ courseId: string }>;
};

export async function GET(request: NextRequest, context: Context) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await context.params;
        if (!courseId || typeof courseId !== "string") {
            return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const course = await db.collection("courses").findOne(getCourseIdQuery(courseId) as any);

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        const isOwner = course.userId === session.user.sub;
        const isCollaborator = Boolean(session.user.email && course.collaborators?.includes(session.user.email));
        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        return NextResponse.json({ collaborators: course.collaborators ?? [] });
    } catch (error) {
        console.error("Error fetching collaborators:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, context: Context) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await context.params;
        if (!courseId || typeof courseId !== "string") {
            return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
        }

        const { email } = await request.json();
        const targetEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!targetEmail || !targetEmail.includes("@")) {
            return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const course = await db.collection("courses").findOne(getCourseIdQuery(courseId) as any);

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        if (course.userId !== session.user.sub) {
            return NextResponse.json({ error: "Only the course owner can invite collaborators." }, { status: 403 });
        }

        await db.collection("courses").updateOne(
            getCourseIdQuery(courseId) as any,
            { $addToSet: { collaborators: targetEmail as any } }
        );

        const updatedCourse = await db.collection("courses").findOne(getCourseIdQuery(courseId) as any);

        return NextResponse.json({
            success: true,
            collaborators: updatedCourse?.collaborators ?? []
        });
    } catch (error) {
        console.error("Error adding collaborator:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, context: Context) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await context.params;
        if (!courseId || typeof courseId !== "string") {
            return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const emailToRemove = searchParams.get("email")?.trim().toLowerCase();

        if (!emailToRemove) {
            return NextResponse.json({ error: "Email parameter is required." }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const course = await db.collection("courses").findOne(getCourseIdQuery(courseId) as any);

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        if (course.userId !== session.user.sub) {
            return NextResponse.json({ error: "Only the course owner can remove collaborators." }, { status: 403 });
        }

        await db.collection("courses").updateOne(
            getCourseIdQuery(courseId) as any,
            { $pull: { collaborators: emailToRemove as any } }
        );

        const updatedCourse = await db.collection("courses").findOne(getCourseIdQuery(courseId) as any);

        return NextResponse.json({
            success: true,
            collaborators: updatedCourse?.collaborators ?? []
        });
    } catch (error) {
        console.error("Error removing collaborator:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
