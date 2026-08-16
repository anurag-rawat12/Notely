"use client";
import clsx from "clsx";

export default function LogoutButton({ className }: { className?: string }) {
    return (
        <a
            href="/auth/logout"
            className={clsx(
                "inline-flex items-center justify-center rounded-lg border border-border bg-muted/60 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
                className
            )}
        >
            Log out
        </a>
    );
}