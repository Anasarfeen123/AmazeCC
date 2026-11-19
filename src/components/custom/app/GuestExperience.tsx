"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, Moon, Sun } from "lucide-react";

/**
 * The below-the-fold landing (feature grid, predictor sandbox, showcase,
 * timeline, roadmap, FAQ) moved here from `LoginForm`. It stays behind a
 * dynamic import so a guest paints the hero above the fold first.
 */
const LandingSections = dynamic(() => import("../landing/LandingSections"), {
  ssr: false,
  loading: () => <div className="h-64" aria-hidden="true" />,
});

const SECTIONS = [
  { id: "sec-problem", label: "Why" },
  { id: "sec-features", label: "Modules" },
  { id: "sec-timeline", label: "A day" },
  { id: "sec-roadmap", label: "Roadmap" },
  { id: "sec-faq", label: "FAQ" },
];

interface GuestExperienceProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export default function GuestExperience({ onGetStarted, onTryDemo }: GuestExperienceProps) {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is only known in the browser; until mount, render the dark variant
  // the server rendered so hydration matches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme ? resolvedTheme === "dark" : true;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLink =
    "rounded-[8px] px-2 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-heading";

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-background text-text-heading selection:bg-secondary">
      <header
        className={`sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 px-4 transition-colors duration-200 sm:px-8 ${
          isScrolled ? "border-b-2 border-border-ink bg-background" : "border-b-2 border-transparent bg-background"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex min-w-0 items-center gap-6">
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AmazeCC home">
            <img
              loading="eager"
              fetchPriority="high"
              src="/brand/icon-primary.svg"
              alt=""
              width="36"
              height="36"
              decoding="async"
              className="h-9 w-9 object-contain"
            />
            <span className="font-display text-lg font-bold leading-none">AmazeCC</span>
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
            {SECTIONS.map((section) => (
              <button key={section.id} type="button" onClick={() => scrollToSection(section.id)} className={navLink}>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/ffcs/"
            title="Open the FFCS planner without signing in"
            className={`hidden sm:inline-flex ${navLink}`}
          >
            FFCS planner
          </a>
          <button
            type="button"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press"
          >
            {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={onTryDemo}
            className="hidden min-h-10 items-center rounded-[10px] border-2 border-border-ink bg-surface px-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm brutal-press sm:inline-flex"
          >
            Try demo
          </button>
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex min-h-10 items-center rounded-[10px] border-2 border-border-ink bg-primary px-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-primary-foreground shadow-brutal-sm brutal-press"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Hero: words on the left, the real product on the right. */}
      <section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-secondary-foreground">
            Your campus companion // VIT Chennai
          </p>
          <h1 className="font-display text-[40px] font-bold uppercase leading-[1.02] sm:text-6xl lg:text-[68px]">
            Your VIT life,
            <span className="block text-hero">all in one place.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-text-muted sm:text-lg">
            Attendance with the 75% line drawn for you, marks, timetable, exams, OD hours, mess, buses and your FFCS
            plan. One app instead of five portals.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex min-h-12 items-center justify-center rounded-[10px] border-2 border-border-ink bg-highlight px-6 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-md brutal-press"
            >
              Try the demo
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-2 border-border-ink bg-surface px-6 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-md brutal-press"
            >
              Sign in with VTOP
              <ArrowRight size={16} aria-hidden />
            </button>
          </div>
          <p className="mt-4 font-mono text-xs text-text-muted" aria-live="polite">
            Free // made by students // your password is stored encrypted on this device
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-xl pb-8 pr-6 lg:max-w-none" aria-hidden="true">
          <div className="overflow-hidden rounded-[14px] border-[3px] border-border-ink bg-surface shadow-brutal-lg">
            <div className="flex items-center gap-1.5 border-b-2 border-border-ink bg-surface-secondary px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-border-ink bg-danger" />
              <span className="h-2.5 w-2.5 rounded-full border-2 border-border-ink bg-highlight" />
              <span className="h-2.5 w-2.5 rounded-full border-2 border-border-ink bg-secondary" />
              <span className="ml-2 font-mono text-xs text-text-muted">amazecc.com</span>
            </div>
            {/* Both themes rendered, CSS picks one: avoids a hydration mismatch
                  (the server does not know the theme). */}
            <img
              src="/landing/home-desktop-light.webp"
              alt=""
              width={1200}
              height={717}
              loading="eager"
              decoding="async"
              className="block h-auto w-full dark:hidden"
            />
            <img
              src="/landing/home-desktop-dark.webp"
              alt=""
              width={1200}
              height={717}
              loading="eager"
              decoding="async"
              className="hidden h-auto w-full dark:block"
            />
          </div>
          <div className="absolute -bottom-2 right-0 w-[34%] min-w-[120px] overflow-hidden rounded-[20px] border-[3px] border-border-ink bg-surface shadow-brutal-lg">
            {/* Both themes rendered, CSS picks one: avoids a hydration mismatch
                  (the server does not know the theme). */}
            <img
              src="/landing/home-phone-light.webp"
              alt=""
              width={390}
              height={800}
              loading="eager"
              decoding="async"
              className="block h-auto w-full dark:hidden"
            />
            <img
              src="/landing/home-phone-dark.webp"
              alt=""
              width={390}
              height={800}
              loading="eager"
              decoding="async"
              className="hidden h-auto w-full dark:block"
            />
          </div>
        </div>
      </section>

      <LandingSections />

      <footer className="brand-sidebar border-t-2 border-border-ink px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/icon-primary.svg" alt="" className="h-10 w-10" />
            <div className="leading-none">
              <span className="block font-display text-lg font-bold text-cream">AmazeCC</span>
              <span className="mt-1 block font-mono text-xs text-text-muted">Your campus companion</span>
            </div>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs font-semibold uppercase tracking-[0.06em]"
          >
            {[
              ["FFCS planner", "/ffcs/"],
              ["Privacy", "/privacy/"],
              ["Terms", "/terms/"],
              ["GitHub", "https://github.com/AmazeContinuityProjects/AmazeCC"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-cream underline-offset-4 hover:underline"
              >
                {label}
              </a>
            ))}
          </nav>
          <p className="font-mono text-xs text-text-muted">Made by students. Not affiliated with VIT or VTOP.</p>
        </div>
      </footer>
    </main>
  );
}
