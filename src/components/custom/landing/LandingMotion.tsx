"use client";

/**
 * Small, dependency-free motion helpers for the landing page.
 * All animation lives in CSS (`brand.css`, "Landing page motion") and is
 * disabled under prefers-reduced-motion; these components only toggle classes
 * or numbers.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** True once the element has been on screen (fires once). */
export function useInView<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, threshold]);
  return { ref, inView };
}

/** Slides its children up into place when scrolled into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const { ref, inView } = useInView<HTMLElement>(0.15);
  return (
    <Tag
      ref={ref as never}
      className={`landing-reveal ${inView ? "is-in" : ""} ${className}`.trim()}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** An endless scrolling band (content is rendered twice for the loop). */
export function Marquee({
  items,
  reverse = false,
  className = "",
  itemClassName = "",
}: {
  items: readonly string[];
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  const row = (hidden: boolean) =>
    items.map((t, i) => (
      <span
        key={`${hidden}-${i}`}
        aria-hidden={hidden || undefined}
        className={`flex shrink-0 items-center ${itemClassName}`}
      >
        {t}
        <span aria-hidden className="mx-5 opacity-60">
          {"//"}
        </span>
      </span>
    ));
  return (
    <div className={`landing-marquee overflow-hidden ${className}`.trim()}>
      <div className={`landing-marquee-track ${reverse ? "is-reverse" : ""}`}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Cycles through words, each in its own colour chip. */
export function CycleWord({
  words,
  interval = 2200,
}: {
  words: readonly { text: string; className: string }[];
  interval?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced || words.length < 2) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => window.clearInterval(id);
  }, [reduced, words.length, interval]);
  const w = words[i];
  return (
    <span className="relative inline-block align-baseline" aria-live="polite">
      <span
        key={w.text}
        className={`landing-pop rounded-[10px] border-[3px] border-border-ink px-2 shadow-brutal-sm ${w.className}`}
      >
        {w.text}
      </span>
    </span>
  );
}

/** Counts from 0 to `to` when it scrolls into view. */
export function CountUp({
  to,
  decimals = 0,
  duration = 1100,
  suffix = "",
  className = "",
}: {
  to: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const reduced = usePrefersReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setV(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to, duration]);
  return (
    <span ref={ref} className={`tabular-nums ${className}`.trim()}>
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}
