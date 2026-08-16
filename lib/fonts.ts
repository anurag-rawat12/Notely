import { Inter, Geist } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist",
});

export const libertinus = localFont({
    src: "../font/LibertinusMath-Regular.otf",
    variable: "--font-libertinus",
    display: "swap",
});
