import { NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import clientPromise from "./mongodb";

export const auth0 = new Auth0Client({
    async onCallback(error, context, session) {
        if (error) {
            console.error("Auth0 callback error:", error);

            return NextResponse.redirect(
                new URL(
                    `/error?error=${encodeURIComponent(error.message)}`,
                    process.env.APP_BASE_URL
                )
            );
        }

        if (session?.user) {
            try {
                const client = await clientPromise;
                const db = client.db();

                // Store only the Auth0 user id without the provider prefix
                const auth0Id = session.user.sub.split("|")[1];

                const user = await db.collection("users").findOne({ auth0Id });

                if (user) {
                    return NextResponse.redirect(
                        new URL(context.returnTo || "/dashboard", process.env.APP_BASE_URL)
                    );
                }

                await db.collection("users").updateOne(
                    { auth0Id },
                    {
                        $set: {
                            name: session.user.name,
                            email: session.user.email,
                            avatarUrl: session.user.picture,
                        },
                        $setOnInsert: {
                            auth0Id,
                            createdAt: new Date(),
                        },
                    },
                    { upsert: true }
                );
            } catch (err) {
                console.error("Failed to sync user to DB:", err);
            }
        }

        return NextResponse.redirect(
            new URL(context.returnTo || "/dashboard", process.env.APP_BASE_URL)
        );
    },
});