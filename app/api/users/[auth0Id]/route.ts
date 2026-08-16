import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";


type Context = {
    params: Promise<{ auth0Id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
    try {
        const { auth0Id } = await context.params;

        const client = await clientPromise;
        const db = client.db();

        const user = await db.collection("users").findOne({ auth0Id });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });

    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const { auth0Id } = await context.params;
        const { name, avatarUrl } = await request.json();

        const client = await clientPromise;
        const db = client.db();

        const result = await db.collection("users").updateOne(
            { auth0Id },
            {
                $set: {
                    name,
                    avatarUrl,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const updatedUser = await db.collection("users").findOne({ auth0Id });

        return NextResponse.json(
            {
                message: "User updated successfully",
                user: updatedUser,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating user:", error);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

