import clientPromise from "@/lib/mongodb";
import { notFound } from "next/navigation";
import Link from "next/link";
import MarkdownContent from "@/components/MarkdownContent";
import { libertinus } from "@/lib/fonts";
import { Globe, BookOpen } from "lucide-react";
import type { ChatMessage, Flashcard } from "@/lib/Types";

export const dynamic = "force-dynamic";

type CourseDoc = {
    _id: unknown;
    name: string;
    publicShareId?: string;
    chat?: {
        messages: ChatMessage[];
    };
};

export default async function PublicSharePage({ params }: { params: Promise<{ shareId: string }> }) {
    const { shareId } = await params;
    if (!shareId) return notFound();

    const client = await clientPromise;
    const db = client.db();
    const course = await db.collection<CourseDoc>("courses").findOne({ publicShareId: shareId });

    if (!course) return notFound();

    const messages = course.chat?.messages ?? [];

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <Link href="/" className={`${libertinus.className} text-xl tracking-wide text-foreground`}>
                        Notely
                    </Link>
                    <span className="h-4 w-px bg-border" />
                    <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span>Public View</span>
                    </div>
                </div>

                <Link
                    href="/auth/login"
                    className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    Get Started
                </Link>
            </header>

            {/* Course Title Bar */}
            <div className="border-b border-border bg-muted/20 px-6 py-5">
                <div className="mx-auto max-w-3xl flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-foreground">{course.name}</h1>
                        <p className="text-xs text-muted-foreground">Shared read-only document chat</p>
                    </div>
                </div>
            </div>

            {/* Main Chat Display */}
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 space-y-6">
                    {messages.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground text-sm">
                            No messages in this course conversation yet.
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <article
                                key={index}
                                className={`py-4 ${
                                    message.role === "user"
                                        ? "flex justify-end"
                                        : "rounded-xl border border-border bg-card p-5 shadow-sm"
                                }`}
                            >
                                {message.role === "user" ? (
                                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm leading-relaxed text-primary-foreground">
                                        {message.content}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {message.type === "flashcards" && message.flashcards?.length ? (
                                            <div className="space-y-4">
                                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                    Generated Flashcards ({message.flashcards.length})
                                                </p>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {message.flashcards.map((card: Flashcard, i: number) => (
                                                        <div key={i} className="rounded-lg border border-border bg-background p-4 space-y-2">
                                                            <p className="text-xs font-semibold text-foreground">Q: {card.question}</p>
                                                            <p className="text-xs text-muted-foreground">A: {card.answer}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <MarkdownContent content={message.content} />
                                        )}
                                    </div>
                                )}
                            </article>
                        ))
                    )}
                </div>
            </main>

            {/* Footer Banner */}
            <footer className="border-t border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                Want to process your own documents and generate flashcards?{" "}
                <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4 hover:opacity-80">
                    Try Notely for free
                </Link>
            </footer>
        </div>
    );
}
