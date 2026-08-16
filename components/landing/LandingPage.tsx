import { libertinus } from "@/lib/fonts";
import Link from "next/link";
import HeroVisual from "./HeroVisual";
import AnimatedSection from "./AnimatedSection";

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M3 5h4" />
      <path d="M19 17v4" /><path d="M17 19h4" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m9 8 3 3 3-3" />
      <line x1="12" y1="11" x2="12" y2="16" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <line x1="8" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="12" y2="14" />
    </svg>
  );
}

function AnchorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <line x1="12" y1="8" x2="12" y2="21" />
      <path d="M5 15H2a10 10 0 0 0 20 0h-3" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/* ── Section: Hero ─────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section className="relative overflow-hidden mx-auto max-w-6xl px-6 pb-16 pt-24 lg:px-8 lg:pt-32">
      {/* Subtle radial gradient bg glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex items-start justify-center overflow-hidden"
      >
        <div className="h-[480px] w-[900px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/8" />
      </div>

      <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr]">
        {/* ── Left: copy ────────────────────────────────────────────────── */}
        <div>
          <p className="lp-hero-eyebrow mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            AI-powered study companion
          </p>

          <h1
            className={`lp-hero-h1 ${libertinus.className} max-w-xl text-5xl leading-[1.1] tracking-tight text-foreground sm:text-6xl lg:text-[3.8rem]`}
          >
            Turn any notes into flashcards you&apos;ll{" "}
            <em className="not-italic text-muted-foreground">actually</em> remember
          </h1>

          <p className="lp-hero-sub mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
            Upload your PDFs, slides, or documents. Notely reads them so you
            don&apos;t have to start from scratch — ask questions, generate
            flashcards, and get answers cited back to your own material.
          </p>

          <div className="lp-hero-ctas mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
            >
              Get Started Free
              <ArrowRight />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-background px-7 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              See how it works
            </a>
          </div>

          {/* Social proof micro-stat */}
          <div className="lp-hero-badge mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
              PDF, PPT, DOCX supported
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
              Cited answers only
            </span>
          </div>
        </div>

        {/* ── Right: animated visual ─────────────────────────────────────── */}
        <div className="relative pb-8 lg:pl-4">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/* ── Section: How it works ─────────────────────────────────────────────────── */

