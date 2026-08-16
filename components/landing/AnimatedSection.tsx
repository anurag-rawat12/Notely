"use client";

import { useRef, useEffect, useState, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
  threshold?: number;
}

/**
 * Wraps any content so it fades + slides into view as the user scrolls.
 * Uses a single IntersectionObserver per instance — no scroll listeners.
 * Before JS mounts, content is fully visible (SSR-safe).
 */
export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const hiddenTranslate: Record<string, string> = {
    up: "translate-y-8",
    left: "-translate-x-7",
    right: "translate-x-7",
  };

  // Before JS hydrates: no classes (renders like normal HTML).
  // After mount, not yet visible: hidden + translated.
  // After observer fires: animates to visible.
  const stateClass = !mounted
    ? ""
    : visible
    ? "opacity-100 translate-x-0 translate-y-0"
    : `opacity-0 ${hiddenTranslate[direction]}`;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible && mounted ? `${delay}ms` : "0ms" }}
      className={`transition-all duration-700 ease-out ${stateClass} ${className}`}
    >
      {children}
    </div>
  );
}
