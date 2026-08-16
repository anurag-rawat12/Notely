import React from 'react'

const Unauthorized = () => {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6">
            <div className="flex w-full max-w-md flex-col items-center text-center">
                {/* Signature element: a locked node, echoing your dashboard's graph/flow visuals */}
                <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted">
                    <svg
                        className="h-6 w-6 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                        />
                    </svg>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Sign in to continue
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    Your dashboard, progress, and study sessions are tied to your
                    account. Sign in to pick up where you left off.
                </p>
                <a

                    href="/auth/login"
                    className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Log in
                </a>

                <p className="mt-4 text-xs text-muted-foreground">
                    New here?{" "}
                    <a href="/auth/login" className="underline underline-offset-4 hover:text-foreground">
                        Create an account
                    </a>{" "}
                    — it only takes a moment.
                </p>
            </div>
        </div >
    )
}

export default Unauthorized