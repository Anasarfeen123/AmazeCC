"use client";

/**
 * The sections under the guest hero (brand redesign, ROADMAP R1).
 *
 * Kept behind a dynamic import (see GuestExperience) so the hero paints first.
 * Brand rules: no gradients, glass, 3D tilt, icon wells or emoji; every section
 * uses the same heading (mono badge, display title, one sentence); cards are
 * ink-edged with hard shadows; the attendance simulator is a real mini UI.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const features = [
  {
    tag: "Daily",
    title: "Attendance",
    desc: "Every course with the 75% line drawn, and how many classes you can skip or must attend.",
  },
  {
    tag: "Daily",
    title: "Timetable",
    desc: "Today's classes, rooms and faculty, with the academic calendar folded in.",
  },
  {
    tag: "Grades",
    title: "Marks and CGPA",
    desc: "Course marks, class averages and a CGPA you can plan against target grades.",
  },
  { tag: "Exams", title: "Exam schedule", desc: "CAT, FAT and lab exams with venue, seat and reporting time." },
  {
    tag: "Planning",
    title: "FFCS planner",
    desc: "Draft slots, catch clashes and compare timetables before registration.",
  },
  { tag: "Campus", title: "Hostel and mess", desc: "Mess menu, leave, laundry and room details in one place." },
  { tag: "Campus", title: "Faculty finder", desc: "Where a teacher is right now, their cabin and free slots." },
  { tag: "Campus", title: "Free classrooms", desc: "Empty rooms by block and hour, for group study or a quiet break." },
  { tag: "Money", title: "Payments", desc: "Fee dues, receipts and wallet history without digging through VTOP." },
  { tag: "Reading", title: "Libraries", desc: "Search the catalogue, see what you have borrowed and when it is due." },
  { tag: "Clubs", title: "Events", desc: "Club events and hackathons, with your registrations kept together." },
  { tag: "Exams", title: "Question bank", desc: "Previous papers by course, saved for offline revision." },
];

const companionTimeline = [
  {
    time: "08:00 AM",
    title: "Timetable Check",
    desc: "AmazeCC wakes up with a clean view of today's schedule, locations, and attendance.",
  },
  {
    time: "11:00 AM",
    title: "Interactive Skip",
    desc: "Want to skip a slot? Check the simulator to see if you stay above the 75% limit.",
  },
  {
    time: "01:30 PM",
    title: "Mess Menu",
    desc: "Check what food is scheduled for lunch directly on the hostel panel.",
  },
  {
    time: "04:30 PM",
    title: "Library Check",
    desc: "Search OPAC catalogs for reference books and verify return dates.",
  },
  {
    time: "06:00 PM",
    title: "Event Listing",
    desc: "Discover upcoming club hackathons, workshops, and register passes.",
  },
  {
    time: "09:00 PM",
    title: "Wishlist Drafting",
    desc: "Plan course slot selections for the upcoming semester's FFCS.",
  },
];

const benefits = [
  { title: "Everything in one place", desc: "No more loading VTOP, Koha, EventHub, and Mess PDFs separately." },
  {
    title: "Privacy first",
    desc: "Your records live on your phone. Your VTOP password is stored encrypted on this device and is only sent to sign you in to VTOP.",
  },
  {
    title: "Offline Support",
    desc: "Your schedule, marks, and attendance details are cached for instant offline lookup.",
  },
  { title: "Lightning Fast", desc: "Optimized bundle sizes and lightweight state loads make queries instant." },
];

const roadmap = [
  {
    status: "In Progress",
    title: "AI Assistant",
    desc: "Intelligent chatbot to answer questions about slots and exams.",
  },
  {
    status: "Planned",
    title: "Placement Tracker",
    desc: "Log active job listings and requirements inside the profile.",
  },
  {
    status: "Planned",
    title: "Smart Notifications",
    desc: "Reminders for class timings and pending library checkouts.",
  },
  { status: "Backlog", title: "Expense Manager", desc: "Log pocket money and food purchases inside hostel tabs." },
];

const faqs = [
  {
    q: "Is this official?",
    a: "No. AmazeCC is an independent, student-designed project built to provide a clean companion UI. It speaks directly to official portals securely.",
  },
  {
    q: "Is it free?",
    a: "Yes. AmazeCC is completely free and student-focused with zero advertisements or subscription plans.",
  },
  {
    q: "Does it store passwords?",
    a: "It keeps them on your device, encrypted. To fetch your data, your user ID and password are sent to the AmazeCC server to sign you in to VTOP, and the records it fetches are saved on your device.",
  },
  {
    q: "Can alumni use it?",
    a: "Yes. Any student with active credentials can synchronize history and inspect catalogs.",
  },
];

export default function LandingSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Attendance simulator: a live toy, so it owns its own counts.
  const [mockAttended, setMockAttended] = useState(17);
  const [mockTotal, setMockTotal] = useState(20);
  const mockPercent = mockTotal > 0 ? (mockAttended / mockTotal) * 100 : 0;
  const below = mockPercent < 75;
  const canSkip = Math.max(0, Math.floor(mockAttended / 0.75) - mockTotal);
  const mustAttend = below ? Math.ceil((0.75 * mockTotal - mockAttended) / 0.25) : 0;
  const verdict = below
    ? `Attend the next ${mustAttend} class${mustAttend === 1 ? "" : "es"} to get back to 75%.`
    : canSkip > 0
      ? `You can skip ${canSkip} class${canSkip === 1 ? "" : "es"} and stay above 75%.`
      : "Exactly at the line. Do not skip the next one.";

  const card = "rounded-[14px] border-2 border-border-ink bg-surface shadow-brutal-md";
  const badge =
    "inline-flex rounded-[6px] border-2 border-border-ink px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em]";
  const btn =
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-[10px] border-2 border-border-ink px-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] shadow-brutal-sm brutal-press";

  const Heading = ({ label, title, sub }: { label: string; title: string; sub?: string }) => (
    <div className="max-w-2xl space-y-3">
      <span className={`${badge} bg-secondary text-secondary-foreground`}>{label}</span>
      <h2 className="font-display text-[28px] font-bold uppercase leading-[1.05] text-text-heading sm:text-[40px]">
        {title}
      </h2>
      {sub ? <p className="text-base text-text-muted">{sub}</p> : null}
    </div>
  );

  return (
    <div className="space-y-0">
      {/* Why: the portals students juggle today */}
      <section
        id="sec-problem"
        className="border-y-2 border-border-ink bg-surface-secondary px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <Heading
            label="Why AmazeCC"
            title="Five portals for one day of college"
            sub="VTOP for attendance, another site for the mess menu, a PDF for the bus, Koha for books, a group chat for events. AmazeCC puts them on one screen."
          />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              ["VTOP", "Session expired. Log in again."],
              ["Mess", "Menu is page 4 of a PDF."],
              ["Hostel", "Outing pass OTP pending."],
              ["Library", "Catalogue search failed."],
            ].map(([where, pain]) => (
              <li key={where} className={`${card} p-4`}>
                <span className={`${badge} bg-danger-surface text-danger-foreground`}>{where}</span>
                <p className="mt-2 text-sm text-text-primary">{pain}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Modules */}
      <section id="sec-features" className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-8 sm:py-24">
        <Heading
          label="Modules"
          title="Everything you open VTOP for"
          sub="And a few things VTOP never had. All of it works offline once synced."
        />
        <ul className="grid grid-cols-1 gap-4 pr-1.5 pb-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className={`${card} flex flex-col gap-2 p-5`}>
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                {f.tag}
              </span>
              <h3 className="font-display text-lg font-bold uppercase leading-tight text-text-heading">{f.title}</h3>
              <p className="text-sm text-text-muted">{f.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Live attendance simulator */}
      <section className="border-y-2 border-border-ink bg-surface-secondary px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <Heading
            label="Try it"
            title="Know before you skip"
            sub="Tap attend or skip and watch the number move. The real app does this for every course, every day."
          />
          <div className={`${card} space-y-4 p-5 mr-1.5`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted">
                {"BCSE302L // Database Systems"}
              </span>
              <span
                className={`${badge} ${below ? "bg-danger-surface text-danger-foreground" : "bg-success-surface text-success-foreground"}`}
              >
                {below ? "Below 75%" : "Safe"}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <span className="font-display text-[56px] font-bold leading-none text-hero tabular-nums">
                {mockPercent.toFixed(1)}%
              </span>
              <span className="pb-1 font-mono text-sm text-text-muted">
                {mockAttended} of {mockTotal}
              </span>
            </div>
            <div className="relative h-4 w-full overflow-hidden rounded-[6px] border-2 border-border-ink bg-surface-secondary">
              <div
                className={`h-full transition-[width] duration-300 ${below ? "bg-danger" : "bg-primary"}`}
                style={{ width: `${Math.min(100, mockPercent)}%` }}
              />
              <div aria-hidden className="absolute inset-y-0 left-[75%] w-0.5 bg-text-primary" />
            </div>
            <p className="text-sm text-text-primary" aria-live="polite">
              {verdict}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${btn} bg-success-surface text-success-foreground`}
                onClick={() => {
                  setMockAttended((v) => v + 1);
                  setMockTotal((v) => v + 1);
                }}
              >
                Attend
              </button>
              <button
                type="button"
                className={`${btn} bg-danger-surface text-danger-foreground`}
                onClick={() => setMockTotal((v) => v + 1)}
              >
                Skip
              </button>
              <button
                type="button"
                className={`${btn} flex-none bg-surface text-text-primary`}
                onClick={() => {
                  setMockAttended(17);
                  setMockTotal(20);
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-8 sm:py-24">
        <Heading label="Trust" title="Built by students, kept on your phone" />
        <ul className="grid grid-cols-1 gap-4 pr-1.5 pb-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <li
              key={b.title}
              className={`${card} p-5 ${i === 1 ? "!bg-teal text-cream dark:!bg-surface-tertiary dark:text-text-primary" : ""}`}
            >
              <h3 className="font-display text-base font-bold uppercase leading-tight">{b.title}</h3>
              <p className={`mt-2 text-sm ${i === 1 ? "opacity-85" : "text-text-muted"}`}>{b.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* A day with AmazeCC */}
      <section
        id="sec-timeline"
        className="border-y-2 border-border-ink bg-surface-secondary px-4 py-16 sm:px-8 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Heading label="A day" title="One app from 8 am to 9 pm" />
          <ol className="divide-y-2 divide-border-muted rounded-[14px] border-2 border-border-ink bg-surface shadow-brutal-md mr-1.5">
            {companionTimeline.map((t) => (
              <li key={t.time} className="grid grid-cols-[88px_1fr] gap-3 px-4 py-3">
                <span className="font-mono text-sm font-bold text-hero">{t.time}</span>
                <div>
                  <p className="font-display text-sm font-bold uppercase text-text-heading">{t.title}</p>
                  <p className="text-sm text-text-muted">{t.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Roadmap */}
      <section id="sec-roadmap" className="mx-auto max-w-7xl space-y-10 px-4 py-16 sm:px-8 sm:py-24">
        <Heading label="Roadmap" title="What is coming next" />
        <ul className="grid grid-cols-1 gap-4 pr-1.5 pb-1.5 sm:grid-cols-2 lg:grid-cols-4">
          {roadmap.map((r) => (
            <li key={r.title} className={`${card} p-5`}>
              <span
                className={`${badge} ${
                  r.status === "In Progress"
                    ? "bg-highlight text-highlight-foreground"
                    : r.status === "Planned"
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-surface-secondary text-text-muted"
                }`}
              >
                {r.status}
              </span>
              <h3 className="mt-3 font-display text-base font-bold uppercase leading-tight text-text-heading">
                {r.title}
              </h3>
              <p className="mt-1 text-sm text-text-muted">{r.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section id="sec-faq" className="border-t-2 border-border-ink bg-surface-secondary px-4 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.4fr]">
          <Heading label="FAQ" title="Questions students ask" />
          <div className="divide-y-2 divide-border-muted overflow-hidden rounded-[14px] border-2 border-border-ink bg-surface shadow-brutal-md">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left font-display text-sm font-bold uppercase text-text-heading hover:bg-surface-secondary"
                  >
                    {f.q}
                    <ChevronDown
                      aria-hidden
                      className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open ? <p className="px-4 pb-4 text-sm text-text-muted">{f.a}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
