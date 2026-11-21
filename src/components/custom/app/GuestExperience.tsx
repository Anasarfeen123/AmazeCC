"use client";

import { getAssetPath } from "@/lib/utils";

import BrandLogo from "../shared/BrandLogo";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowRight, ChevronRight, Heart, Menu as MenuIcon, Moon, MoonStar, Sun, X } from "lucide-react";
import { nextTheme } from "@/lib/shortcuts";
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
  const { theme, resolvedTheme, setTheme } = useTheme();
  // Theme is only known in the browser; until mount, render the dark variant
  // the server rendered so hydration matches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // The header switch cycles light -> dark -> night, like the app.
  const currentTheme = !mounted ? "dark" : theme === "night" ? "night" : resolvedTheme === "light" ? "light" : "dark";
  const targetTheme = nextTheme(currentTheme);
  const targetLabel = targetTheme === "night" ? "Night" : targetTheme === "dark" ? "Dark" : "Light";
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const scrollToSection = (sectionId: string) => {
    setMenuOpen(false);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const navLink =
    "rounded-[8px] px-2 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-heading";

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-clip bg-background text-text-heading selection:bg-secondary">
      <header
        className={`sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 px-4 transition-colors duration-200 sm:px-8 ${
          isScrolled ? "border-b-2 border-border-ink bg-background" : "border-b-2 border-transparent bg-background"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="flex min-w-0 items-center gap-6">
          <a href={getAssetPath("/")} className="flex shrink-0 items-center gap-2.5" aria-label="AmazeCC home">
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
            href={getAssetPath("/ffcs/")}
            title="Open the FFCS planner without signing in"
            className={`hidden sm:inline-flex ${navLink}`}
          >
            FFCS planner
          </a>
          <button
            type="button"
            aria-label={`Switch to ${targetLabel.toLowerCase()} mode`}
            title={`${targetLabel} mode`}
            onClick={() => setTheme(targetTheme)}
            className="hidden h-10 w-10 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press sm:inline-flex"
          >
            <span key={targetTheme} className="landing-pop">
              {targetTheme === "night" ? (
                <MoonStar size={16} aria-hidden />
              ) : targetTheme === "dark" ? (
                <Moon size={16} aria-hidden />
              ) : (
                <Sun size={16} aria-hidden />
              )}
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
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border-2 border-border-ink bg-highlight px-3.5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-sm brutal-press"
          >
            Sign in
            <ArrowRight size={14} aria-hidden />
          </button>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface text-text-primary shadow-brutal-sm brutal-press lg:hidden"
          >
            {menuOpen ? <X size={18} aria-hidden /> : <MenuIcon size={18} aria-hidden />}
          </button>
        </div>

        {/* Section menu below lg (the inline links are hidden there). */}
        {menuOpen ? (
          <>
            {/* Tap outside closes. */}
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-16 -z-10 cursor-default bg-[color-mix(in_oklab,var(--shadow-ink)_45%,transparent)] lg:hidden"
            />
            <nav
              id="landing-menu"
              aria-label="Sections"
              className="landing-menu-in absolute inset-x-3 top-full z-50 mt-2 max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-[16px] border-[3px] border-border-ink bg-surface p-3 shadow-brutal-lg sm:inset-x-8 lg:hidden"
            >
              <p className="px-2 pb-1 font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                Jump to
              </p>
              <ul className="divide-y-2 divide-border-muted">
                {SECTIONS.map((section, i) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className="flex min-h-12 w-full items-center gap-3 rounded-[10px] px-2 text-left hover:bg-surface-secondary"
                    >
                      <span className="font-mono text-xs font-bold text-text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-display text-lg font-bold uppercase text-text-heading">
                        {section.label}
                      </span>
                      <ChevronRight size={18} className="text-text-muted" aria-hidden />
                    </button>
                  </li>
                ))}
                <li>
                  <a
                    href={getAssetPath("/ffcs/")}
                    className="flex min-h-12 items-center gap-3 rounded-[10px] px-2 hover:bg-surface-secondary"
                  >
                    <span className="font-mono text-xs font-bold text-text-muted">06</span>
                    <span className="flex-1 font-display text-lg font-bold uppercase text-text-heading">
                      FFCS planner
                    </span>
                    <span className="rounded-[6px] border-2 border-border-ink bg-mint px-1.5 font-mono text-xs font-bold uppercase text-obsidian">
                      No sign-in
                    </span>
                  </a>
                </li>
              </ul>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-[12px] border-2 border-border-muted px-3 py-2">
                <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-muted">Theme</span>
                <div
                  role="group"
                  aria-label="Theme"
                  className="flex gap-0.5 rounded-[10px] border-2 border-border-ink bg-background p-0.5"
                >
                  {(["light", "dark", "night"] as const).map((t) => {
                    const Icon = t === "light" ? Sun : t === "dark" ? Moon : MoonStar;
                    const on = currentTheme === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        aria-pressed={on}
                        aria-label={`${t[0].toUpperCase()}${t.slice(1)} theme`}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-[7px] border-2 ${
                          on
                            ? "border-border-ink bg-secondary text-secondary-foreground"
                            : "border-transparent text-text-muted"
                        }`}
                      >
                        <Icon size={16} aria-hidden />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onGetStarted();
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[10px] border-[3px] border-border-ink bg-highlight font-mono text-sm font-bold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-sm brutal-press"
                >
                  Sign in with VTOP
                  <ArrowRight size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onTryDemo();
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-primary"
                >
                  Try the demo
                </button>
              </div>
            </nav>
          </>
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
          src={getAssetPath("/landing/campus-day.webp")}
          alt=""
          aria-hidden="true"
          width={1672}
          height={941}
          loading="eager"
          decoding="async"
          className="absolute inset-x-0 bottom-0 -z-20 h-auto w-full scale-105 blur-[10px] max-md:hidden lg:inset-0 lg:h-full lg:object-cover lg:object-[50%_70%] dark:hidden"
        />
        <img
          src={getAssetPath("/landing/campus-night.webp")}
          alt=""
          aria-hidden="true"
          width={1671}
          height={941}
          loading="eager"
          decoding="async"
          className="absolute inset-x-0 bottom-0 -z-20 hidden h-auto w-full scale-105 blur-[10px] md:dark:block lg:inset-0 lg:h-full lg:object-cover lg:object-[50%_70%]"
        />
        {/* Backdrop: a flat wash of the page colour so the art sits behind, not on top. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 hidden bg-background/60 md:block dark:bg-background/45"
        />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-6 sm:gap-12 sm:px-8 sm:pt-12 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:pb-20">
          {/* On phones the words sit on the page (a card inside the page, with a
              second logo under the header one, read as a box in a box). */}
          <div className="relative max-w-xl sm:rounded-[20px] sm:border-[3px] sm:border-border-ink sm:bg-surface sm:p-7 sm:shadow-brutal-lg">
            {/* hidden on a wrapper: .landing-pop sets display and would win. */}
            <div className="mb-6 hidden sm:block">
              <div className="landing-pop">
                <BrandLogo size="md" tagline />
              </div>
            </div>
            <h1 className="font-display text-[34px] font-bold uppercase leading-[1.02] sm:text-[44px] lg:text-[52px]">
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

            {/* Sign in leads (user: it should be more focused than the demo). */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onGetStarted}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[10px] border-[3px] border-border-ink bg-highlight px-7 font-mono text-sm font-bold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-lg brutal-press"
              >
                Sign in with VTOP
                <ArrowRight size={18} aria-hidden />
              </button>
              <button
                type="button"
                onClick={onTryDemo}
                className="inline-flex min-h-11 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface px-5 font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-primary shadow-brutal-sm brutal-press"
              >
                Or try the demo first
              </button>
            </div>
            <p className="mt-4 font-mono text-xs text-text-muted" aria-live="polite">
              Free // made by students // your password is stored encrypted on this device
            </p>
          </div>

          {/* Phones and small tablets: one phone screenshot, big enough to
              read, on an ochre block with three stickers (user: the shrunken
              desktop window + phone + five stickers "looks bad" on mobile). */}
          <div className="relative mx-auto w-full max-w-[330px] px-6 pb-6 pt-4 md:hidden" aria-hidden="true">
            {/* The campus art, sharp and framed (blurred behind the whole
                hero it was only a smudge under the phone). */}
            <div className="absolute inset-x-0 bottom-2 top-10 rotate-[3deg] overflow-hidden rounded-[24px] border-[3px] border-border-ink bg-ochre shadow-brutal-md">
              <img
                src={getAssetPath("/landing/campus-day.webp")}
                alt=""
                width={1672}
                height={941}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover object-[28%_60%] dark:hidden"
              />
              <img
                src={getAssetPath("/landing/campus-night.webp")}
                alt=""
                width={1671}
                height={941}
                loading="eager"
                decoding="async"
                className="hidden h-full w-full object-cover object-[28%_60%] dark:block"
              />
            </div>
            <div className="landing-float-b relative mx-auto w-[72%] overflow-hidden rounded-[26px] border-[3px] border-border-ink bg-surface shadow-brutal-lg [--tilt:-3deg]">
              <img
                src={getAssetPath("/landing/home-phone-light.webp")}
                alt=""
                width={390}
                height={800}
                loading="eager"
                decoding="async"
                className="block h-auto w-full dark:hidden"
              />
              <img
                src={getAssetPath("/landing/home-phone-dark.webp")}
                alt=""
                width={390}
                height={800}
                loading="eager"
                decoding="async"
                className="hidden h-auto w-full dark:block"
              />
            </div>
            {[
              { t: "79% // safe", c: "bg-mint", pos: "left-0 top-[40%]", anim: "landing-float-a [--tilt:-6deg]" },
              { t: "Can skip 2", c: "bg-sage", pos: "right-0 top-[62%]", anim: "landing-float-b [--tilt:5deg]" },
              { t: "FAT // 20 Nov", c: "bg-coral", pos: "left-1 bottom-[12%]", anim: "landing-float-a [--tilt:-3deg]" },
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

          <div
            className="relative mx-auto hidden w-full max-w-xl pb-10 pr-8 pt-6 md:block lg:max-w-none"
            aria-hidden="true"
          >
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
                src={getAssetPath("/landing/home-desktop-light.webp")}
                alt=""
                width={1200}
                height={717}
                loading="eager"
                decoding="async"
                className="block h-auto w-full dark:hidden"
              />
              <img
                src={getAssetPath("/landing/home-desktop-dark.webp")}
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
                  src={getAssetPath("/landing/home-phone-light.webp")}
                  alt=""
                  width={390}
                  height={800}
                  loading="eager"
                  decoding="async"
                  className="block h-auto w-full dark:hidden"
                />
                <img
                  src={getAssetPath("/landing/home-phone-dark.webp")}
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
          src={getAssetPath("/brand/glyph.svg")}
          alt=""
          aria-hidden="true"
          className="landing-float-a pointer-events-none absolute -bottom-20 -right-24 w-[260px] max-w-none opacity-25 [--tilt:-8deg] md:-right-6 md:-top-10 md:bottom-auto md:w-[300px] md:opacity-90 lg:w-[420px]"
        />
        {/* The text keeps clear of the glyph (owner: the headline ran under it
            at ~1000px): room reserved from md, where the glyph moves up. */}
        <div className="relative mx-auto max-w-7xl md:pr-[280px] lg:pr-[400px]">
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
