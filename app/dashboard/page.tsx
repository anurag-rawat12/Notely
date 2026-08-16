import DashboardClient from "@/components/DashboardClient";
import Profile from "@/components/Profile";
import Setting_dialog from "@/components/Setting_dialog";
import { ThemeToggleDropdown } from "@/components/ThemeToggle";
import Unauthorized from "@/components/unauthorized";
import { getAuth } from "@/lib/auth";
import { libertinus } from "@/lib/fonts";
import { getUser } from "@/lib/helper";
import { DbUser } from "@/lib/Types";
import clientPromise from "@/lib/mongodb";
import CourseSidebar, { SidebarCourse } from "@/components/CourseSidebar";
import Link from "next/link";
import { BookOpen, Clock, Users, ArrowUpRight, Sparkles, Plus } from "lucide-react";

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
};

export default async function DashboardPage() {
    const { user, session } = await getAuth();
    if (!user || !session) {
        return <Unauthorized />;
    }

    const auth0ID = user?.sub.split("|")[1];
    const dbUser = (await getUser(auth0ID as string)) as DbUser;
    const userEmail = session.user.email;

    const client = await clientPromise;
    const accessQuery = {
        $or: [
            { userId: session.user.sub },
            ...(userEmail ? [{ collaborators: userEmail }] : []),
        ],
    };

    const courses = (await client
        .db()
        .collection("courses")
        .find(accessQuery)
        .sort({ pinned: -1, "chat.updatedAt": -1, createdAt: -1 })
        .toArray()) as unknown as CourseDoc[];

    const time = new Date().getHours();
    const greetingTime = time < 12 ? "morning" : time < 18 ? "afternoon" : "evening";
    const firstName = dbUser?.name?.split(" ")[0] ?? "there";

    const sidebarCourses: SidebarCourse[] = courses.map((course) => ({
        id: course._id.toString(),
        name: course.name,
        pinned: course.pinned,
        isCollaborator: course.userId !== session.user.sub,
        updatedAt: course.chat?.updatedAt ?? course.createdAt,
        messageCount: course.chat?.messages?.length ?? 0,
    }));

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <CourseSidebar
                courses={sidebarCourses}
                userId={session.user.sub}
                dbUser={dbUser}
            />

            {/* Main Content Area */}
            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                {/* Top Nav Header */}
                <nav className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Workspace</span>
                        <span className="text-border">/</span>
                        <span className="font-medium text-foreground">Home</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <ThemeToggleDropdown />
                        <Setting_dialog dbUser={dbUser} />
                        <Profile dbUser={dbUser} />
                    </div>
                </nav>

                {/* Main Hero & Composer Container */}
                <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:py-14 space-y-10">
                    {/* Greeting & Title */}
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span>AI Study Companion</span>
                        </div>
                        <h1 className={`${libertinus.className} text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl`}>
                            Good {greetingTime}, <span className="text-foreground font-normal">{firstName}</span>
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                            Upload notes, ask questions, or generate flashcards from your documents.
                        </p>
                    </div>

                    {/* Composer Box */}
                    <div className="w-full">
                        <DashboardClient userId={session.user.sub} />
                    </div>

                    {/* Recent Courses Section */}
                    <div className="space-y-4 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Your Courses ({courses.length})
                            </h2>
                            {courses.length > 0 && (
                                <span className="text-xs text-muted-foreground">Jump back into recent work</span>
                            )}
                        </div>

                        {courses.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center space-y-4 shadow-xs">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/60 text-muted-foreground">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <div className="space-y-1.5 max-w-sm mx-auto">
                                    <p className="text-sm font-semibold text-foreground">No courses yet</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Type a question or drag & drop a PDF, Word, or PowerPoint file in the box above to start your first course.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {courses.slice(0, 6).map((course) => {
                                    const isCollaborator = course.userId !== session.user.sub;
                                    const msgCount = course.chat?.messages?.length ?? 0;

                                    return (
                                        <Link
                                            key={course._id.toString()}
                                            href={`/dashboard/${course._id.toString()}`}
                                            className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-ring/50 hover:shadow-sm"
                                        >
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                                        <BookOpen className="h-4 w-4" />
                                                    </div>
                                                    {isCollaborator ? (
                                                        <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground" title="Shared course">
                                                            <Users className="h-3 w-3" /> Shared
                                                        </span>
                                                    ) : (
                                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>

                                                <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {course.name}
                                                </h3>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="h-3 w-3" />
                                                    {msgCount} {msgCount === 1 ? "message" : "messages"}
                                                </span>
                                                <span className="text-[10px] opacity-70">
                                                    {course.chat?.updatedAt
                                                        ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(course.chat.updatedAt))
                                                        : "Recently"}
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
