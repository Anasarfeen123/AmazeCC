"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  CalendarCheck,
  CalendarRange,
  ChevronDown,
  Clock,
  GraduationCap,
  LayoutGrid,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import {
  AnnouncementRibbon,
  HueRibbon,
  LivePhone,
  MarqueeRibbons,
  Reveal,
  SkipSimulator,
  WeekGridDemo,
} from "../landing/LandingLive";
import { cn } from "@/lib/utils";

/**
 * The guest landing page, Calm Notebook edition.
 *
 * One promise, two actions, and a working preview of the real home screen,
 * then the features a VIT student actually uses, how sign-in works, and the
 * FAQ. Everything is drawn from AmazeUI tokens, so light and dark (true black)
 * come for free. No glows, gradients, counters or decorative mock-ups.
 */

interface GuestExperienceProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

const NAV = [
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Attendance that tells you what to do",
    body: "Every course shows the 75% line and how many classes you can skip, or how many you must attend to get back over it.",
  },
  {
    icon: Clock,
    title: "Today, at a glance",
    body: "The class you are in, the next one, its slot and the time left, with free gaps and empty rooms in between.",
  },
  {
    icon: GraduationCap,
    title: "Marks and targets",
    body: "CAT, DA and FAT marks per course, your CGPA, and the FAT score you need to reach the grade you want.",
  },
  {
    icon: CalendarRange,
    title: "FFCS planner",
    body: "Build next semester's timetable, catch slot clashes before registration and share the plan as a link.",
    link: { href: "/ffcs/", label: "Open the planner, no sign-in needed" },
  },
  {
    icon: LayoutGrid,
    title: "Campus in one place",
    body: "Mess menu, laundry, buses, libraries, events, free classrooms and faculty cabins, without five portals.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Your VTOP credentials stay in this browser. Synced data is kept on your device, so it still opens offline.",
  },
];

const STEPS = [
  { title: "Sign in with VTOP", body: "Use the same registration number and password you use for VTOP." },
  { title: "AmazeCC syncs", body: "Your timetable, attendance, marks and campus details come across in one pass." },
  { title: "Check it between classes", body: "Open it on your phone or laptop. It syncs again in the background." },
];

const FAQ = [
  {
    q: "Is this official?",
    a: "No. AmazeCC is an independent project built by VIT students. It reads your data from the official portals and shows it in one place.",
  },
  {
    q: "Is it free?",
    a: "Yes. It is free, with no adverts and no subscription.",
  },
  {
    q: "Does it store my password?",
    a: "No server ever sees it. Sign-in happens in your browser, and your session is kept in this browser's local storage.",
  },
  {
    q: "Can alumni use it?",
    a: "Yes, as long as your VTOP account is still active you can sync your history and browse the catalogues.",
  },
];

