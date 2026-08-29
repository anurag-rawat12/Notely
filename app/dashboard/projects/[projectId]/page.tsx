import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import clientPromise from "@/lib/mongodb";
import CourseSidebar, { SidebarCourse, SidebarProject } from "@/components/CourseSidebar";
import DashboardClient from "@/components/DashboardClient";
import Profile from "@/components/Profile";
import Setting_dialog from "@/components/Setting_dialog";
import { ThemeToggleDropdown } from "@/components/ThemeToggle";
import { getUser } from "@/lib/helper";
import { DbUser } from "@/lib/Types";
import { libertinus } from "@/lib/fonts";
import Link from "next/link";
import { FolderOpen, MessageSquare, Clock, ArrowUpRight, Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

type ProjectDoc = {
    _id: { toString(): string };
    name: string;
    description?: string;
    color?: string;
    userId: string;
    createdAt?: Date;
};

type CourseDoc = {
    _id: { toString(): string };
    name: string;
    userId: string;
    projectId?: string;
    pinned?: boolean;
    createdAt?: Date;
    chat?: {
        messages?: unknown[];
        updatedAt?: Date;
    };
};

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
    const session = await auth0.getSession();
    if (!session?.user) return notFound();
    const { projectId } = await params;
    if (!projectId || typeof projectId !== "string") return notFound();

    const auth0ID = session.user.sub.split("|")[1];
    const dbUser = auth0ID ? ((await getUser(auth0ID)) as DbUser) : null;

    const client = await clientPromise;
    const db = client.db();

    const [project, allProjects, allCourses] = await Promise.all([
        db.collection("projects").findOne({ _id: projectId as any, userId: auth0ID }) as unknown as Promise<ProjectDoc | null>,
        db.collection("projects").find({ userId: auth0ID }).sort({ updatedAt: -1 }).toArray() as unknown as Promise<ProjectDoc[]>,
        db.collection("courses").find({ userId: auth0ID }).sort({ pinned: -1, "chat.updatedAt": -1 }).toArray() as unknown as Promise<CourseDoc[]>,
    ]);

    if (!project) return notFound();

    const projectChats = allCourses.filter((c) => c.projectId === projectId);

    const sidebarProjects: SidebarProject[] = allProjects.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        color: p.color,
    }));

    const sidebarCourses: SidebarCourse[] = allCourses.map((item) => ({
        id: item._id.toString(),
        name: item.name,
        pinned: item.pinned,
        projectId: item.projectId,
        updatedAt: item.chat?.updatedAt ?? item.createdAt,
        messageCount: item.chat?.messages?.length ?? 0,
    }));

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <CourseSidebar
                courses={sidebarCourses}
                projects={sidebarProjects}
                userId={auth0ID}
                dbUser={dbUser}
                activeProjectId={projectId}
            />

            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
                {/* Header Nav */}
                <nav className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/dashboard" className="hover:text-foreground">Workspace</Link>
                        <span className="text-border">/</span>
                        <span className="font-medium text-foreground">{project.name}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <ThemeToggleDropdown />
                        {dbUser && <Setting_dialog dbUser={dbUser} />}
                        {dbUser && <Profile dbUser={dbUser} />}
                    </div>
                </nav>

                {/* Main Content */}
                <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-8">
                    {/* Project Header */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-primary/10 text-primary">
                                <FolderOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className={`${libertinus.className} text-3xl font-semibold tracking-tight text-foreground`}>
                                    {project.name}
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    {projectChats.length} {projectChats.length === 1 ? "chat" : "chats"} in this project
                                </p>
                            </div>
                        </div>
                        {project.description && (
                            <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                                {project.description}
                            </p>
                        )}
                    </div>

                    {/* Composer scoped to Project */}
                    <div className="w-full">
                        <DashboardClient userId={auth0ID} projectId={projectId} />
                    </div>

                    {/* Chats List */}
                    <div className="space-y-4 pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Project Chats ({projectChats.length})
                            </h2>
                        </div>

                        {projectChats.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center space-y-3">
                                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-medium text-foreground">No chats in this project yet</p>
                                <p className="text-xs text-muted-foreground">Use the input box above to start a conversation inside this project.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {projectChats.map((chat) => {
                                    const msgCount = chat.chat?.messages?.length ?? 0;
                                    return (
                                        <Link
                                            key={chat._id.toString()}
                                            href={`/dashboard/${chat._id.toString()}`}
                                            className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-ring/50 hover:shadow-sm"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                    </div>
                                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                                    {chat.name}
                                                </h3>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {msgCount} msg
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
