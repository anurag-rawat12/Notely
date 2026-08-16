import React from "react";
import { Button } from "./ui/button";
import { libertinus } from "@/lib/fonts";
import LoginButton from "./LoginButton";

const Navbar = () => {
    return (
        <nav className="flex h-16 items-center justify-between px-[5vw] mt-3">
            <div className={`${libertinus.className} text-2xl `}>
                Notely
            </div>

            <LoginButton />

        </nav>
    );
};

export default Navbar;