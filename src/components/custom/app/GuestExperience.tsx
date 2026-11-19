"use client";

import BrandLogo from "../shared/BrandLogo";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, Heart, Moon, Sun } from "lucide-react";
import { CycleWord } from "../landing/LandingMotion";

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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setMenuOpen(false);
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
            <BrandLogo variant="mark" size="md" className="min-[431px]:hidden" />
            <BrandLogo size="md" className="max-[430px]:hidden" />
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
            <span key={isDark ? "sun" : "moon"} className="landing-pop">
              {isDark ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
            </span>
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
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex min-h-10 items-center rounded-[10px] border-2 border-border-ink bg-surface px-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm lg:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {/* Section menu below lg (the inline links are hidden there). */}
        {menuOpen ? (
          <nav
            id="landing-menu"
            aria-label="Sections"
            className="absolute inset-x-4 top-full z-50 mt-2 grid gap-1 rounded-[14px] border-[3px] border-border-ink bg-surface p-2 shadow-brutal-lg sm:inset-x-8 lg:hidden"
          >
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className="flex min-h-12 items-center rounded-[10px] px-3 text-left font-display text-base font-bold uppercase text-text-heading hover:bg-surface-secondary"
              >
                {section.label}
              </button>
            ))}
            <a
              href="/ffcs/"
              className="flex min-h-12 items-center rounded-[10px] px-3 font-display text-base font-bold uppercase text-text-heading hover:bg-surface-secondary"
            >
              FFCS planner
            </a>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onTryDemo();
              }}
              className="mt-1 inline-flex min-h-12 items-center justify-center rounded-[10px] border-2 border-border-ink bg-highlight font-mono text-sm font-bold uppercase tracking-[0.06em] text-highlight-foreground"
            >
              Try the demo
            </button>
          </nav>
        ) : null}
      </header>

      {/* Hero: words on the left, the real product (with live-looking stickers) on the right. */}
      <section
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty("--mx", String(((e.clientX - r.left) / r.width) * 2 - 1));
          e.currentTarget.style.setProperty("--my", String(((e.clientY - r.top) / r.height) * 2 - 1));
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty("--mx", "0");
          e.currentTarget.style.setProperty("--my", "0");
        }}
        className="relative z-10 flex-1 overflow-hidden border-b-[3px] border-border-ink"
      >
        {/* Campus art (the user's illustrations), day / night picked by CSS. A soft
            blur (user request) hides small artefacts in the art and keeps it
            behind the content; scaled slightly so the blurred edge never shows.
            Art is the one place the brand allows blur. Below lg the art keeps its
            own shape at the bottom of the hero (cover cropped it into a close-up
            on tall phone heroes). */}
        <img
          src="/landing/campus-day.webp"
          alt=""
          aria-hidden="true"
          width={1672}
          height={941}
          loading="eager"
          decoding="async"
          className="absolute inset-x-0 bottom-0 -z-20 h-auto w-full scale-105 blur-[10px] lg:inset-0 lg:h-full lg:object-cover lg:object-[50%_70%] dark:hidden"
        />
        <img
          src="/landing/campus-night.webp"
          alt=""
          aria-hidden="true"
          width={1671}
          height={941}
          loading="eager"
          decoding="async"
          className="absolute inset-x-0 bottom-0 -z-20 h-auto w-full scale-105 blur-[10px] lg:inset-0 lg:h-full lg:object-cover lg:object-[50%_70%] hidden dark:block"
        />
        {/* Backdrop: a flat wash of the page colour so the art sits behind, not on top. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-background/60 dark:bg-background/45" />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-14 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:pb-20">
          <div className="relative max-w-xl rounded-[20px] border-[3px] border-border-ink bg-surface p-5 shadow-brutal-lg sm:p-7">
            <div className="landing-pop mb-6">
              <BrandLogo size="md" tagline />
            </div>
            <h1 className="font-display text-[32px] font-bold uppercase leading-[1.05] sm:text-[44px] lg:text-[52px]">
              Your VIT life,
              <span className="block text-hero">all in one place.</span>
            </h1>
            <p className="mt-5 max-w-xl font-display text-lg font-bold leading-snug">
              Check your{" "}
              <CycleWord
                words={[
                  { text: "attendance", className: "bg-ochre text-obsidian" },
                  { text: "marks", className: "bg-sage text-obsidian" },
                  { text: "timetable", className: "bg-coral text-obsidian" },
                  { text: "FFCS plan", className: "bg-mint text-obsidian" },
                  { text: "mess menu", className: "bg-orange text-obsidian" },
                  { text: "OD hours", className: "bg-teal text-cream" },
                ]}
              />{" "}
              in one tap.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-muted sm:text-base">
              The 75% line drawn on every course, marks with class averages, today&apos;s rooms, exam seats, buses and
              your FFCS draft. One app instead of five portals.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onTryDemo}
                className="inline-flex min-h-12 items-center justify-center rounded-[10px] border-[3px] border-border-ink bg-highlight px-6 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-lg brutal-press"
              >
                Try the demo
              </button>
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-[3px] border-border-ink bg-surface px-6 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-lg brutal-press"
              >
                Sign in with VTOP
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
            <p className="mt-4 font-mono text-xs text-text-muted" aria-live="polite">
              Free // made by students // your password is stored encrypted on this device
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl pb-10 pr-8 pt-6 lg:max-w-none" aria-hidden="true">
            {/* Colour blocks behind the shots */}
            <div className="landing-parallax absolute -right-2 top-0 h-[70%] w-[70%] rotate-3 rounded-[20px] border-[3px] border-border-ink bg-ochre [--depth:14px]" />
            <div className="landing-parallax absolute -left-4 bottom-0 h-[45%] w-[45%] -rotate-6 rounded-[20px] border-[3px] border-border-ink bg-sage [--depth:-12px]" />

            <div className="landing-parallax relative -rotate-2 overflow-hidden rounded-[14px] border-[3px] border-border-ink bg-surface shadow-brutal-lg [--depth:8px]">
              <div className="flex items-center gap-1.5 border-b-2 border-border-ink bg-surface-secondary px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-border-ink bg-coral" />
                <span className="h-2.5 w-2.5 rounded-full border-2 border-border-ink bg-ochre" />
                <span className="h-2.5 w-2.5 rounded-full border-2 border-border-ink bg-mint" />
                <span className="ml-2 font-mono text-xs text-text-muted">amazecc.com</span>
              </div>
              {/* Both themes rendered, CSS picks one (the server does not know the theme). */}
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

            <div className="landing-parallax absolute -bottom-2 right-0 w-[34%] min-w-[120px] [--depth:-16px]">
              <div className="landing-float-b overflow-hidden rounded-[20px] border-[3px] border-border-ink bg-surface shadow-brutal-lg [--tilt:4deg]">
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

            {/* Stickers */}
            {[
              {
                t: "79% // safe",
                c: "bg-ochre",
                pos: "-left-3 top-2 sm:-left-8",
                anim: "landing-float-a [--tilt:-6deg]",
              },
              { t: "Can skip 2", c: "bg-mint", pos: "left-[38%] -top-3", anim: "landing-float-b [--tilt:3deg]" },
              {
                t: "FAT // 20 Nov",
                c: "bg-coral",
                pos: "-left-2 bottom-[30%] sm:-left-10",
                anim: "landing-float-b [--tilt:-4deg]",
              },
              { t: "39 OD hrs", c: "bg-sage", pos: "right-[30%] bottom-0", anim: "landing-float-a [--tilt:5deg]" },
              {
                t: "Next: DBMS 2:00",
                c: "bg-orange",
                pos: "-right-2 top-[38%] hidden sm:block",
                anim: "landing-float-a [--tilt:-3deg]",
              },
            ].map((st, i) => (
              <span
                key={st.t}
                style={{ animationDelay: `${i * 0.6}s` }}
                className={`absolute ${st.pos} ${st.anim} z-10 whitespace-nowrap rounded-[8px] border-[3px] border-border-ink ${st.c} px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-obsidian shadow-brutal-sm`}
              >
                {st.t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LandingSections />

      {/* Closing call to action */}
      <section className="relative overflow-hidden border-t-[3px] border-border-ink bg-ochre px-4 py-20 text-obsidian sm:px-8 sm:py-28">
        <img
          src="/brand/glyph.svg"
          alt=""
          aria-hidden="true"
          className="landing-float-a pointer-events-none absolute -right-16 -top-10 w-[420px] max-w-none opacity-90 [--tilt:-8deg] sm:-right-6"
        />
        <div className="relative mx-auto max-w-7xl">
          <h2 className="max-w-3xl font-display text-[32px] font-bold uppercase leading-[1.05] sm:text-[48px]">
            Stop opening five portals.
          </h2>
          <p className="mt-4 max-w-xl text-lg">See your real attendance, marks and timetable in under a minute.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[10px] border-[3px] border-obsidian bg-teal px-7 font-mono text-sm font-bold uppercase tracking-[0.06em] text-cream shadow-brutal-lg brutal-press"
            >
              Sign in with VTOP
              <ArrowRight size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex min-h-14 items-center justify-center rounded-[10px] border-[3px] border-obsidian bg-cream px-7 font-mono text-sm font-bold uppercase tracking-[0.06em] text-obsidian shadow-brutal-lg brutal-press"
            >
              Try the demo
            </button>
          </div>
        </div>
      </section>

      <footer className="brand-sidebar border-t-2 border-border-ink px-4 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <BrandLogo size="lg" tagline wordClassName="text-cream" />
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
          <div className="space-y-1 font-mono text-xs">
            <p className="flex items-center gap-1.5 font-semibold uppercase tracking-[0.06em] text-cream">
              Made with
              <Heart size={14} className="fill-coral text-coral" aria-label="love" />
              by students at VIT Chennai
            </p>
            <p className="text-text-muted">Not affiliated with VIT or VTOP.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
