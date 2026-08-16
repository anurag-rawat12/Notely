"use client";

import { useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Briefcase,
    FolderKanban,
    MoreHorizontal,
    Palette,
    PanelLeftClose,
    PanelLeftOpen,
    Pencil,
    Pin,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { libertinus } from "@/lib/fonts";
import { useTheme } from "next-themes";
import { DbUser } from "@/lib/Types";
import Profile from "./Profile";

export type SidebarCourse = {
    id: string;
    name: string;
    pinned?: boolean;
    isCollaborator?: boolean;
    updatedAt?: Date | string;
    messageCount?: number;
};

type TabFilter = "all" | "pinned" | "shared";

type CourseSidebarProps = {
    courses: SidebarCourse[];
    userId: string;
    dbUser?: DbUser | null;
};

export default function CourseSidebar({
    courses,
    userId,
    dbUser,
}: CourseSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [editing, setEditing] = useState<SidebarCourse | null>(null);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const [deletingCourse, setDeletingCourse] = useState<SidebarCourse | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [creatingProject, setCreatingProject] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    const { theme, setTheme } = useTheme();

    // ------------------------------------------------------------
    // Create a new chat
    // ------------------------------------------------------------

    const handleInstantNewChat = async (customTitle?: string) => {
        const uuid = crypto.randomUUID();
        const title = customTitle?.trim() || "New conversation";

        try {
            await axios.post("/api/courses", {
                courseId: uuid,
                userId,
                name: title,
            });

            router.push(`/dashboard/${uuid}`);
        } catch (error) {
            console.error("Failed to create new chat:", error);

            // Fallback
            router.push("/dashboard");
        }
    };

    // ------------------------------------------------------------
    // Create project
    // ------------------------------------------------------------

    const handleCreateProjectSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmedName = newProjectName.trim();

        if (!trimmedName || creatingProject) {
            return;
        }

        setCreatingProject(true);

        try {
            await handleInstantNewChat(trimmedName);

            setNewProjectName("");
            setCreateModalOpen(false);
        } finally {
            setCreatingProject(false);
        }
    };

    // ------------------------------------------------------------
    // Theme
    // ------------------------------------------------------------

    const toggleTheme = () => {
        if (theme === "dark") {
            setTheme("light");
        } else if (theme === "light") {
            setTheme("system");
        } else {
            setTheme("dark");
        }
    };

    // ------------------------------------------------------------
    // Update course
    // ------------------------------------------------------------

    const updateCourse = async (
        courseId: string,
        updates: {
            name?: string;
            pinned?: boolean;
        }
    ) => {
        try {
            await axios.patch("/api/courses", {
                courseId,
                userId,
                ...updates,
            });

            router.refresh();
        } catch (error) {
            console.error("Failed to update course:", error);
        }
    };

    // ------------------------------------------------------------
    // Save renamed course
    // ------------------------------------------------------------

    const saveName = async () => {
        if (!editing || !name.trim() || saving) {
            return;
        }

        setSaving(true);

        try {
            await updateCourse(editing.id, {
                name: name.trim(),
            });

            setEditing(null);
            setName("");
        } catch (error) {
            console.error("Failed to rename course:", error);
        } finally {
            setSaving(false);
        }
    };

    // ------------------------------------------------------------
    // Delete course
    // ------------------------------------------------------------

    const confirmDeleteCourse = async () => {
        if (!deletingCourse || deleting) {
            return;
        }

        setDeleting(true);

        try {
            await axios.delete(
                `/api/courses?course_id=${encodeURIComponent(
                    deletingCourse.id
                )}&user_id=${encodeURIComponent(userId)}`
            );

            setOpenMenu(null);

            if (pathname === `/dashboard/${deletingCourse.id}`) {
                router.push("/dashboard");
            }

            router.refresh();
            setDeletingCourse(null);
        } catch (error) {
            console.error("Failed to delete course:", error);
        } finally {
            setDeleting(false);
        }
    };

    // ------------------------------------------------------------
    // Filter courses
    // ------------------------------------------------------------

    const filteredCourses = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return courses.filter((course) => {
            // Search
            if (
                query &&
                !course.name.toLowerCase().includes(query)
            ) {
                return false;
            }

            // Tabs
            if (activeTab === "pinned") {
                return Boolean(course.pinned);
            }

            if (activeTab === "shared") {
                return Boolean(course.isCollaborator);
            }

            return true;
        });
    }, [courses, activeTab, searchQuery]);

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------

    return (
        <div className="flex h-full shrink-0 select-none">
            {/* =====================================================
                1. ICON RAIL
            ====================================================== */}

            <div className="flex h-full w-14 flex-col items-center justify-between border-r border-border bg-sidebar py-3 text-sidebar-foreground">
                {/* Top Section */}
                <div className="flex flex-col items-center gap-3">
                    {/* Collapse / Expand */}
                    <button
                        type="button"
                        onClick={() => setCollapsed((value) => !value)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        title={
                            collapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"
                        }
                    >
                        {collapsed ? (
                            <PanelLeftOpen className="h-4 w-4" />
                        ) : (
                            <PanelLeftClose className="h-4 w-4" />
                        )}
                    </button>

                    {/* New Chat */}
                    <button
                        type="button"
                        onClick={() => handleInstantNewChat()}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-all hover:scale-105 hover:border-primary/40 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title="Create new conversation"
                    >
                        <Plus className="h-4 w-4" />
                    </button>

                    <div className="my-1 h-px w-6 bg-border" />

                    {/* Projects */}
                    <button
                        type="button"
                        onClick={() => {
                            if (collapsed) {
                                setCollapsed(false);
                            }

                            setActiveTab("all");
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeTab === "all" && !collapsed
                            ? "bg-sidebar-accent font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                            }`}
                        title="All conversations"
                    >
                        <FolderKanban className="h-4 w-4" />
                    </button>

                    {/* Shared */}
                    <button
                        type="button"
                        onClick={() => {
                            if (collapsed) {
                                setCollapsed(false);
                            }

                            setActiveTab("shared");
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${activeTab === "shared" && !collapsed
                            ? "bg-sidebar-accent font-semibold text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                            }`}
                        title="Shared with me"
                    >
                        <Briefcase className="h-4 w-4" />
                    </button>
                </div>

                {/* Bottom Section */}
                <div className="flex flex-col items-center gap-3">
                    {/* Theme */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                        title={`Current theme: ${theme}. Click to switch.`}
                    >
                        <Palette className="h-4 w-4" />
                    </button>

                    {/* Profile */}
                    {dbUser && (
                        <div className="scale-90">
                            <Profile dbUser={dbUser} />
                        </div>
                    )}
                </div>
            </div>

            {/* =====================================================
                2. EXPANDED SIDEBAR
            ====================================================== */}

            {!collapsed && (
                <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-200">
                    {/* Header */}
                    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                        <Link
                            href="/dashboard"
                            className={`${libertinus.className} text-xl font-semibold tracking-wide text-foreground`}
                        >
                            Notely
                        </Link>

                        <button
                            type="button"
                            onClick={() => setCreateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
                        >
                            <Plus className="h-3 w-3" />
                            <span>Project</span>
                        </button>
                    </div>

                    {/* Search & Filters */}
                    <div className="space-y-2 p-3 pb-2">
                        {/* Search */}
                        <div className="relative flex items-center">
                            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />

                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                                placeholder="Search chats..."
                                className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                            />

                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab("all")}
                                className={`flex-1 rounded-md py-1 text-center text-[11px] font-medium transition-colors ${activeTab === "all"
                                    ? "bg-card font-semibold text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                All
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("pinned")}
                                className={`flex-1 rounded-md py-1 text-center text-[11px] font-medium transition-colors ${activeTab === "pinned"
                                    ? "bg-card font-semibold text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Pinned
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("shared")}
                                className={`flex-1 rounded-md py-1 text-center text-[11px] font-medium transition-colors ${activeTab === "shared"
                                    ? "bg-card font-semibold text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Shared
                            </button>
                        </div>
                    </div>

                    {/* =================================================
                        CONVERSATIONS LIST
                    ================================================== */}

                    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                        {filteredCourses.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {searchQuery
                                        ? "No matching conversations."
                                        : "No courses yet in this view."}
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleInstantNewChat()
                                    }
                                    className="mt-3 text-xs font-medium text-foreground underline underline-offset-4 hover:opacity-80"
                                >
                                    Start a new chat
                                </button>
                            </div>
                        ) : (
                            filteredCourses.map((course) => {
                                const active =
                                    pathname ===
                                    `/dashboard/${course.id}`;

                                return (
                                    <div
                                        key={course.id}
                                        className={`group relative flex items-center rounded-lg transition-colors ${active
                                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                                            }`}
                                    >
                                        {/* Course Link */}
                                        <Link
                                            href={`/dashboard/${course.id}`}
                                            className="min-w-0 flex-1 truncate px-2.5 py-2 text-xs transition-colors"
                                            title={course.name}
                                        >
                                            <div className="flex items-center justify-between gap-1.5">
                                                <span className="truncate">
                                                    {course.name}
                                                </span>

                                                {course.pinned && (
                                                    <Pin className="h-3 w-3 shrink-0 fill-current opacity-70" />
                                                )}
                                            </div>
                                        </Link>

                                        {/* More Menu Button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenMenu(
                                                    (current) =>
                                                        current ===
                                                            course.id
                                                            ? null
                                                            : course.id
                                                )
                                            }
                                            className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
                                            aria-expanded={
                                                openMenu === course.id
                                            }
                                            aria-label={`Course options for ${course.name}`}
                                        >
                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Dropdown */}
                                        {openMenu === course.id && (
                                            <div className="absolute right-0 top-full z-30 mt-1 w-36 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
                                                {/* Rename */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditing(course);
                                                        setName(
                                                            course.name
                                                        );
                                                        setOpenMenu(
                                                            null
                                                        );
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                    Edit name
                                                </button>

                                                {/* Pin */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenMenu(
                                                            null
                                                        );

                                                        updateCourse(
                                                            course.id,
                                                            {
                                                                pinned: !course.pinned,
                                                            }
                                                        );
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted"
                                                >
                                                    <Pin className="h-3.5 w-3.5" />
                                                    {course.pinned
                                                        ? "Unpin"
                                                        : "Pin"}
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenMenu(
                                                            null
                                                        );

                                                        setDeletingCourse(course);
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </nav>

                    {/* =================================================
                        FOOTER
                    ================================================== */}

                    <div className="flex items-center justify-between border-t border-border p-3 text-[11px] text-muted-foreground">
                        <span>
                            {filteredCourses.length}{" "}
                            {filteredCourses.length === 1
                                ? "chat"
                                : "chats"}
                        </span>

                        <Link
                            href="/course"
                            className="transition-colors hover:text-foreground"
                        >
                            Library →
                        </Link>
                    </div>
                </aside>
            )}

            {/* =========================================================
                RENAME DIALOG
            ========================================================== */}

            <Dialog
                open={Boolean(editing)}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditing(null);
                        setName("");
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Rename conversation
                        </DialogTitle>

                        <DialogDescription>
                            Choose a clear title for this workspace
                            chat.
                        </DialogDescription>
                    </DialogHeader>

                    <input
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                saveName();
                            }
                        }}
                        maxLength={100}
                        autoFocus
                        className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={saveName}
                            disabled={
                                saving || !name.trim()
                            }
                            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================================
                DELETE CONFIRMATION DIALOG
            ========================================================== */}

            <Dialog
                open={Boolean(deletingCourse)}
                onOpenChange={(open) => {
                    if (!open && !deleting) {
                        setDeletingCourse(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete conversation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-medium text-foreground">
                                {deletingCourse?.name}
                            </span>
                            ? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <button
                            type="button"
                            onClick={() => setDeletingCourse(null)}
                            disabled={deleting}
                            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={confirmDeleteCourse}
                            disabled={deleting}
                            className="rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================================
                CREATE PROJECT DIALOG
            ========================================================== */}

            <Dialog
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Create New Project
                        </DialogTitle>

                        <DialogDescription>
                            Create an isolated study project workspace
                            for your lecture notes, slides, or
                            documents.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={handleCreateProjectSubmit}
                        className="space-y-4 pt-2"
                    >
                        <div>
                            <label
                                htmlFor="project-name"
                                className="text-xs font-medium text-foreground"
                            >
                                Project Name
                            </label>

                            <input
                                id="project-name"
                                type="text"
                                value={newProjectName}
                                onChange={(e) =>
                                    setNewProjectName(
                                        e.target.value
                                    )
                                }
                                placeholder="e.g. Biology Midterm Preparation"
                                autoFocus
                                required
                                maxLength={100}
                                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <DialogFooter>
                            <button
                                type="button"
                                onClick={() => {
                                    setCreateModalOpen(false);
                                    setNewProjectName("");
                                }}
                                className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    creatingProject ||
                                    !newProjectName.trim()
                                }
                                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                            >
                                {creatingProject
                                    ? "Creating..."
                                    : "Create Project"}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}