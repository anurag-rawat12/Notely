export interface DbUser {
    auth0Id?: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
}

export interface ChatMessage {
    role: "user" | "assistant";
    type: "chat" | "ask" | "flashcards" | "answer";
    content?: string;
    flashcards?: Flashcard[];
    sources?: number[];
    createdAt: Date;
}

export interface Flashcard {
    question: string;
    answer: string;
    sources: number[];
}

export interface CourseChat {
    messages: ChatMessage[];
    updatedAt: Date;
}

export interface Course {
    _id?: string;
    userId: string;
    projectId?: string;      // Belongs to a project (null = quick/unsorted chat)
    name: string;
    chat: CourseChat;
    createdAt: Date;
    publicShareId?: string;
    collaborators?: string[];
    pinned?: boolean;
}

// ─── Projects ─────────────────────────────────────────────────────────────

export interface Project {
    _id: string;             // UUID
    userId: string;
    name: string;
    description?: string;
    color?: string;          // Optional accent color (e.g. "blue", "green")
    createdAt: Date;
    updatedAt: Date;
    collaborators?: string[];
}

// ─── BullMQ Job Payloads ──────────────────────────────────────────────────

export interface ChatJobPayload {
    jobType: "chat" | "ask" | "flashcards";
    courseId: string;
    userId: string;
    message: string;
    mode: "chat" | "ask" | "flashcards";
    /** Serialised prior ChatMessage array (text-only turns) */
    history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface DocumentJobPayload {
    courseId: string;
    userId: string;
    /** Base64-encoded file bytes */
    fileBase64: string;
    fileName: string;
    fileMime: string;
    /** Message to send to the chat after the upload is processed */
    message?: string;
    mode?: "chat" | "ask" | "flashcards";
}
