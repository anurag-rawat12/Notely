import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { auth0 } from "@/lib/auth0";
import { getCourseIdQuery } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { courseId } = await request.json();
        if (!courseId || typeof courseId !== "string") {
            return NextResponse.json({ error: "Valid courseId is required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const course = await db.collection("courses").findOne(getCourseIdQuery(courseId) as any);

        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // Only owner or collaborator can generate/view share link
        const isOwner = course.userId === session.user.sub.split("|")[1];
        const isCollaborator = Boolean(session.user.email && course.collaborators?.includes(session.user.email));
        if (!isOwner && !isCollaborator) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        if (course.publicShareId) {
            return NextResponse.json({ publicShareId: course.publicShareId });
        }

        const publicShareId = crypto.randomUUID();
        await db.collection("courses").updateOne(
            getCourseIdQuery(courseId) as any,
            { $set: { publicShareId } }
        );

        return NextResponse.json({ publicShareId });
    } catch (error) {
        console.error("Error generating share link:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
