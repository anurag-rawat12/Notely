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
