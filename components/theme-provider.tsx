"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export const ACCENT_PALETTES: Array<{
    id: string;
    name: string;
    bg: string;
    lightPrimary: string;
    darkPrimary: string;
    lightRing: string;
    darkRing: string;
}> = [
    { id: "default", name: "Neutral", bg: "bg-stone-500", lightPrimary: "oklch(0.243 0.002 90)", darkPrimary: "oklch(0.92 0.02 92)", lightRing: "oklch(0.55 0.015 90)", darkRing: "oklch(0.58 0.015 90)" },
    { id: "emerald", name: "Emerald", bg: "bg-emerald-500", lightPrimary: "#059669", darkPrimary: "#10b981", lightRing: "#10b981", darkRing: "#34d399" },
    { id: "blue", name: "Ocean Blue", bg: "bg-blue-500", lightPrimary: "#2563eb", darkPrimary: "#3b82f6", lightRing: "#3b82f6", darkRing: "#60a5fa" },
    { id: "violet", name: "Violet", bg: "bg-violet-500", lightPrimary: "#7c3aed", darkPrimary: "#8b5cf6", lightRing: "#8b5cf6", darkRing: "#a78bfa" },
    { id: "amber", name: "Amber", bg: "bg-amber-500", lightPrimary: "#d97706", darkPrimary: "#f59e0b", lightRing: "#f59e0b", darkRing: "#fbbf24" },
    { id: "rose", name: "Rose", bg: "bg-rose-500", lightPrimary: "#e11d48", darkPrimary: "#f43f5e", lightRing: "#f43f5e", darkRing: "#fb7185" },
];

export function applyAccentColor(accentId: string) {
    if (typeof window === "undefined") return;
    const palette = ACCENT_PALETTES.find((p) => p.id === accentId) || ACCENT_PALETTES[0];
    const isDark = document.documentElement.classList.contains("dark");

    if (palette.id === "default") {
        document.documentElement.style.removeProperty("--primary");
        document.documentElement.style.removeProperty("--ring");
        document.documentElement.style.removeProperty("--sidebar-primary");
        document.documentElement.style.removeProperty("--sidebar-ring");
        document.documentElement.removeAttribute("data-accent");
    } else {
        const primary = isDark ? palette.darkPrimary : palette.lightPrimary;
        const ring = isDark ? palette.darkRing : palette.lightRing;
        document.documentElement.style.setProperty("--primary", primary);
        document.documentElement.style.setProperty("--ring", ring);
        document.documentElement.style.setProperty("--sidebar-primary", primary);
        document.documentElement.style.setProperty("--sidebar-ring", ring);
        document.documentElement.setAttribute("data-accent", palette.id);
    }
    localStorage.setItem("notely-accent-color", palette.id);
}

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    React.useEffect(() => {
        const saved = localStorage.getItem("notely-accent-color") || "default";
        applyAccentColor(saved);

        // Re-apply if dark mode toggles
        const observer = new MutationObserver(() => {
            const current = localStorage.getItem("notely-accent-color") || "default";
            applyAccentColor(current);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}