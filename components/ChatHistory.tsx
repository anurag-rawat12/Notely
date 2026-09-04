"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Copy, Check, Layers, RotateCw, Loader2, Sparkles, MessageSquare, HelpCircle } from "lucide-react";
import Composer, { ComposerSubmitPayload } from "./Composer";
import MarkdownContent from "./MarkdownContent";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Flashcard = { question: string; answer: string; sources: number[] };

interface ChatMessage {
    role: "user" | "assistant";
    type: string;
    content?: string;
    flashcards?: Flashcard[];
    sources?: number[];
}

interface ChatHistoryProps {
    initialMessages: ChatMessage[];
    courseId: string;
    userId: string;
}

// ── FlashcardDeck ──────────────────────────────────────────────────────────

function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
    const [activeCard, setActiveCard] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const card = cards[activeCard];

    const move = (direction: number) => {
        setActiveCard((current) => (current + direction + cards.length) % cards.length);
        setFlipped(false);
    };

    if (!cards || cards.length === 0) return null;

    return (
        <Dialog>
            <DialogTrigger className="group inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-xs transition-all hover:border-primary/40 hover:bg-muted/40">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Layers className="h-3.5 w-3.5" />
                </span>
                <span>{cards.length} flashcard{cards.length === 1 ? "" : "s"} generated</span>
            </DialogTrigger>
            <DialogContent className="max-w-lg gap-6 rounded-2xl p-6 bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                        Generated Flashcards
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Click the card to reveal the answer
                    </DialogDescription>
                </DialogHeader>

                <div
                    onClick={() => setFlipped((current) => !current)}
                    className="relative flex min-h-[220px] w-full cursor-pointer select-none flex-col justify-between rounded-xl border border-border bg-muted/30 p-6 transition-all hover:bg-muted/50"
                    role="button"
                    tabIndex={0}
                >
                    <div className="flex items-center justify-between">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${flipped ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {flipped ? "Answer" : "Question"}
                        </span>
                        <RotateCw className="h-3.5 w-3.5 text-muted-foreground/70" />
                    </div>
                    <p className="my-auto text-base font-medium leading-relaxed text-foreground">
                        {flipped ? card.answer : card.question}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1">
                            {cards.map((_, i) => (
                                <span key={i} className={`h-1 rounded-full transition-all ${i === activeCard ? "w-4 bg-primary" : "w-1 bg-border"}`} />
                            ))}
                        </div>
                        <span className="text-[11px] text-muted-foreground">Card {activeCard + 1} of {cards.length}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button type="button" onClick={() => move(-1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted" aria-label="Previous">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-medium text-muted-foreground">{activeCard + 1} / {cards.length}</span>
                    <button type="button" onClick={() => move(1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted" aria-label="Next">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── CopyButton ─────────────────────────────────────────────────────────────

function MessageCopyButton({ content }: { content: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
        </button>
    );
}

// ── AnimatedReveal ─────────────────────────────────────────────────────────

function AnimatedReveal({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);
    return (
        <div className={`transition-all duration-300 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}>
            {children}
        </div>
    );
}

// ── ThinkingBubble ─────────────────────────────────────────────────────────

function ThinkingBubble() {
    return (
        <article className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">
                Analyzing your material and generating a response…
            </span>
        </article>
    );
}

// ── Main ChatHistory Component ─────────────────────────────────────────────

export default function ChatHistory({ initialMessages, courseId, userId }: ChatHistoryProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const initialTriggered = useRef(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isSending]);

    // Handle pending generation from optimistic redirect
    useEffect(() => {
        if (initialTriggered.current) return;

        let pendingPrompt: string | null = null;
        let pendingMode: "chat" | "ask" | "flashcards" = "chat";

        try {
            const raw = sessionStorage.getItem(`pending_gen_${courseId}`);
            if (raw) {
                sessionStorage.removeItem(`pending_gen_${courseId}`);
                const parsed = JSON.parse(raw);
                pendingPrompt = parsed.message;
                pendingMode = parsed.mode || "chat";
            }
        } catch { /* ignore */ }

        if (!pendingPrompt && initialMessages.length === 1 && initialMessages[0].role === "user" && initialMessages[0].content) {
            pendingPrompt = initialMessages[0].content;
            pendingMode = (initialMessages[0].type as any) || "chat";
        }

        if (pendingPrompt) {
            initialTriggered.current = true;
            setIsSending(true);
            const formData = new FormData();
            formData.append("message", pendingPrompt);
            formData.append("mode", pendingMode);
            formData.append("course_id", courseId);
            formData.append("user_id", userId);

            axios.post("/api/chat", formData, { headers: { "Content-Type": "multipart/form-data" } })
                .then(({ data }) => {
                    if (data.message) {
                        setMessages((prev) => [...prev, data.message]);
                    }
                    setIsSending(false);
                })
                .catch((err) => {
                    setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Unable to generate response." : "Unable to generate response.");
                    setIsSending(false);
                });
        }
    }, [courseId, userId, initialMessages]);

    const handleSend = async ({ message, mode, files }: ComposerSubmitPayload) => {
        setError(null);
        setIsSending(true);
        setMessages((prev) => [
            ...prev,
            { role: "user", type: mode, content: message || `Uploaded ${files.length} file${files.length === 1 ? "" : "s"}` }
        ]);

        const formData = new FormData();
        formData.append("message", message);
        formData.append("mode", mode);
        formData.append("course_id", courseId);
        formData.append("user_id", userId);
        files.forEach((file) => formData.append("files", file));

        try {
            const { data } = await axios.post("/api/chat", formData, { headers: { "Content-Type": "multipart/form-data" } });

            if (data.message) {
                setMessages((prev) => [...prev, data.message]);
            }
        } catch (err) {
            setError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Unable to send your message." : "Unable to send your message.");
        } finally {
            setIsSending(false);
        }
    };

    const handleQuickPrompt = (text: string, promptMode: "chat" | "ask" | "flashcards" = "ask") => {
        handleSend({ message: text, mode: promptMode, files: [] });
    };

    return (
        <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
            {/* Scroll Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl px-5 pb-6 pt-8 sm:px-8 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex min-h-[48vh] flex-col items-center justify-center text-center space-y-5">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-xs">
                                <Sparkles className="h-6 w-6" />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h2 className="text-xl font-semibold tracking-tight text-foreground">Ready to study</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Ask anything about your notes, generate flashcard decks, or quiz yourself.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-md">
                                {([
                                    { label: "Summarize key points", prompt: "Summarize the key concepts in this material.", mode: "ask" as const, icon: HelpCircle },
                                    { label: "Create flashcards", prompt: "Generate a 5-card flashcard study deck.", mode: "flashcards" as const, icon: Layers },
                                    { label: "Key definitions", prompt: "What are the most important terms and definitions?", mode: "chat" as const, icon: MessageSquare },
                                ]).map(({ label, prompt, mode, icon: Icon }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => handleQuickPrompt(prompt, mode)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-ring/40 transition-all"
                                    >
                                        <Icon className="h-3 w-3" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, index) => (
                            <article key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                {msg.role === "user" ? (
                                    <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-xs">
                                        {msg.content}
                                    </div>
                                ) : (
                                    <AnimatedReveal>
                                        <div className="group w-full space-y-2.5">
                                            {msg.type === "flashcards" && msg.flashcards?.length ? (
                                                <FlashcardDeck cards={msg.flashcards} />
                                            ) : (
                                                <div className="text-[15px] leading-relaxed text-foreground">
                                                    <MarkdownContent content={msg.content} />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-xs">
                                                {msg.content && msg.sources && msg.sources.length > 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                                        Sources: {msg.sources.join(", ")}
                                                    </span>
                                                )}
                                                {msg.content && <MessageCopyButton content={msg.content} />}
                                            </div>
                                        </div>
                                    </AnimatedReveal>
                                )}
                            </article>
                        ))
                    )}

                    {isSending && <ThinkingBubble />}

                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Composer */}
            <div className="border-t border-border bg-background/90 px-4 pb-3 pt-3 backdrop-blur-sm sm:px-8">
                <div className="mx-auto max-w-3xl space-y-2">
                    {error && (
                        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2 text-xs font-medium text-destructive">
                            {error}
                        </p>
                    )}
                    <Composer onSend={handleSend} disabled={isSending} />
                    <p className="text-center text-[11px] text-muted-foreground">
                        Notely can make mistakes — verify important information.
                    </p>
                </div>
            </div>
        </div>
    );
}