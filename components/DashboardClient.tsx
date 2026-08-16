"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Composer, { ComposerSubmitPayload } from "@/components/Composer";

interface DashboardPageProps {
    userId: string;
}

function createCourseTitle(message: string, filename?: string) {
    if (filename) return filename.replace(/\.[^/.]+$/, "").slice(0, 60);
    const cleanMessage = message.replace(/[#*_`]/g, "").replace(/\s+/g, " ").trim();
    if (!cleanMessage) return "New conversation";
    const words = cleanMessage.split(" ").slice(0, 8).join(" ");
    return `${words.charAt(0).toUpperCase()}${words.slice(1)}`.slice(0, 60);
}

export default function DashboardClient({ userId }: DashboardPageProps) {
    const router = useRouter();
    const [creating, setCreating] = useState(false);

    const handleFirstSend = async ({ message, mode, files }: ComposerSubmitPayload) => {
        setCreating(true);

        try {
            // 1. Generate unique UUID client-side for instantaneous navigation
            const courseId = crypto.randomUUID();
            const title = createCourseTitle(message, files[0]?.name);

            // 2. Fast course initialization (<20ms insert) with the initial user message
            await axios.post("/api/courses", { 
                courseId, 
                userId, 
                name: title,
                initialMessage: message,
                mode
            });

            // 3. If files exist or a message needs FastAPI generation, initiate background request or pass pending trigger
            if (files.length > 0) {
                const formData = new FormData();
                formData.append("message", message);
                formData.append("mode", mode);
                formData.append("course_id", courseId);
                formData.append("user_id", userId);
                files.forEach((file) => formData.append("files", file));

                // Dispatch background chat generation
                axios.post("/api/chat", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                }).catch((err) => console.error("Background initial upload/chat error:", err));
            } else if (message) {
                // Signal ChatHistory to trigger AI generation on landing
                try {
                    sessionStorage.setItem(`pending_gen_${courseId}`, JSON.stringify({ message, mode }));
                } catch {
                    // Ignore storage quota
                }
            }

            // 4. Instant redirect to the new course dashboard
            router.push(`/dashboard/${courseId}`);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error("Failed to start new course chat:", err.response?.data?.error ?? err.message);
            } else {
                console.error("Failed to start new course chat:", err);
            }
            setCreating(false);
        }
    };

    return (
        <Composer onSend={handleFirstSend} disabled={creating} />
    );
}
