"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getUser } from "@/lib/helper";
import { DbUser } from "@/lib/Types";

interface DbUserContextValue {
    dbUser: DbUser | null;
    loading: boolean;
    refetch: () => Promise<void>;
}

const DbUserContext = createContext<DbUserContextValue>({
    dbUser: null,
    loading: true,
    refetch: async () => { },
});

export function DbUserProvider({ children }: { children: ReactNode }) {
    const { user } = useUser();
    const [dbUser, setDbUser] = useState<DbUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        if (!user || !user.sub) return;
        const auth0Id = user.sub.split("|")[1] ?? user.sub;
        try {
            const data = await getUser(auth0Id);
            setDbUser(data as DbUser | null);
        } catch (error) {
            console.error("Failed to load user:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user && user.sub) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [user, fetchUser]);

    return (
        <DbUserContext.Provider value={{ dbUser, loading, refetch: fetchUser }}>
            {children}
        </DbUserContext.Provider>
    );
}

export function useDbUser() {
    return useContext(DbUserContext);
}