"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CourseDot, SlotBadge, attendanceAfter, attendanceBudget } from "@amazecontinuityprojects/amazeui";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────── shared helpers ─────────────────────────── */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

/** True once the element has scrolled into view (always true where IntersectionObserver is missing). */
function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, seen };
}

/** Fades a block up into place the first time it is scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, seen } = useInView<HTMLDivElement>(0.12);
  const reduced = usePrefersReducedMotion();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        seen || reduced ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
      style={{ transitionDelay: seen ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────── sample data ─────────────────────────── */

const COURSES = [
  { code: "BCSE202L", name: "Data Structures and Algorithms", slot: "A1+TA1" },
  { code: "BSTS202P", name: "Qualitative Skills Practice", slot: "F1" },
  { code: "BEEE102L", name: "Basic Electrical Engineering", slot: "D1+TD1" },
  { code: "BMAT201L", name: "Complex Variables and LA", slot: "B1+TB1" },
  { code: "BPHY101L", name: "Engineering Physics", slot: "C1+TC1" },
  { code: "BCSE202P", name: "DSA Lab", slot: "L31+L32" },
];
const COLOR: Record<string, string> = {
  BCSE202L: "var(--course-1)",
  BSTS202P: "var(--course-5)",
  BEEE102L: "var(--course-3)",
  BMAT201L: "var(--course-2)",
  BPHY101L: "var(--course-4)",
  BCSE202P: "var(--course-1)",
};
/** Mon–Fri × 7 periods; each cell names a course code or is free. */
const WEEK: (string | null)[][] = [
  ["BCSE202L", "BSTS202P", "BEEE102L", "BMAT201L", null, "BCSE202P", "BCSE202P"],
  ["BMAT201L", "BPHY101L", null, "BCSE202L", "BEEE102L", null, null],
  ["BPHY101L", "BCSE202L", "BMAT201L", null, "BSTS202P", null, null],
  ["BEEE102L", null, "BPHY101L", "BCSE202L", "BMAT201L", null, null],
  ["BSTS202P", "BEEE102L", "BCSE202L", "BPHY101L", null, "BCSE202P", "BCSE202P"],
];
const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const HOURS = ["08", "09", "10", "11", "12", "14", "15"];

/* ─────────────────────────── week grid ─────────────────────────── */

