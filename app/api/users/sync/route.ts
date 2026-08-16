import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
    try {
        const { auth0Id, email, name, picture } = await request.json();

        if (!auth0Id || !email) {
            return NextResponse.json(
                { message: "auth0Id and email are required." },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        const users = db.collection("users");

        await users.updateOne(
            { auth0Id },
            {
                $set: {
                    email,
                    name,
                    avatarUrl: picture,
                    updatedAt: new Date(),
                },
                $setOnInsert: {
                    createdAt: new Date(),
                },
            },
            {
                upsert: true,
            }
        );

        const user = await users.findOne({ auth0Id });

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("User sync failed:", error);

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}