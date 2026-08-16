"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Copy, Check, Globe, UserPlus, Share2, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ShareDialogProps {
    courseId: string;
    courseName: string;
    initialPublicShareId?: string;
}

export default function ShareDialog({ courseId, courseName, initialPublicShareId }: ShareDialogProps) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<"link" | "invite">("link");
    
    // Public link state
    const [publicShareId, setPublicShareId] = useState<string | undefined>(initialPublicShareId);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [copied, setCopied] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);

    // Invite state
    const [email, setEmail] = useState("");
    const [collaborators, setCollaborators] = useState<string[]>([]);
    const [loadingCollabs, setLoadingCollabs] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (open && tab === "invite") {
            fetchCollaborators();
        }
    }, [open, tab]);

    const fetchCollaborators = async () => {
        setLoadingCollabs(true);
        try {
            const res = await axios.get(`/api/courses/${courseId}/collaborators`);
            setCollaborators(res.data.collaborators ?? []);
        } catch {
            // Silently handle or set error
        } finally {
            setLoadingCollabs(false);
        }
    };

    const handleGenerateLink = async () => {
        setGeneratingLink(true);
        setLinkError(null);
        try {
            const res = await axios.post("/api/courses/share", { courseId });
            setPublicShareId(res.data.publicShareId);
        } catch (err) {
            setLinkError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed to generate link" : "Failed to generate link");
        } finally {
            setGeneratingLink(false);
        }
    };

    const getShareUrl = () => {
        if (!publicShareId) return "";
        if (typeof window !== "undefined") {
            return `${window.location.origin}/share/${publicShareId}`;
        }
        return `/share/${publicShareId}`;
    };

    const handleCopy = () => {
        const url = getShareUrl();
        if (!url) return;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || inviting) return;

        setInviting(true);
        setInviteError(null);
        setInviteSuccess(null);

        try {
            const res = await axios.post(`/api/courses/${courseId}/collaborators`, { email });
            setCollaborators(res.data.collaborators ?? []);
            setInviteSuccess(`Invited ${email}`);
            setEmail("");
        } catch (err) {
            setInviteError(axios.isAxiosError(err) ? err.response?.data?.error ?? "Failed to invite" : "Failed to invite");
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveCollaborator = async (collabEmail: string) => {
        try {
            const res = await axios.delete(`/api/courses/${courseId}/collaborators?email=${encodeURIComponent(collabEmail)}`);
            setCollaborators(res.data.collaborators ?? []);
        } catch {
            // Silently ignore or show notice
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
            </DialogTrigger>
            <DialogContent className="max-w-md gap-0 p-0 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <DialogHeader className="border-b border-border p-5 pb-4">
                    <DialogTitle className="text-lg font-semibold text-foreground">
                        Share &ldquo;{courseName}&rdquo;
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Manage public links and collaborator access for this course.
                    </DialogDescription>

                    <div className="mt-4 flex border-b border-border -mb-4">
                        <button
                            type="button"
                            onClick={() => setTab("link")}
                            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                                tab === "link"
                                    ? "border-primary text-foreground font-semibold"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Globe className="h-3.5 w-3.5" />
                            Public Link
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("invite")}
                            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                                tab === "invite"
                                    ? "border-primary text-foreground font-semibold"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            Invite Collaborator
                        </button>
                    </div>
                </DialogHeader>

                <div className="p-5">
                    {tab === "link" ? (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted/50 border border-border p-3">
                                <p className="text-xs font-medium text-foreground">View-only Access</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Anyone with the link can view this course&apos;s chat history without signing in.
                                </p>
                            </div>

                            {linkError && (
                                <p className="text-xs text-destructive">{linkError}</p>
                            )}

                            {publicShareId ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Shareable Link</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 truncate rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground">
                                            {getShareUrl()}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                                        >
                                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                            {copied ? "Copied" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleGenerateLink}
                                    disabled={generatingLink}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {generatingLink ? (
                                        <>
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Generating link…
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="h-3.5 w-3.5" />
                                            Generate public link
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <form onSubmit={handleInvite} className="space-y-3">
                                <label className="text-xs font-medium text-muted-foreground">Invite by Email</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        required
                                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
                                    />
                                    <button
                                        type="submit"
                                        disabled={inviting || !email.trim()}
                                        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                                    >
                                        {inviting ? "Inviting…" : "Invite"}
                                    </button>
                                </div>
                                {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
                                {inviteSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400">{inviteSuccess}</p>}
                            </form>

                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">Collaborators ({collaborators.length})</p>
                                {loadingCollabs ? (
                                    <p className="text-xs text-muted-foreground">Loading collaborators…</p>
                                ) : collaborators.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No collaborators invited yet.</p>
                                ) : (
                                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                                        {collaborators.map((collabEmail) => (
                                            <div
                                                key={collabEmail}
                                                className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground"
                                            >
                                                <span className="truncate">{collabEmail}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCollaborator(collabEmail)}
                                                    title="Remove collaborator"
                                                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
