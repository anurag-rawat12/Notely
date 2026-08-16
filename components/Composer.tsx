"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Plus, FileText, X, MessageSquare, HelpCircle, Layers } from "lucide-react";
import { geist } from "@/lib/fonts";
import { useDropzone } from "react-dropzone";

type Mode = "chat" | "ask" | "flashcards";

const STATIC_PLACEHOLDERS: Record<Mode, string> = {
    chat: "Ask anything...",
    ask: "Ask something about your notes...",
    flashcards: "What topic should the flashcards cover?",
};

export interface ComposerSubmitPayload {
    message: string;
    mode: Mode;
    files: File[];
}

interface ComposerProps {
    onSend: (payload: ComposerSubmitPayload) => Promise<void> | void;
    disabled?: boolean;
}

export default function Composer({ onSend, disabled }: ComposerProps) {
    const [value, setValue] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [mode, setMode] = useState<Mode>("chat");
    const [sending, setSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
        }
    };

    const handleSend = async () => {
        if (!value.trim() && files.length === 0) return;
        if (sending || disabled) return;

        setSending(true);
        const payload: ComposerSubmitPayload = { message: value, mode, files };

        setValue("");
        setFiles([]);
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        try {
            await onSend(payload);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
        accept: {
            "application/pdf": [".pdf"],
            "text/plain": [".txt"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"]
        },
    });

    useEffect(() => {
        if (acceptedFiles.length > 0) {
            setFiles((prev) => [...prev, ...acceptedFiles]);
        }
    }, [acceptedFiles]);

    return (
        <div className={`w-full ${geist.className}`}>
            <div className="rounded-2xl border border-border bg-transparent p-3 transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/50">
                {/* Uploaded File Previews */}
                {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1 pb-2">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="relative flex items-center gap-2 rounded-lg border border-border bg-transparent py-1.5 pl-2.5 pr-8 text-xs text-foreground"
                            >
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    title="Remove"
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Textarea Input — stays enabled while sending, so the user can keep typing */}
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={STATIC_PLACEHOLDERS[mode]}
                    rows={1}
                    className="!bg-transparent resize-none border-0 p-2 shadow-none focus-visible:ring-0 text-[15px] leading-relaxed max-h-[240px] placeholder:text-muted-foreground/70 text-foreground"
                />

                {/* Controls Bar — same transparent background as the rest, no separate fill */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 pt-1 border-t border-border/40">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                        <button
                            type="button"
                            title="Attach PDF, PPTX, DOCX or TXT"
                            {...getRootProps({ className: "dropzone" })}
                            className="flex items-center cursor-pointer justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                        >
                            <input {...getInputProps()} />
                            <Plus className="h-4 w-4" />
                        </button>

                        <span className="h-4 w-px bg-border mx-0.5" />

                        {/* Mode Selector Tabs */}
                        <div className="flex items-center gap-1 rounded-lg bg-transparent p-0.5">
                            <button
                                type="button"
                                onClick={() => setMode("chat")}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${mode === "chat"
                                    ? "bg-muted text-foreground font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Chat
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("ask")}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${mode === "ask"
                                    ? "bg-muted text-foreground font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <HelpCircle className="h-3.5 w-3.5" />
                                Ask notes
                            </button>

                            <button
                                type="button"
                                onClick={() => setMode("flashcards")}
                                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${mode === "flashcards"
                                    ? "bg-muted text-foreground font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Layers className="h-3.5 w-3.5" />
                                Flashcards
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={(!value.trim() && files.length === 0) || sending || disabled}
                        title="Send message"
                        className="flex items-center cursor-pointer justify-center h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}