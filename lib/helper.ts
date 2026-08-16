import clientPromise from "@/lib/mongodb";

export async function getUser(auth0Id: string) {
    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne({ auth0Id });

    if (!user) return null;

    return {
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt?.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
    };
}

export async function uploadFile(auth0Id: string, email: string) {

    const client = await clientPromise;
    const db = client.db();

    const user = await db.collection("users").findOne({ auth0Id });

    if (!user) {
        return {
            error: "User not found",
        }
    }





}