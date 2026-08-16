import { libertinus } from "@/lib/fonts";
import Link from "next/link";
import { ThemeToggleDropdown } from "@/components/ThemeToggle";

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className={`${libertinus.className} text-2xl tracking-wide text-foreground`}>
          Notely
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggleDropdown />
          <Link
            href="/auth/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
          >
            Get Started Free
          </Link>
        </div>
      </nav>
    </header>
  );
}