/** The canvas week grid. Cells fill day by day once visible; the live class is outlined. */
export function WeekGridDemo({ compact = false, live = [0, 0] }: { compact?: boolean; live?: [number, number] }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.3);
  const reduced = usePrefersReducedMotion();
  const show = seen || reduced;
  return (
    <div ref={ref} className="w-full">
      <div
        className={cn("grid items-center", compact ? "gap-[3px]" : "gap-1.5")}
        style={{ gridTemplateColumns: `${compact ? "1.6rem" : "2.5rem"} repeat(${HOURS.length}, minmax(0, 1fr))` }}
      >
        {WEEK.map((row, d) => [
          <span key={`d${d}`} className={cn("font-mono text-muted", compact ? "text-[9.5px]" : "text-[12px]")}>
            {DAY[d]}
          </span>,
          ...row.map((code, h) => {
            const isLive = d === live[0] && h === live[1];
            return (
              <span
                key={`${d}-${h}`}
                title={code ? `${DAY[d]} ${HOURS[h]}:00 · ${COURSES.find((c) => c.code === code)?.name}` : undefined}
                className={cn(
                  "rounded-[4px] transition-[opacity,transform] duration-500 ease-out",
                  compact ? "h-[18px]" : "h-8 sm:h-9",
                  !code && "bg-surface-2",
                  show ? "scale-100 opacity-100" : "scale-90 opacity-0",
                  isLive && "ring-2 ring-ink ring-offset-1 ring-offset-surface",
                  isLive && !reduced && "animate-pulse",
                )}
                style={{
                  background: code ? COLOR[code] : undefined,
                  transitionDelay: show ? `${d * 90 + h * 35}ms` : "0ms",
                }}
              />
            );
          }),
        ])}
        <span />
        {HOURS.map((h) => (
          <span key={h} className={cn("pt-1 font-mono text-muted", compact ? "text-[9px]" : "text-[11px]")}>
            {h}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── live phone ─────────────────────────── */

const SCREENS = ["Home", "Week", "Attendance"] as const;

function PhoneHome({ tick }: { tick: number }) {
  // A 50-minute class whose remaining time counts down while you watch.
  const left = 9 - (tick % 9);
  const progress = 82 + ((tick % 9) / 9) * 18;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[19px] font-semibold tracking-tight text-ink">Good morning, Arjun</p>
          <p className="text-[12.5px] text-muted">Monday, 10 November · Week 13 of 18</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold text-ink-2">
          AR
        </span>
      </div>
      <div className="relative overflow-hidden rounded-md border border-line bg-surface">
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "var(--course-1)" }} />
        <div className="space-y-2 px-3.5 py-3">
          <div className="flex justify-between text-[11.5px] text-muted">
            <span>Now · ends 08:50</span>
            <span className="font-mono tabular-nums">{left} min left</span>
          </div>
          <p className="text-[15px] font-semibold leading-snug text-ink">Data Structures and Algorithms</p>
          <p className="font-mono text-[11.5px] text-ink-2">AB1-404 · A1 · Dr. R. Kavitha</p>
          <div className="h-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%`, background: "var(--course-1)" }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line-2 px-3.5 py-2 text-[12.5px]">
          <span className="text-ink">
            <span className="text-muted">Next </span>
            <span className="font-mono">08:55</span> Qualitative Skills
          </span>
          <SlotBadge course={5}>F1</SlotBadge>
        </div>
      </div>
      <div>
        <div className="flex items-baseline justify-between pb-1.5">
          <span className="text-[12.5px] font-semibold text-ink">Attendance</span>
          <span className="text-[12px] text-accent">All 6 courses</span>
        </div>
        <ul className="divide-y divide-line-2 overflow-hidden rounded-md border border-line bg-surface">
          {[
            { c: COURSES[4], pct: 74, note: "attend next 1", tone: "short" },
            { c: COURSES[3], pct: 76, note: "no skips left", tone: "edge" },
            { c: COURSES[0], pct: 88, note: "can skip 6", tone: "safe" },
          ].map((r) => (
            <li key={r.c.code} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5">
              <CourseDot course={r.c.code} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] text-ink">{r.c.name}</span>
                <span className="block font-mono text-[11.5px] text-muted">{r.c.slot}</span>
              </span>
              <span className="text-right">
                <span
                  className={cn(
                    "block font-mono text-[13.5px] font-semibold",
                    r.tone === "short" ? "text-danger" : "text-ink",
                  )}
                >
                  {r.pct}%
                </span>
                <span
                  className={cn(
                    "block text-[11.5px]",
                    r.tone === "short" ? "text-danger" : r.tone === "edge" ? "text-warn" : "text-muted",
                  )}
                >
                  {r.note}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PhoneWeek() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[19px] font-semibold tracking-tight text-ink">This week</p>
        <p className="text-[12.5px] text-muted">10–14 Nov · 26 classes · 22 cr</p>
      </div>
      <div className="rounded-md border border-line bg-surface p-3">
        <WeekGridDemo compact />
      </div>
      <ul className="divide-y divide-line-2 overflow-hidden rounded-md border border-line bg-surface">
        {[
          { t: "08:00", c: COURSES[0], tag: "Now" },
          { t: "08:55", c: COURSES[1], tag: "Next" },
          { t: "09:50", c: COURSES[2], tag: "" },
          { t: "14:00", c: COURSES[5], tag: "" },
        ].map((r) => (
          <li key={r.t} className="flex items-center gap-3 px-3.5 py-2.5">
            <span className="w-10 font-mono text-[11.5px] text-muted">{r.t}</span>
            <span className="h-6 w-[3px] rounded-full" style={{ background: COLOR[r.c.code] }} />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{r.c.name}</span>
            {r.tag && (
              <span className={cn("text-[11px] font-medium", r.tag === "Now" ? "text-accent" : "text-muted")}>
                {r.tag}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneAttendance() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <SlotBadge course={COURSES[4].code}>C1+TC1</SlotBadge>
          <span className="font-mono text-[11.5px] text-muted">BPHY101L</span>
        </div>
        <p className="mt-1.5 text-[19px] font-semibold tracking-tight text-ink">Engineering Physics</p>
      </div>
      <div className="rounded-md border border-line bg-surface p-3.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[32px] font-semibold leading-none tracking-tight text-danger">74.3%</p>
            <p className="mt-1.5 text-[12px] text-muted">26 of 35 classes attended</p>
          </div>
          <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">Below 75%</span>
        </div>
        <div className="relative mt-3 h-1.5 rounded-full bg-surface-2">
          <div className="h-full w-[74%] rounded-full bg-danger" />
          <span className="absolute -top-1 left-[75%] h-3.5 w-[2px] bg-ink" />
        </div>
        <p className="mt-3 border-t border-line-2 pt-2.5 text-[12.5px] leading-relaxed text-ink">
          Attend the next class to get back to 75%. It is <b>Tue 11 Nov, 08:55</b> in AB1-306.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Miss next 1", "72.2%", "text-danger"],
          ["Attend next 1", "75.0%", "text-ink"],
          ["Attend next 3", "76.3%", "text-ok"],
        ].map(([l, v, c]) => (
          <div key={l} className="rounded-md border border-line bg-surface px-2.5 py-2">
            <p className="text-[10.5px] text-muted">{l}</p>
            <p className={cn("font-mono text-[14px] font-semibold", c)}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A working phone in the hero: it moves through Home, Week and Attendance on its own. */
export function LivePhone() {
  const reduced = usePrefersReducedMotion();
  const [screen, setScreen] = useState(0);
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [reduced]);

  useEffect(() => {
    if (reduced || paused) return;
    const t = window.setInterval(() => setScreen((s) => (s + 1) % SCREENS.length), 5200);
    return () => window.clearInterval(t);
  }, [reduced, paused]);

  return (
    <div
      className="mx-auto w-full max-w-[360px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        role="img"
        aria-label={`Preview of the AmazeCC ${SCREENS[screen]} screen with sample data`}
        className="rounded-[40px] border border-line bg-surface-2 p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
      >
        <div className="relative h-[560px] overflow-hidden rounded-[32px] border border-line bg-background">
          {SCREENS.map((name, i) => (
            <div
              key={name}
              aria-hidden={i !== screen}
              className={cn(
                "absolute inset-x-0 top-0 px-4 pt-6 text-left transition-[opacity,transform] duration-500 ease-out",
                i === screen
                  ? "translate-x-0 opacity-100"
                  : i < screen
                    ? "-translate-x-4 opacity-0"
                    : "translate-x-4 opacity-0",
              )}
            >
              {name === "Home" ? <PhoneHome tick={tick} /> : name === "Week" ? <PhoneWeek /> : <PhoneAttendance />}
            </div>
          ))}
          <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-line bg-surface px-2 pb-3 pt-2 text-[10.5px] text-muted">
            {["Home", "Academics", "Calendar", "Apps"].map((t) => {
              const active =
                (t === "Home" && SCREENS[screen] !== "Week") || (t === "Calendar" && SCREENS[screen] === "Week");
              return (
                <span key={t} className={cn("transition-colors duration-300", active && "font-semibold text-accent")}>
                  {t}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Preview screens">
        {SCREENS.map((name, i) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={i === screen}
            onClick={() => setScreen(i)}
            className={cn(
              "rounded-full px-3 py-1 text-[12.5px] transition-colors duration-[120ms]",
              i === screen ? "bg-ink text-background" : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── skip simulator ─────────────────────────── */

/** Try the skip budget: miss or attend classes and watch the advice change. */
export function SkipSimulator() {
  const START = { attended: 26, held: 35 };
  const [s, setS] = useState(START);
  const b = useMemo(() => attendanceBudget(s.attended, s.held, 0.75), [s]);
  const pct = b.percent ?? 0;
  const status = b.status === "short" ? "short" : b.canSkip > 0 ? "safe" : "edge";
  const sentence =
    status === "short"
      ? `Attend the next ${b.mustAttend === 1 ? "class" : `${b.mustAttend} classes`} to get back to 75%.`
      : status === "edge"
        ? "No skips left. Missing the next class puts you below 75%."
        : `You can miss ${b.canSkip === 1 ? "1 class" : `${b.canSkip} classes`} and stay at 75% or above.`;
  const ifMiss = attendanceAfter(s.attended, s.held, -1);

  return (
    <div className="rounded-md border border-line bg-surface p-5 text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">Engineering Physics · sample</p>
          <p
            className={cn(
              "mt-1 font-mono text-[44px] font-semibold leading-none tracking-tight tabular-nums transition-colors duration-300",
              status === "short" ? "text-danger" : "text-ink",
            )}
          >
            {pct.toFixed(1)}%
          </p>
          <p className="mt-2 font-mono text-[13px] text-muted">
            {s.attended} of {s.held} classes
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors duration-300",
            status === "short"
              ? "bg-danger-soft text-danger"
              : status === "edge"
                ? "bg-warn-soft text-warn"
                : "bg-ok-soft text-ok",
          )}
        >
          {status === "short" ? "Below 75%" : status === "edge" ? "On the line" : "Safe"}
        </span>
      </div>
      <div className="relative mt-5 h-2 rounded-full bg-surface-2">
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-500 ease-out",
            status === "short" ? "bg-danger" : status === "edge" ? "bg-warn" : "bg-[var(--course-4)]",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
        <span className="absolute -top-1.5 left-[75%] h-5 w-[2px] bg-ink" aria-hidden="true" />
        <span className="absolute -top-6 left-[75%] -translate-x-1/2 font-mono text-[10.5px] text-muted">75%</span>
      </div>
      <p aria-live="polite" className="mt-5 border-t border-line-2 pt-4 text-[15px] leading-relaxed text-ink">
        {sentence}
        {status !== "short" && (
          <span className="text-muted"> Missing the next one would take you to {ifMiss.toFixed(1)}%.</span>
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setS((v) => ({ attended: v.attended, held: v.held + 1 }))}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm border border-line bg-surface px-3.5 text-[14px] font-medium text-ink transition-colors duration-[120ms] hover:bg-surface-2"
        >
          <Minus className="h-4 w-4" /> Miss a class
        </button>
        <button
          type="button"
          onClick={() => setS((v) => ({ attended: v.attended + 1, held: v.held + 1 }))}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-sm bg-accent px-3.5 text-[14px] font-medium text-background transition-colors duration-[120ms] hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> Attend a class
        </button>
        <button
          type="button"
          onClick={() => setS(START)}
          aria-label="Reset the example"
          className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-sm px-3 text-[13.5px] text-muted transition-colors duration-[120ms] hover:bg-surface-2 hover:text-ink"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── ribbons ─────────────────────────── */

const HUES = Array.from({ length: 8 }, (_, i) => `var(--course-${i + 1})`);

/** A thin band of the eight course colours, drifting slowly. */
export function HueRibbon({ className }: { className?: string }) {
  const stops = [...HUES, HUES[0]].join(", ");
  return (
    <div
      aria-hidden="true"
      className={cn("landing-hue-ribbon h-1 w-full", className)}
      style={{ backgroundImage: `linear-gradient(90deg, ${stops}, ${HUES.slice(1).join(", ")}, ${HUES[0]})` }}
    />
  );
}

/** The dismissible announcement strip above the header. */
export function AnnouncementRibbon() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("landing-ribbon-ffcs-w26") === "1") setHidden(true);
    } catch {}
  }, []);
  if (hidden) return null;
  return (
    <div className="relative border-b border-line bg-accent-soft">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-10 py-2 text-center text-[13px] text-ink sm:text-[13.5px]">
        <span className="rounded-full bg-accent px-2 py-px text-[11px] font-semibold text-background">New</span>
        <span>
          Winter 2026–27 FFCS planner is live.{" "}
          <a href="/ffcs/" className="font-medium text-accent underline-offset-2 hover:underline">
            Plan your timetable →
          </a>
        </span>
      </div>
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => {
          setHidden(true);
          try {
            localStorage.setItem("landing-ribbon-ffcs-w26", "1");
          } catch {}
        }}
        className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors duration-[120ms] hover:bg-surface hover:text-ink"
      >
        ×
      </button>
    </div>
  );
}

type Chip =
  | { kind: "course"; code: string; name: string; slot: string; pct: number; note: string }
  | { kind: "text"; text: string };

const RIBBON_A: Chip[] = [
  { kind: "course", code: "BCSE202L", name: "Data Structures", slot: "A1+TA1", pct: 88, note: "can skip 6" },
  { kind: "text", text: "Free classrooms near you" },
  { kind: "course", code: "BPHY101L", name: "Engineering Physics", slot: "C1+TC1", pct: 74, note: "attend next 1" },
  { kind: "text", text: "Mess menu for today" },
  { kind: "course", code: "BMAT201L", name: "Complex Variables", slot: "B1+TB1", pct: 76, note: "no skips left" },
  { kind: "text", text: "Bus 14 · Gate 2 · 16:45" },
  { kind: "course", code: "BEEE102L", name: "Electrical Engineering", slot: "D1+TD1", pct: 91, note: "can skip 8" },
  { kind: "text", text: "Laundry bag ready" },
  { kind: "text", text: "Credentials stay on your device" },
];
function ChipView({ c }: { c: Chip }) {
  if (c.kind === "text") {
    return (
      <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-[13.5px] text-ink-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
        {c.text}
      </span>
    );
  }
  const tone = c.pct < 75 ? "text-danger" : c.note.startsWith("no") ? "text-warn" : "text-muted";
  return (
    <span className="inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full border border-line bg-surface py-1.5 pl-2 pr-4 text-[13.5px]">
      <SlotBadge course={c.code}>{c.slot}</SlotBadge>
      <span className="text-ink">{c.name}</span>
      <span className={cn("font-mono font-semibold", c.pct < 75 ? "text-danger" : "text-ink")}>{c.pct}%</span>
      <span className={cn("text-[12.5px]", tone)}>{c.note}</span>
    </span>
  );
}

function MarqueeRow({ chips, reverse = false, duration }: { chips: Chip[]; reverse?: boolean; duration: number }) {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className={cn("landing-marquee flex w-max shrink-0 gap-3 pr-3", reverse && "landing-marquee-reverse")}
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {[...chips, ...chips].map((c, i) => (
          <span key={i} aria-hidden={i >= chips.length} className="shrink-0">
            <ChipView c={c} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** One drifting ribbon of what the app actually shows (kept to a single row so it stays a detail, not noise). */
export function MarqueeRibbons() {
  return (
    <div className="landing-marquee-host py-5" aria-label="What AmazeCC shows you">
      <MarqueeRow chips={RIBBON_A} duration={52} />
    </div>
  );
}
