import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import clientPromise from "@/lib/mongodb";
import ChatHistory from "@/components/ChatHistory";
import CourseSidebar, { SidebarCourse } from "@/components/CourseSidebar";
import CourseHeader from "@/components/CourseHeader";
import { getUser } from "@/lib/helper";
import { DbUser } from "@/lib/Types";
import { getCourseIdQuery } from "@/lib/server-utils";

type CourseDoc = {
    _id: { toString(): string };
    name: string;
    userId: string;
    pinned?: boolean;
    createdAt?: Date;
    chat?: {
        messages?: unknown[];
        updatedAt?: Date;
    };
    collaborators?: string[];
    publicShareId?: string;
};

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
    const session = await auth0.getSession();
    if (!session?.user) return notFound();
    const { courseId } = await params;
    if (!courseId || typeof courseId !== "string") return notFound();

    const userEmail = session.user.email;
    const auth0ID = session.user.sub.split("|")[1];
    const dbUser = auth0ID ? ((await getUser(auth0ID)) as DbUser) : null;

    const client = await clientPromise;
    const db = client.db();

    // Query for courses owned by user OR shared with user as collaborator
    const accessQuery = {
        $or: [
            { userId: auth0ID },
            ...(userEmail ? [{ collaborators: userEmail }] : []),
        ],
    };

    const course = (await db.collection("courses").findOne({
        ...getCourseIdQuery(courseId),
        ...accessQuery,
    } as any)) as unknown as CourseDoc | null;

    if (!course) return notFound();

    const courses = (await db.collection("courses")
        .find(accessQuery)
        .sort({ pinned: -1, "chat.updatedAt": -1, createdAt: -1 })
        .toArray()) as unknown as CourseDoc[];

    const sidebarCourses: SidebarCourse[] = courses.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        pinned: item.pinned,
        isCollaborator: item.userId !== auth0ID,
        updatedAt: item.chat?.updatedAt ?? item.createdAt,
        messageCount: item.chat?.messages?.length ?? 0,
    }));

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <CourseSidebar
                courses={sidebarCourses}
                userId={auth0ID}
                dbUser={dbUser}
            />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <CourseHeader
                    courseId={courseId}
                    courseName={course.name}
                    publicShareId={course.publicShareId}
                    dbUser={dbUser}
                />
                <div className="flex-1 min-h-0">
                    <ChatHistory
                        initialMessages={(course.chat?.messages as any) ?? []}
                        courseId={courseId}
                        userId={auth0ID}
                    />
                </div>
            </main>
        </div>
    );
}
