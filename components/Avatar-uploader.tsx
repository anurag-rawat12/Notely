"use client";

import axios from "axios";
import { useState } from "react";

interface AvatarUploaderProps {
    onUploadSuccess: (url: string) => void;
}

export function AvatarUploader({ onUploadSuccess }: AvatarUploaderProps) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await axios.post("/api/upload/avatar", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (!res) throw new Error("Upload failed");

            const data = await res.data();
            onUploadSuccess(data.url);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <label className="inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {uploading ? "Uploading..." : "Upload avatar"}
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
            />
        </label>
    );
}