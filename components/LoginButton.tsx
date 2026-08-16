"use client";

import { redirect } from "next/navigation";
import { Button } from "./ui/button";

export default function LoginButton() {
    return (
        <Button
            className="flex items-center px-6 py-2.5 cursor-pointer text-primary-foreground font-medium"
            onClick={() => redirect('/auth/login')}
        >
            Log in
        </Button>
    );
}