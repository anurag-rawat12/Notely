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
            } finally {
                timeoutId = setTimeout(pingFastApi, PING_INTERVAL_MS);
            }
        };

        timeoutId = setTimeout(pingFastApi, 1500);

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetch("/api/ping", { cache: "no-store" }).catch(() => { });
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
