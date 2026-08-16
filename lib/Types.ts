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
    name: string;
    chat: CourseChat;
    createdAt: Date;
    publicShareId?: string;
    collaborators?: string[];
}
