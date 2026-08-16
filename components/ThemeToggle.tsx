"use client";

import { useEffect, useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export function ThemeToggleDropdown({ className = "" }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
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

    if (!mounted) {
        return (
            <div className={`h-8 w-8 rounded-lg border border-border bg-background/50 ${className}`} />
        );
    }

    const currentTheme = theme || "system";

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Toggle theme"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {currentTheme === "dark" ? (
                    <Moon className="h-4 w-4" />
                ) : currentTheme === "light" ? (
                    <Sun className="h-4 w-4" />
                ) : (
                    <Laptop className="h-4 w-4" />
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
                >
                    <button
                        type="button"
                        onClick={() => {
                            setTheme("light");
                            setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            currentTheme === "light"
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Sun className="h-3.5 w-3.5" /> Light
                        </span>
                        {currentTheme === "light" && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTheme("dark");
                            setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            currentTheme === "dark"
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Moon className="h-3.5 w-3.5" /> Dark
                        </span>
                        {currentTheme === "dark" && <Check className="h-3.5 w-3.5" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setTheme("system");
                            setOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            currentTheme === "system"
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <Laptop className="h-3.5 w-3.5" /> System
                        </span>
                        {currentTheme === "system" && <Check className="h-3.5 w-3.5" />}
                    </button>
                </div>
            )}
        </div>
    );
}

/** Segmented selector for settings modals */
export function ThemeSegmentedControl() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex h-10 w-full rounded-xl border border-border bg-muted/40 p-1" />
        );
    }

    const currentTheme = theme || "system";

    const options = [
        { id: "light", label: "Light", Icon: Sun },
        { id: "dark", label: "Dark", Icon: Moon },
        { id: "system", label: "System", Icon: Laptop },
    ] as const;

    return (
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/40 p-1">
            {options.map(({ id, label, Icon }) => {
                const active = currentTheme === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id)}
                        className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all ${
                            active
                                ? "bg-card text-foreground shadow-xs ring-1 ring-border font-semibold"
                                : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default ThemeToggleDropdown;
