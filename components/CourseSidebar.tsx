"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    ChevronRight, FolderOpen, Folder, MessageSquare, Pin, Plus,
    Pencil, Trash2, Search, MoreHorizontal, X, PanelLeftClose,
    PanelLeftOpen, Palette, Briefcase, Loader2, Users, AlertTriangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { libertinus } from "@/lib/fonts";
import { useTheme } from "next-themes";
import { DbUser } from "@/lib/Types";
import Profile from "./Profile";

// ─── Types ────────────────────────────────────────────────────────────────

export type SidebarCourse = {
    id: string;
    name: string;
    pinned?: boolean;
    isCollaborator?: boolean;
    updatedAt?: Date | string;
    messageCount?: number;
    projectId?: string;
};

export type SidebarProject = {
    id: string;
    name: string;
};

interface CourseSidebarProps {
    courses: SidebarCourse[];
    projects: SidebarProject[];
    userId: string;
    dbUser?: DbUser | null;
    activeProjectId?: string;
}

type TabFilter = "chats" | "shared" | "all";

// ─── Small helpers ────────────────────────────────────────────────────────

function ChatItem({
    course,
    active,
    onDelete,
    onRename,
    onPin,
}: {
    course: SidebarCourse;
    active: boolean;
    onDelete: (c: SidebarCourse) => void;
    onRename: (c: SidebarCourse) => void;
    onPin: (c: SidebarCourse) => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div
            className={`group relative flex items-center rounded-lg transition-colors ${
                active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            }`}
        >
            <Link
                href={`/dashboard/${course.id}`}
                className="min-w-0 flex-1 truncate px-2.5 py-2 text-xs"
                title={course.name}
            >
                <div className="flex items-center justify-between gap-1">
                    <span className="truncate">{course.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                        {course.isCollaborator && (
                            <span title="Shared course">
                                <Users className="h-3 w-3 text-muted-foreground/70" />
                            </span>
                        )}
                        {course.pinned && <Pin className="h-2.5 w-2.5 fill-current opacity-60" />}
                    </div>
                </div>
                {course.messageCount !== undefined && course.messageCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/60">{course.messageCount} msg</span>
                )}
            </Link>

            <div className="relative mr-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground"
                >
                    <MoreHorizontal className="h-3 w-3" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 z-40 mt-1 w-36 rounded-xl border border-border bg-popover p-1 shadow-lg text-popover-foreground animate-in fade-in-0 zoom-in-95 duration-100">
                        <button type="button" onClick={() => { onRename(course); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted">
                            <Pencil className="h-3 w-3" /> Rename
                        </button>
                        <button type="button" onClick={() => { onPin(course); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-muted">
                            <Pin className="h-3 w-3" /> {course.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button type="button" onClick={() => { onDelete(course); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-3 w-3" /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────

export default function CourseSidebar({ courses, projects: initialProjects, userId, dbUser, activeProjectId }: CourseSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<TabFilter>("chats");
    const [searchQuery, setSearchQuery] = useState("");
    const [editingCourse, setEditingCourse] = useState<SidebarCourse | null>(null);
    const [editName, setEditName] = useState("");
    const [saving, setSaving] = useState(false);

    // Deletion states & loading
    const [deletingCourse, setDeletingCourse] = useState<SidebarCourse | null>(null);
    const [deletingProject, setDeletingProject] = useState<SidebarProject | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Projects
    const [projects, setProjects] = useState<SidebarProject[]>(initialProjects);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
        new Set(activeProjectId ? [activeProjectId] : [initialProjects[0]?.id].filter(Boolean))
    );
    const [createProjectOpen, setCreateProjectOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [creatingProject, setCreatingProject] = useState(false);
    const [editingProject, setEditingProject] = useState<SidebarProject | null>(null);
    const [editProjectName, setEditProjectName] = useState("");
    const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null);

    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    // ── helpers ──────────────────────────────────────────────────────────

    const toggleTheme = () => {
        if (theme === "dark") setTheme("light");
        else if (theme === "light") setTheme("system");
        else setTheme("dark");
    };

    const instantNewChat = useCallback(async (projectId?: string) => {
        const uuid = crypto.randomUUID();
        try {
            await axios.post("/api/courses", { courseId: uuid, userId, name: "New conversation", projectId });
            router.push(`/dashboard/${uuid}`);
        } catch {
            router.push("/dashboard");
        }
    }, [userId, router]);

    const createProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim() || creatingProject) return;
        setCreatingProject(true);
        try {
            const { data } = await axios.post("/api/projects", { name: newProjectName });
            const newProj: SidebarProject = { id: data.projectId, name: newProjectName.trim() };
            setProjects((prev) => [newProj, ...prev]);
            setExpandedProjects((prev) => new Set([...prev, newProj.id]));
            setNewProjectName("");
            setCreateProjectOpen(false);
        } finally {
            setCreatingProject(false);
        }
    };

    const confirmDeleteProject = async () => {
        if (!deletingProject) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/api/projects/${deletingProject.id}`);
            setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
            setDeletingProject(null);
            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDeleteCourse = async () => {
        if (!deletingCourse) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/api/courses?course_id=${deletingCourse.id}&user_id=${encodeURIComponent(userId)}`);
            if (pathname === `/dashboard/${deletingCourse.id}`) router.push("/dashboard");
            setDeletingCourse(null);
            router.refresh();
        } finally {
            setIsDeleting(false);
        }
    };

    const renameProject = async () => {
        if (!editingProject || !editProjectName.trim()) return;
        await axios.patch(`/api/projects/${editingProject.id}`, { name: editProjectName });
        setProjects((prev) => prev.map((p) => p.id === editingProject.id ? { ...p, name: editProjectName.trim() } : p));
        setEditingProject(null);
        router.refresh();
    };

    const renameCourse = async () => {
        if (!editingCourse || !editName.trim()) return;
        setSaving(true);
        try {
            await axios.patch("/api/courses", { courseId: editingCourse.id, userId, name: editName });
            setEditingCourse(null);
            router.refresh();
        } finally {
            setSaving(false);
        }
    };

    const pinCourse = async (course: SidebarCourse) => {
        await axios.patch("/api/courses", { courseId: course.id, userId, pinned: !course.pinned });
        router.refresh();
    };

    const toggleProject = (id: string) => {
        setExpandedProjects((prev) => {
            const s = new Set(prev);
            if (s.has(id)) s.delete(id);
            else s.add(id);
            return s;
        });
    };

    // ── Filtered lists ────────────────────────────────────────────────────

    const q = searchQuery.toLowerCase();

    // Project chats mapping
    const projectChats = useMemo(() => {
        const map: Record<string, SidebarCourse[]> = {};
        projects.forEach((p) => { map[p.id] = []; });
        courses.forEach((c) => {
            if (c.projectId && map[c.projectId]) {
                if (!q || c.name.toLowerCase().includes(q)) {
                    if (activeTab === "shared" && !c.isCollaborator) return;
                    map[c.projectId].push(c);
                }
            }
        });
        return map;
    }, [courses, projects, q, activeTab]);

    // Standalone / Quick chats
    const quickChats = useMemo(() =>
        courses.filter((c) => {
            if (c.projectId) return false;
            if (q && !c.name.toLowerCase().includes(q)) return false;
            if (activeTab === "shared") return Boolean(c.isCollaborator);
            return true;
        }),
        [courses, q, activeTab]
    );

    // Shared chats list (all shared courses regardless of project)
    const sharedChats = useMemo(() =>
        courses.filter((c) => c.isCollaborator && (!q || c.name.toLowerCase().includes(q))),
        [courses, q]
    );

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <div className="flex h-full shrink-0 select-none">
            {/* ── Icon Rail ──────────────────────────────────────────────── */}
            <div className="flex h-full w-14 flex-col items-center justify-between border-r border-border bg-sidebar py-3 text-sidebar-foreground">
                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCollapsed((v) => !v)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => instantNewChat()}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-xs transition-all hover:scale-105 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        title="New conversation"
                    >
                        <Plus className="h-4 w-4" />
                    </button>

                    <div className="my-1 h-px w-6 bg-border" />

                    {/* Chats Icon */}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("chats");
                            if (collapsed) setCollapsed(false);
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                            activeTab === "chats" && !collapsed
                                ? "bg-sidebar-accent text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                        }`}
                        title="Chats"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </button>

                    {/* Projects Icon */}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("all");
                            if (collapsed) setCollapsed(false);
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                            activeTab === "all" && !collapsed
                                ? "bg-sidebar-accent text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                        }`}
                        title="Projects"
                    >
                        <FolderOpen className="h-4 w-4" />
                    </button>

                    {/* Shared Icon */}
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab("shared");
                            if (collapsed) setCollapsed(false);
                        }}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                            activeTab === "shared" && !collapsed
                                ? "bg-sidebar-accent text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                        }`}
                        title="Shared with me"
                    >
                        <Briefcase className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                        title={`Theme: ${theme}`}
                    >
                        <Palette className="h-4 w-4" />
                    </button>
                    {dbUser && <div className="scale-90"><Profile dbUser={dbUser} /></div>}
                </div>
            </div>

            {/* ── Expanded Panel ─────────────────────────────────────────── */}
            {!collapsed && (
                <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
                    {/* Header */}
                    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                        <Link href="/dashboard" className={`${libertinus.className} text-xl font-semibold tracking-wide text-foreground`}>
                            Notely
                        </Link>
                        <button
                            type="button"
                            onClick={() => setCreateProjectOpen(true)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-muted transition-colors"
                        >
                            <Plus className="h-3 w-3" /> Project
                        </button>
                    </div>

                    {/* Search & Tab Switcher */}
                    <div className="px-3 py-2 space-y-2">
                        <div className="relative flex items-center">
                            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search chats…"
                                className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                            />
                            {searchQuery && (
                                <button type="button" onClick={() => setSearchQuery("")} className="absolute right-2 text-muted-foreground hover:text-foreground">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs (Chats / Shared / All) */}
                        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/60 p-0.5">
                            <button
                                type="button"
                                onClick={() => setActiveTab("chats")}
                                className={`rounded-md py-1 text-center text-[11px] font-medium transition-colors ${
                                    activeTab === "chats"
                                        ? "bg-card text-foreground font-semibold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Chats
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("shared")}
                                className={`rounded-md py-1 text-center text-[11px] font-medium transition-colors ${
                                    activeTab === "shared"
                                        ? "bg-card text-foreground font-semibold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                Shared
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("all")}
                                className={`rounded-md py-1 text-center text-[11px] font-medium transition-colors ${
                                    activeTab === "all"
                                        ? "bg-card text-foreground font-semibold shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                All
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tree */}
                    <nav className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">

                        {/* ── SHARED VIEW ───────────────────────────────── */}
                        {activeTab === "shared" ? (
                            <div>
                                <div className="mt-1 mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                    Shared with me ({sharedChats.length})
                                </div>
                                {sharedChats.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-muted-foreground/70 px-3 space-y-1">
                                        <p className="font-medium text-foreground">No shared chats yet</p>
                                        <p className="text-[11px]">When someone invites you to a course, it will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5">
                                        {sharedChats.map((chat) => (
                                            <ChatItem
                                                key={chat.id}
                                                course={chat}
                                                active={pathname === `/dashboard/${chat.id}`}
                                                onDelete={(c) => setDeletingCourse(c)}
                                                onRename={(c) => { setEditingCourse(c); setEditName(c.name); }}
                                                onPin={pinCourse}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── CHATS / ALL VIEW ────────────────────────── */
                            <>
                                {/* Projects */}
                                {projects.map((project) => {
                                    const expanded = expandedProjects.has(project.id);
                                    const chats = projectChats[project.id] ?? [];

                                    return (
                                        <div key={project.id}>
                                            {/* Project Row */}
                                            <div
                                                className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60 ${
                                                    activeProjectId === project.id ? "bg-sidebar-accent" : ""
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleProject(project.id)}
                                                    className="flex flex-1 items-center gap-1.5 text-left"
                                                >
                                                    <ChevronRight className={`h-3 w-3 text-muted-foreground/70 transition-transform ${expanded ? "rotate-90" : ""}`} />
                                                    {expanded
                                                        ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                        : <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                    }
                                                    <span className="truncate text-xs font-medium text-foreground">{project.name}</span>
                                                    {chats.length > 0 && (
                                                        <span className="ml-auto shrink-0 rounded bg-muted px-1 text-[10px] text-muted-foreground">{chats.length}</span>
                                                    )}
                                                </button>

                                                {/* Project context menu */}
                                                <div className="relative opacity-0 group-hover:opacity-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProjectMenuOpen((v) => v === project.id ? null : project.id)}
                                                        className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-card hover:text-foreground"
                                                    >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </button>
                                                    {projectMenuOpen === project.id && (
                                                        <div className="absolute right-0 z-40 mt-1 w-40 rounded-xl border border-border bg-popover p-1 shadow-lg text-popover-foreground animate-in fade-in-0 zoom-in-95">
                                                            <button type="button" onClick={() => { setProjectMenuOpen(null); instantNewChat(project.id); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted">
                                                                <Plus className="h-3 w-3" /> New Chat
                                                            </button>
                                                            <button type="button" onClick={() => { setEditingProject(project); setEditProjectName(project.name); setProjectMenuOpen(null); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted">
                                                                <Pencil className="h-3 w-3" /> Rename
                                                            </button>
                                                            <button type="button" onClick={() => { setDeletingProject(project); setProjectMenuOpen(null); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                                                                <Trash2 className="h-3 w-3" /> Delete project
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Project Chats */}
                                            {expanded && (
                                                <div className="ml-6 mt-0.5 space-y-0.5">
                                                    {chats.length === 0 ? (
                                                        <div className="py-2 px-2 text-[11px] text-muted-foreground/60 italic">
                                                            No chats yet.{" "}
                                                            <button type="button" onClick={() => instantNewChat(project.id)} className="underline underline-offset-2 hover:text-foreground">Start one</button>
                                                        </div>
                                                    ) : (
                                                        chats.map((chat) => (
                                                            <ChatItem
                                                                key={chat.id}
                                                                course={chat}
                                                                active={pathname === `/dashboard/${chat.id}`}
                                                                onDelete={(c) => setDeletingCourse(c)}
                                                                onRename={(c) => { setEditingCourse(c); setEditName(c.name); }}
                                                                onPin={pinCourse}
                                                            />
                                                        ))
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => instantNewChat(project.id)}
                                                        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" /> New chat
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Quick / Unsorted Chats */}
                                {quickChats.length > 0 && (
                                    <div>
                                        <div className="mt-3 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                                            Quick Chats
                                        </div>
                                        <div className="space-y-0.5">
                                            {quickChats.map((chat) => (
                                                <ChatItem
                                                    key={chat.id}
                                                    course={chat}
                                                    active={pathname === `/dashboard/${chat.id}`}
                                                    onDelete={(c) => setDeletingCourse(c)}
                                                    onRename={(c) => { setEditingCourse(c); setEditName(c.name); }}
                                                    onPin={pinCourse}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {courses.length === 0 && projects.length === 0 && (
                                    <div className="py-8 text-center text-xs text-muted-foreground/70">
                                        <p>No projects or chats yet.</p>
                                        <button type="button" onClick={() => instantNewChat()} className="mt-2 underline underline-offset-2 hover:text-foreground">
                                            Start a chat
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>{projects.length} project{projects.length !== 1 ? "s" : ""} · {courses.length} chat{courses.length !== 1 ? "s" : ""}</span>
                        <Link href="/course" className="hover:text-foreground transition-colors">Library</Link>
                    </div>
                </aside>
            )}

            {/* ── Dialogs ──────────────────────────────────────────────────── */}

            {/* Delete Chat Confirmation Dialog */}
            <Dialog open={Boolean(deletingCourse)} onOpenChange={(open) => !open && setDeletingCourse(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" /> Delete conversation
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{deletingCourse?.name}"</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeletingCourse(null)}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteCourse}
                            disabled={isDeleting}
                            className="rounded-lg bg-destructive px-3.5 py-2 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            {isDeleting ? <><Loader2 className="h-3 w-3 animate-spin inline mr-1" />Deleting…</> : "Delete"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Project Confirmation Dialog */}
            <Dialog open={Boolean(deletingProject)} onOpenChange={(open) => !open && setDeletingProject(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" /> Delete project
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground pt-1">
                            Are you sure you want to delete project <span className="font-semibold text-foreground">"{deletingProject?.name}"</span> and all of its chats? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <button
                            type="button"
                            onClick={() => setDeletingProject(null)}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={confirmDeleteProject}
                            disabled={isDeleting}
                            className="rounded-lg bg-destructive px-3.5 py-2 text-xs font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                        >
                            {isDeleting ? <><Loader2 className="h-3 w-3 animate-spin inline mr-1" />Deleting…</> : "Delete Project"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Chat */}
            <Dialog open={Boolean(editingCourse)} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename conversation</DialogTitle>
                    </DialogHeader>
                    <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && renameCourse()}
                        autoFocus maxLength={100}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <DialogFooter>
                        <button type="button" onClick={renameCourse} disabled={saving || !editName.trim()} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Project */}
            <Dialog open={Boolean(editingProject)} onOpenChange={(open) => !open && setEditingProject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename project</DialogTitle>
                    </DialogHeader>
                    <input
                        value={editProjectName}
                        onChange={(e) => setEditProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && renameProject()}
                        autoFocus maxLength={80}
                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <DialogFooter>
                        <button type="button" onClick={renameProject} disabled={!editProjectName.trim()} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                            Save
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Project */}
            <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>New Project</DialogTitle>
                        <DialogDescription>Create a folder to organize related study chats together.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createProject} className="space-y-4 pt-1">
                        <div>
                            <label className="text-xs font-medium text-foreground">Project name</label>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="e.g. Biology Midterm"
                                autoFocus required
                                className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <DialogFooter>
                            <button type="button" onClick={() => setCreateProjectOpen(false)} className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted">Cancel</button>
                            <button type="submit" disabled={creatingProject || !newProjectName.trim()} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                                {creatingProject ? <><Loader2 className="h-3 w-3 animate-spin inline mr-1" />Creating…</> : "Create"}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}