"use client";

import { getUser } from "@/lib/helper";
import { useUser } from "@auth0/nextjs-auth0";
import axios from "axios";
import { useEffect, useRef } from "react";

export function UserSync() {
    const { user, isLoading } = useUser();
    const checkedUserId = useRef<string | null>(null);

    useEffect(() => {
        if (isLoading || !user?.sub) return;

        // Avoid re-checking/re-syncing the same user repeatedly
        if (checkedUserId.current === user.sub) return;

        const auth0Id = user.sub.includes("|") ? user.sub.split("|")[1] : user.sub;
        let cancelled = false;

        async function syncUser() {
            try {
                const dbUser = await getUser(auth0Id);

                if (cancelled) return;

                if (dbUser) {
                    // Already exists in DB — nothing to do
                    checkedUserId.current = user!.sub as string;
                    return;
                }

                await axios.post("/api/users/sync", {
                    auth0Id,
                    email: user!.email,
                    name: user!.name,
                    picture: user!.picture,
                });

                if (!cancelled) {
                    checkedUserId.current = user!.sub as string;
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("User sync failed:", err);
                }
            }
        }

        syncUser();

        return () => {
            cancelled = true;
        };
    }, [user, isLoading]);

    return null;
}