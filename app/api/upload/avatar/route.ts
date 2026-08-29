import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth0 } from "@/lib/auth0";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
    try {
        const session = await auth0.getSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadResult: any = await new Promise((resolve, reject) => {
            cloudinary.uploader
                .upload_stream(
                    {
                        folder: "avatars",
                        public_id: session.user.sub.split("|")[1],
                        overwrite: true,
                        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
                    },
                    (error, result) => (error ? reject(error) : resolve(result))
                )
                .end(buffer);
        });

        // Save straight to Mongo here — same request, same auth context

        const client = await clientPromise;
        const db = client.db();
        await db.collection("users").updateOne(
            { auth0Id: session.user.sub.split("|")[1] },
            { $set: { avatarUrl: uploadResult.secure_url, updatedAt: new Date() } }
        );

        return NextResponse.json({ url: uploadResult.secure_url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}