"use client";

import { useState, useEffect } from "react";

/* ── Inline SVG atoms ─────────────────────────────────────────────────────── */

function FileDocIcon({ ext }: { ext: string }) {
  const color =
    ext === "PDF" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
    : ext === "PPT" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
    : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${color}`}>
      {ext}
    </span>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span className="lp-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <span className="lp-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
      <span className="lp-dot h-1.5 w-1.5 rounded-full bg-muted-foreground" />
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export default function HeroVisual() {
  // Flashcard: toggle between Q and A every 3 s
  const [showAnswer, setShowAnswer] = useState(false);
  // Chat: simulate an AI response arriving after 1.6 s
  const [chatPhase, setChatPhase] = useState<"typing" | "replied">("typing");

  useEffect(() => {
    const t = setTimeout(() => setChatPhase("replied"), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setShowAnswer((v) => !v), 3200);
    return () => clearInterval(iv);
  }, []);

  const docs = [
    { name: "Biology CH3", ext: "PDF" },
    { name: "Chem Slides", ext: "PPT" },
    { name: "History Essay", ext: "DOC" },
  ];

  return (
    /* Outer wrapper picks up the lp-hero-visual CSS animation (float + entrance) */
    <div className="lp-hero-visual relative w-full select-none" aria-hidden>
      {/* ── App mockup card ──────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-border/30">
        {/* Browser chrome */}
        <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border bg-muted/50 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-border/80" />
          <span className="mx-auto rounded-md border border-border bg-background px-3 py-0.5 text-[10px] text-muted-foreground">
            notely.app/dashboard
          </span>
        </div>

        {/* App body */}
        <div className="grid grid-cols-[148px_1fr] divide-x divide-border">
          {/* Sidebar */}
          <div className="space-y-0.5 bg-sidebar p-3">
            <p className="mb-2 px-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
              Documents
            </p>
            {docs.map((doc, i) => (
              <div
                key={doc.name}
                className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[11px] transition-colors ${
                  i === 0
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground"
                }`}
              >
                <FileDocIcon ext={doc.ext} />
                <span className="truncate">{doc.name}</span>
              </div>
            ))}

            {/* Upload progress indicator */}
            <div className="mt-3 rounded-lg border border-dashed border-border p-2 text-[10px] text-muted-foreground">
              <div className="mb-1.5 flex items-center justify-between">
                <span>Uploading…</span>
                <span>72%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                <div className="lp-progress h-full rounded-full bg-primary/70" />
              </div>
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex flex-col gap-3 p-4">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[11px] leading-relaxed text-primary-foreground">
                What is the role of ATP synthase in cellular respiration?
              </div>
            </div>

            {/* AI response */}
            <div className="flex justify-start">
              {chatPhase === "typing" ? (
                <div className="rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2.5">
                  <TypingDots />
                </div>
              ) : (
                <div className="max-w-[90%] space-y-1.5">
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2.5 text-[11px] leading-relaxed text-foreground">
                    ATP synthase harnesses the proton gradient across the inner mitochondrial membrane to drive the phosphorylation of ADP → ATP.
                  </div>
                  <span className="ml-1 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    ↗ Biology CH3, p.61
                  </span>
                </div>
              )}
            </div>

            {/* Second user message (always shown) */}
            <div className="flex justify-end">
              <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-[11px] leading-relaxed text-primary-foreground">
                Generate flashcards from this chapter
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating flashcard chip ──────────────────────────────────────── */}
      <div className="lp-chip-float absolute -bottom-5 -right-4 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-border/20">
        <div className="border-b border-border bg-muted/40 px-3 py-2 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Flashcard</span>
          <span className="text-[9px] text-muted-foreground">1 / 5</span>
        </div>
        <div className="relative min-h-[68px] p-3">
          {/* Question layer */}
          <div
            className="absolute inset-3 transition-opacity duration-500 ease-in-out"
            style={{ opacity: showAnswer ? 0 : 1 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Question</p>
            <p className="text-[11px] font-medium leading-snug text-foreground">
              What is ATP synthase?
            </p>
          </div>
          {/* Answer layer */}
          <div
            className="absolute inset-3 transition-opacity duration-500 ease-in-out"
            style={{ opacity: showAnswer ? 1 : 0 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Answer</p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              An enzyme that synthesises ATP using the mitochondrial proton gradient.
            </p>
          </div>
        </div>
        <div className="border-t border-border px-3 py-1.5">
          <p className="text-[9px] text-muted-foreground">
            {showAnswer ? "✓ Tap to see question" : "↩ Tap to reveal answer"}
          </p>
        </div>
      </div>

      {/* ── Stat badge (top-left corner) ──────────────────────────────────── */}
      <div className="absolute -left-4 -top-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-md ring-1 ring-border/20">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
          ✦
        </span>
        <span className="text-[10px] font-medium text-foreground">AI-generated · 0 hallucinations</span>
      </div>
    </div>
  );
}
