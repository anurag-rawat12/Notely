import Link from "next/link";
import { BookOpen, Clock3, MessageSquarePlus } from "lucide-react";
import { auth0 } from "@/lib/auth0";
import clientPromise from "@/lib/mongodb";
import { notFound } from "next/navigation";
import { libertinus } from "@/lib/fonts";
import { ThemeToggleDropdown } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

type CourseListItem = {
    _id: { toString(): string };
    userId: string;
    name: string;
    createdAt?: Date;
    chat?: { messages?: unknown[]; updatedAt?: Date };
};

export default async function CourseLibraryPage() {
    const session = await auth0.getSession();
    if (!session) return notFound();

    const client = await clientPromise;
    const courses = (await client.db().collection("courses")
        .find({ userId: session.user.sub.split("|")[1] })
        .sort({ "chat.updatedAt": -1, createdAt: -1 })
        .toArray()) as unknown as CourseListItem[];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <header className="mx-auto flex w-full max-w-5xl items-center justify-between border-b border-border bg-background/90 px-6 py-4 backdrop-blur-sm sm:px-8">
                <Link href="/dashboard" className={`${libertinus.className} text-2xl font-semibold tracking-wide text-foreground`}>
                    Notely
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeToggleDropdown />
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        <MessageSquarePlus className="h-4 w-4" />
                        <span>New course</span>
                    </Link>
                </div>
            </header>

            <section className="mx-auto w-full max-w-5xl px-6 pb-16 pt-10 sm:px-8">
                <div className="mb-8">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Your workspace</p>
                    <h1 className={`${libertinus.className} mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl`}>Courses</h1>
                    <p className="mt-2 text-sm text-muted-foreground">Every conversation and uploaded document lives inside a course.</p>
                </div>

                {courses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center shadow-xs">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <h2 className="mt-4 text-base font-semibold text-foreground">No courses yet</h2>
                        <p className="mt-1 text-xs text-muted-foreground">Start a conversation or upload a document to create your first course.</p>
                        <Link href="/dashboard" className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                            Create a course
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {courses.map((course) => (
                            <Link
                                key={course._id.toString()}
                                href={`/dashboard/${course._id.toString()}`}
                                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-ring/50 hover:shadow-sm"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                                    <BookOpen className="h-4 w-4" />
                                </div>
                                <h2 className="mt-4 truncate text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {course.name}
                                </h2>
                                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    <span>
                                        {course.chat?.messages?.length ?? 0} messages · Updated{" "}
                                        {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                                            course.chat?.updatedAt ?? course.createdAt ?? new Date()
                                        )}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
