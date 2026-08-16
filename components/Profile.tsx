'use client';

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import LogoutButton from "./LogoutButton";
import { DbUser } from "@/lib/Types";

function getInitials(name?: string) {
    if (!name) return "?";
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export default function Profile({ dbUser }: { dbUser: DbUser }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [open]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Open account menu"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold text-foreground transition-all hover:ring-2 hover:ring-ring/50 focus:outline-none focus:ring-2 focus:ring-ring shrink-0 cursor-pointer"
            >
                {dbUser.avatarUrl ? (
                    <Image
                        src={dbUser.avatarUrl}
                        alt={dbUser.name ?? "Profile"}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <span>{getInitials(dbUser.name)}</span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 flex w-56 flex-col gap-2 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
                >
                    <div className="border-b border-border px-3 py-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                            {dbUser.name ?? "Account"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {dbUser.email ?? "No email on file"}
                        </p>
                    </div>

                    <div className="pt-1">
                        <LogoutButton />
                    </div>
                </div>
            )}
        </div>
    );
}