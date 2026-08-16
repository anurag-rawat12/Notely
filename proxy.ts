import { auth0 } from "./lib/auth0";

export async function proxy(request: Request) {
    return await auth0.middleware(request);
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};