import { auth0 } from "./auth0";

export async function getAuth() {
    const session = await auth0.getSession();

    return {
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session,
    };
}