export default function GuestExperience({ onGetStarted, onTryDemo }: GuestExperienceProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = mounted && resolvedTheme === "dark";
  const [isScrolled, setIsScrolled] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const primary =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm bg-accent px-5 text-[15px] font-medium text-background transition-colors duration-[120ms] hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const secondary =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-line bg-surface px-5 text-[15px] font-medium text-ink transition-colors duration-[120ms] hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <main className="min-h-screen overflow-x-clip bg-background text-ink selection:bg-accent/25">
      <AnnouncementRibbon />
      {/* ── Header ── */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-background/95 transition-colors duration-[120ms]",
          isScrolled ? "border-line" : "border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2.5" aria-label="AmazeCC home">
            <img src="/logo.png" alt="" className="h-7 w-7 rounded-sm object-contain" />
            <span className="text-[16px] font-semibold tracking-tight">AmazeCC</span>
          </a>
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n.id)}
                className="rounded-sm px-3 py-2 text-[14px] text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
              >
                {n.label}
              </button>
            ))}
            <a
              href="/ffcs/"
              className="rounded-sm px-3 py-2 text-[14px] text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
            >
              FFCS planner
            </a>
          </nav>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={mounted && isDark ? "Switch to light theme" : "Switch to dark theme"}
              title="Toggle theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2"
            >
              {mounted && isDark ? (
                <Sun className="h-[18px] w-[18px]" strokeWidth={1.8} />
              ) : (
                <Moon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              )}
            </button>
            <button
              type="button"
              onClick={onTryDemo}
              className="hidden min-h-10 rounded-sm px-3 text-[14px] font-medium text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink sm:inline-flex sm:items-center"
            >
              Try demo
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex min-h-10 items-center rounded-sm bg-accent px-4 text-[14px] font-medium text-background transition-colors duration-[120ms] hover:bg-accent/90"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-20">
        <div className="text-left">
          <button
            type="button"
            onClick={onTryDemo}
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-[13px] text-ink-2 transition-colors duration-[120ms] hover:bg-surface-2"
          >
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent">New</span>
            Your whole week as one grid
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-[120ms] group-hover:translate-x-0.5" />
          </button>
          <p className="mt-5 text-[13.5px] text-muted">For VIT students · free and unofficial</p>
          <h1 className="mt-3 text-[42px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[60px] lg:text-[68px]">
            <span className="block">Your VIT life,</span>
            <span className="block text-accent">on one calm page.</span>
          </h1>
          <p className="mt-5 max-w-[34rem] text-[17px] leading-relaxed text-ink-2">
            Attendance with skip budgets, today&apos;s classes, marks and targets, campus services and your FFCS plan.
            Synced from VTOP and kept on your device.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={onGetStarted} className={primary}>
              Get Started
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={onTryDemo} className={secondary}>
              Try the demo
            </button>
          </div>
          <p className="mt-4 text-[13px] text-muted">
            Sign in with your VTOP credentials. They never leave this browser.
          </p>
        </div>
        <Reveal delay={120}>
          <LivePhone />
        </Reveal>
      </section>

      {/* ── Ribbons ── */}
      <HueRibbon />
      <section aria-label="Highlights" className="border-b border-line bg-surface-2/40">
        <MarqueeRibbons />
      </section>

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
          <div className="max-w-2xl">
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">Everything a VIT day needs</h2>
            <p className="mt-3 text-[16px] text-ink-2">
              The parts of VTOP, Moodle and the campus portals you check every day, in one quiet place.
            </p>
          </div>
          <Reveal>
            <div className="mt-10 grid overflow-hidden rounded-md border border-line bg-line sm:grid-cols-2 lg:grid-cols-3 [&>*]:bg-surface gap-px">
              {FEATURES.map(({ icon: Icon, title, body, link }) => (
                <div key={title} className="flex flex-col gap-2.5 p-6">
                  <Icon aria-hidden="true" className="h-5 w-5 text-ink-2" strokeWidth={1.7} />
                  <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
                  <p className="text-[14.5px] leading-relaxed text-ink-2">{body}</p>
                  {link && (
                    <a href={link.href} className="mt-auto pt-1 text-[14px] text-accent hover:underline">
                      {link.label}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Week grid ── */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">Your whole week, in one look</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
              Every class is a block in its course&apos;s colour, labs take two periods, and the class you are in right
              now is outlined. Free periods are the gaps, so you can see where the afternoon opens up before you plan
              it.
            </p>
            <ul className="mt-6 space-y-2 text-[14.5px] text-ink-2">
              <li>Tap a day to open its timeline, with rooms, slots and free gaps.</li>
              <li>Weekends only show up when something is actually on.</li>
            </ul>
          </div>
          <Reveal>
            <div className="rounded-md border border-line bg-surface p-4 sm:p-5">
              <div className="flex items-baseline justify-between pb-3">
                <span className="text-[13.5px] font-semibold text-ink">10–14 Nov</span>
                <span className="font-mono text-[12px] text-muted">26 classes · 22 cr</span>
              </div>
              <WeekGridDemo />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Skip budget spotlight ── */}
      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-24">
          <div>
            <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">
              Skip budgets, not just percentages
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">
              &ldquo;74%&rdquo; tells you there is a problem. &ldquo;Attend the next 1&rdquo; tells you what to do about
              it. Every course is checked against VIT&apos;s 75% minimum, and labs are counted in lab sessions, not
              periods.
            </p>
            <ul className="mt-6 space-y-2 text-[14.5px] text-ink-2">
              <li className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-danger" /> Red when a course is below the
                line
              </li>
              <li className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warn" /> Amber when you are on it, with
                no skips left
              </li>
              <li className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ok" /> Your course&apos;s own colour when
                you are safe
              </li>
            </ul>
          </div>
          <Reveal>
            <SkipSimulator />
            <p className="mt-2 text-[12.5px] text-muted">Sample data. Try missing a few classes.</p>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 md:py-24">
          <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">How it works</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-line pt-5">
                <span className="font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 text-[17px] font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface p-5">
            <p className="mr-auto text-[15px] text-ink-2">Want to look around first? The demo uses sample data.</p>
            <button type="button" onClick={onTryDemo} className={secondary}>
              Try demo
            </button>
            <button type="button" onClick={onGetStarted} className={primary}>
              Sign in with VTOP
            </button>
          </div>
        </div>
      </section>

      {/* ── Closing band ── */}
      <section className="relative overflow-hidden border-t border-line bg-accent text-background">
        <HueRibbon className="absolute inset-x-0 top-0" />
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between md:py-20">
          <div>
            <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] sm:text-[44px]">
              Your semester, sorted.
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14.5px] opacity-85">
              <li>Free, no adverts</li>
              <li>Works offline</li>
              <li>Credentials stay on your device</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-background px-6 text-[15.5px] font-medium text-ink transition-opacity duration-[120ms] hover:opacity-90"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onTryDemo}
              className="inline-flex min-h-12 items-center rounded-sm border border-background/40 px-6 text-[15.5px] font-medium text-background transition-colors duration-[120ms] hover:bg-background/10"
            >
              Try demo
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
          <h2 className="text-[28px] font-semibold tracking-tight sm:text-[34px]">Questions</h2>
          <ul className="mt-8 divide-y divide-line-2 overflow-hidden rounded-md border border-line bg-surface">
            {FAQ.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-12 w-full items-center justify-between gap-4 px-5 py-3.5 text-left text-[15.5px] font-medium text-ink transition-colors duration-[120ms] hover:bg-surface-2"
                  >
                    {f.q}
                    <ChevronDown
                      aria-hidden="true"
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted transition-transform duration-[120ms]",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen && <p className="px-5 pb-4 text-[14.5px] leading-relaxed text-ink-2">{f.a}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── Footer ── */}
      <HueRibbon />
      <footer>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-[13.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Made by students. Not affiliated with VIT or VTOP.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="/ffcs/" className="hover:text-ink">
              FFCS planner
            </a>
            <a href="/privacy/" className="hover:text-ink">
              Privacy
            </a>
            <a href="/terms/" className="hover:text-ink">
              Terms
            </a>
            <a href="https://github.com/AmazeContinuityProjects/AmazeCC" className="hover:text-ink">
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