const steps = [
  {
    number: "01",
    Icon: UploadIcon,
    title: "Upload your material",
    description:
      "Drag in any PDF, PowerPoint, or Word document. Notely parses the full content — text, structure, and layout — in seconds.",
    accent: "Upload",
  },
  {
    number: "02",
    Icon: SparklesIcon,
    title: "Let AI do the heavy lifting",
    description:
      "Our RAG pipeline indexes your content and generates flashcards, summaries, and Q&A pairs tuned precisely to what you uploaded.",
    accent: "Generate",
  },
  {
    number: "03",
    Icon: ReviewIcon,
    title: "Review, ask, and retain",
    description:
      "Quiz yourself with generated flashcards or ask open questions. Every answer links back to the exact page in your notes.",
    accent: "Review",
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        <AnimatedSection className="mb-16">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            The process
          </p>
          <h2 className={`${libertinus.className} max-w-xl text-4xl tracking-tight text-foreground lg:text-5xl`}>
            From document to mastery in three steps
          </h2>
        </AnimatedSection>

        <div className="relative grid gap-0 sm:grid-cols-3">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden
            className="absolute left-1/6 right-1/6 top-[2.6rem] hidden h-px bg-border sm:block"
            style={{ left: "calc(1/6 * 100% + 24px)", right: "calc(1/6 * 100% + 24px)" }}
          />

          {steps.map((step, i) => (
            <AnimatedSection
              key={step.number}
              delay={i * 120}
              className={`relative flex flex-col gap-5 px-8 py-10
                ${i < steps.length - 1 ? "sm:border-r border-border" : ""}
                ${i > 0 ? "border-t sm:border-t-0 border-border" : ""}`}
            >
              {/* Step number circle */}
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background text-sm font-semibold text-foreground">
                  {i + 1}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {step.accent}
                </span>
              </div>

              <div className="text-foreground">
                <step.Icon />
              </div>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section: Features ─────────────────────────────────────────────────────── */

const features = [
  {
    Icon: FileIcon,
    tag: "Document support",
    title: "Every format you study from",
    body: "Upload PDFs, PowerPoint decks, Word documents, and more. Notely handles the parsing — you just drop the file and get straight to studying.",
    detail: ["PDF", "PPTX", "DOCX", "TXT"],
    visual: (
      <div className="flex flex-col gap-3">
        {[
          { name: "Organic_Chemistry.pdf", size: "2.4 MB", ext: "PDF" },
          { name: "Lecture_Slides_W3.pptx", size: "8.1 MB", ext: "PPT" },
          { name: "Essay_Draft.docx", size: "340 KB", ext: "DOC" },
        ].map((f) => (
          <div
            key={f.name}
            className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-[9px] font-bold text-muted-foreground">
                {f.ext}
              </span>
              <span className="text-sm text-foreground">{f.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">{f.size}</span>
          </div>
        ))}
        <div className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <UploadIcon />
          Drop a file to upload…
        </div>
      </div>
    ),
    flip: false,
  },
  {
    Icon: CardIcon,
    tag: "Flashcards",
    title: "Flashcards generated from your own words",
    body: "Notely extracts the key concepts, definitions, and relationships from your material and turns them into spaced-repetition-ready flashcards — no manual writing required.",
    detail: [],
    visual: (
      <div className="relative mx-auto w-full max-w-sm">
        <div className="absolute left-3 top-3 h-full w-full rounded-2xl border border-border bg-muted/60" />
        <div className="absolute left-1.5 top-1.5 h-full w-full rounded-2xl border border-border bg-muted/40" />
        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Question</p>
          <p className="text-lg font-medium leading-snug text-foreground">
            What is the role of the Krebs cycle in cellular respiration?
          </p>
          <div className="my-6 h-px bg-border" />
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">Answer</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The Krebs cycle oxidises acetyl-CoA to produce ATP, NADH, FADH₂, and CO₂,
            feeding electrons into the electron transport chain.
          </p>
          <p className="mt-4 text-[11px] text-muted-foreground/60">Source: Biology CH3, p.52</p>
        </div>
      </div>
    ),
    flip: true,
  },
  {
    Icon: ChatIcon,
    tag: "Ask your notes",
    title: "Chat with your documents like a study partner",
    body: "Ask anything about your material in plain language. Notely retrieves the relevant passages and answers in context — going beyond keyword search to actual comprehension.",
    detail: [],
    visual: (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        {[
          { role: "user", text: "Summarise the causes of World War I in three points." },
          {
            role: "ai",
            text: "1. Alliance systems created chain-reaction obligations. 2. Imperial competition over colonies. 3. Nationalism and the assassination of Archduke Franz Ferdinand.",
            cite: "History Essay, §2",
          },
          { role: "user", text: "Which alliance did Britain belong to?" },
          {
            role: "ai",
            text: "Britain was part of the Triple Entente alongside France and Russia.",
            cite: "History Essay, §2.1",
          },
        ].map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "user" ? (
              <div className="max-w-[75%] rounded-xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {msg.text}
              </div>
            ) : (
              <div className="max-w-[80%] space-y-1">
                <div className="rounded-xl rounded-tl-sm border border-border bg-background px-4 py-2.5 text-sm leading-relaxed text-foreground">
                  {msg.text}
                </div>
                {"cite" in msg && (
                  <span className="ml-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    ↗ {msg.cite}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    ),
    flip: false,
  },
  {
    Icon: AnchorIcon,
    tag: "Grounded answers",
    title: "Every answer traces back to your source",
    body: "Notely doesn't hallucinate. Responses are retrieved from — and cited to — the exact passage in your uploaded document, so you can verify every claim instantly.",
    detail: [],
    visual: (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background p-5">
          <p className="mb-3 text-sm font-medium text-foreground">AI response</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Photosynthesis in C4 plants suppresses photorespiration by concentrating CO₂ around RuBisCO
            using the bundle-sheath cells.{" "}
            <span className="inline-flex items-center gap-1">
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary dark:text-primary-foreground border border-primary/20">
                ↗ CH5, p.83
              </span>
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Source passage · Biology CH5, p.83
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            &ldquo;C4 plants avoid photorespiration by initially fixing CO₂ in mesophyll cells via PEP
            carboxylase, then concentrating it in bundle-sheath cells where RuBisCO operates.&rdquo;
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AnchorIcon />
          <span>Grounded in your document — not the open internet</span>
        </div>
      </div>
    ),
    flip: true,
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        <AnimatedSection className="mb-16">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Features
          </p>
          <h2 className={`${libertinus.className} max-w-xl text-4xl tracking-tight text-foreground lg:text-5xl`}>
            Built for the way you actually study
          </h2>
        </AnimatedSection>

        <div className="space-y-28">
          {features.map((feat, i) => (
            <AnimatedSection
              key={feat.tag}
              direction={feat.flip ? "right" : "left"}
              delay={80}
            >
              <div
                className={`grid items-center gap-12 lg:grid-cols-2 ${
                  feat.flip ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                {/* Text */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      <feat.Icon />
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">{feat.tag}</span>
                  </div>
                  <h3 className={`${libertinus.className} text-3xl tracking-tight text-foreground lg:text-4xl`}>
                    {feat.title}
                  </h3>
                  <p className="text-base leading-relaxed text-muted-foreground">{feat.body}</p>
                  {feat.detail.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {feat.detail.map((d) => (
                        <span
                          key={d}
                          className="rounded-md border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Visual */}
                <div className="w-full">{feat.visual}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section: Social proof strip ──────────────────────────────────────────── */

function SocialProofSection() {
  const stats = [
    { value: "3 formats", label: "Supported file types" },
    { value: "< 10 s", label: "Average processing time" },
    { value: "100%", label: "Source-grounded answers" },
    { value: "0", label: "Hallucinations by design" },
  ];

  return (
    <section className="border-t border-border bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 80} className="text-center">
              <p className={`${libertinus.className} text-4xl tracking-tight text-foreground`}>
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section: Final CTA ────────────────────────────────────────────────────── */

function CtaSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-28 lg:px-8">
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center shadow-sm sm:px-16">
            {/* Background glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center"
            >
              <div className="h-64 w-[600px] rounded-full bg-primary/6 blur-[80px] dark:bg-primary/10" />
            </div>

            <p className="mb-5 text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Ready to study smarter?
            </p>
            <h2 className={`${libertinus.className} text-4xl tracking-tight text-foreground lg:text-5xl`}>
              Your notes have all the answers.
              <br />
              <span className="text-muted-foreground">Let&apos;s find them.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Upload your first document in under a minute. No credit card required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-9 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
              >
                Get Started Free
                <ArrowRight />
              </Link>
            </div>

            {/* Tiny reassurance row */}
            <p className="mt-6 text-xs text-muted-foreground">
              No credit card · Cancel anytime · Works with PDF, PPTX & DOCX
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className={`${libertinus.className} text-xl text-foreground`}>Notely</p>
            <p className="mt-1 text-sm text-muted-foreground">Study smarter with your own material.</p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <Link href="/auth/login" className="transition-colors hover:text-foreground">Sign up</Link>
            <Link href="/auth/login" className="transition-colors hover:text-foreground">Log in</Link>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Notely. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ── Page assembly ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <SocialProofSection />
      <CtaSection />
      <Footer />
    </>
  );
}
