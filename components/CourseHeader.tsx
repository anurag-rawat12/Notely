"use client";

import ShareDialog from "@/components/ShareDialog";
import Setting_dialog from "@/components/Setting_dialog";
import Profile from "@/components/Profile";
import { ThemeToggleDropdown } from "@/components/ThemeToggle";
import { DbUser } from "@/lib/Types";
import { BookOpen } from "lucide-react";

interface CourseHeaderProps {
    courseId: string;
    courseName: string;
    publicShareId?: string;
    dbUser?: DbUser | null;
}

export default function CourseHeader({ courseId, courseName, publicShareId, dbUser }: CourseHeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-sm sm:px-8">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                </div>
                <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
                    {courseName}
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <ShareDialog
                    courseId={courseId}
                    courseName={courseName}
                    initialPublicShareId={publicShareId}
                />

                <ThemeToggleDropdown />

                {dbUser && (
                    <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
                        <Setting_dialog dbUser={dbUser} />
                        <Profile dbUser={dbUser} />
                    </div>
                )}
            </div>
        </header>
    );
}
