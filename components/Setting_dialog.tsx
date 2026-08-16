'use client';

import { useState } from 'react';
import { Loader, Upload, Settings } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import LogoutButton from './LogoutButton';
import Image from 'next/image';
import { DbUser } from '@/lib/Types';
import { ThemeSegmentedControl } from './ThemeToggle';
import axios from 'axios';

const Setting_dialog = ({ dbUser }: { dbUser: DbUser }) => {
    const [avatarUrl, setAvatarUrl] = useState<string>(dbUser?.avatarUrl || "");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [username, setusername] = useState(dbUser?.name ?? "anonymous");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const pic = avatarUrl || dbUser?.avatarUrl || "";

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            setUploadError("Please upload a JPEG, PNG, WebP, or GIF.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setUploadError("File too large — max 5MB.");
            return;
        }

        setUploadError(null);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const { data } = await axios.post("/api/upload/avatar", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setAvatarUrl(data.url);
        } catch (err) {
            console.error("Avatar upload failed:", err);
            setUploadError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const handleSaveChanges = async () => {
        if (!dbUser) return;

        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);

        try {
            await axios.patch(`/api/users/${dbUser.auth0Id}`, {
                name: username,
                avatarUrl: avatarUrl || null,
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (error: any) {
            setSaveError(
                error.response?.data?.error || "Failed to save changes."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleRemovePhoto = () => {
        setAvatarUrl("");
    };

    return (
        <Dialog>
            <DialogTrigger>
                <div
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Settings</span>
                </div>
            </DialogTrigger>

            <DialogContent className="max-w-md! w-[95vw] max-h-[85vh] overflow-y-auto p-6 bg-card border-border text-foreground">
                <div className="border-b border-border pb-4">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        Settings
                    </DialogTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Manage your profile preferences and appearance.
                    </p>
                </div>

                {/* Appearance Theme Selector */}
                <div className="space-y-2 pt-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Theme Appearance
                    </label>
                    <ThemeSegmentedControl />
                </div>

                {/* Profile Info */}
                <div className="space-y-4 pt-2 border-t border-border">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Profile Information
                    </h3>

                    <div>
                        <label className="text-xs font-medium text-foreground">Preferred Name</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setusername(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-foreground">Avatar</label>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-muted-foreground font-semibold text-base">
                                {uploading ? (
                                    <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                                ) : pic ? (
                                    <Image
                                        src={pic}
                                        width={48}
                                        height={48}
                                        alt="Profile Picture"
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span>{username?.[0]?.toUpperCase() ?? "?"}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={uploading}
                                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                                    onClick={() => document.getElementById('imageUploadInput')?.click()}
                                >
                                    <input
                                        type="file"
                                        id="imageUploadInput"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>{uploading ? "Uploading..." : "Change photo"}</span>
                                </button>
                                {pic && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        disabled={uploading}
                                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted-foreground">JPEG, PNG, WebP, max 5 MB.</p>
                        {uploadError && (
                            <p className="mt-1 text-xs text-destructive">{uploadError}</p>
                        )}
                    </div>
                </div>

                {saveError && <p className="text-xs text-destructive">{saveError}</p>}
                {saveSuccess && <p className="text-xs text-emerald-600 dark:text-emerald-400">Profile saved successfully!</p>}

                <div className="flex items-center justify-between border-t border-border pt-4">
                    <LogoutButton className="w-auto! px-3! py-1.5! text-xs!" />

                    <button
                        onClick={handleSaveChanges}
                        disabled={saving || uploading}
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Setting_dialog;