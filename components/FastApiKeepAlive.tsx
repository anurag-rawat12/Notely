"use client";

import { useEffect } from "react";

// Ping every 9 minutes (Render free tier spins down after 15 minutes of inactivity)
const PING_INTERVAL_MS = 9 * 60 * 1000;

export default function FastApiKeepAlive() {
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const pingFastApi = async () => {
            try {
                await fetch("/api/ping", { cache: "no-store" });
            } catch {
                // Ignore silent background ping errors
            } finally {
                // Schedule next ping using setTimeout
                timeoutId = setTimeout(pingFastApi, PING_INTERVAL_MS);
            }
        };

        // Initial ping shortly after page load (1.5 seconds) to warm up FastAPI
        timeoutId = setTimeout(pingFastApi, 1500);

        // Wake up FastAPI immediately if user comes back to the tab
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetch("/api/ping", { cache: "no-store" }).catch(() => {});
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return null;
}
