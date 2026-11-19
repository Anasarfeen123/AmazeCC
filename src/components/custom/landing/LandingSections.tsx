"use client";

/**
 * The sections under the guest hero (brand redesign, ROADMAP R1).
 *
 * Loud on purpose (user: "a masterpiece… dynamic… tons of colours"), but
 * still the brand: solid fills with ink edges and hard shadows, Space Mono,
 * no gradients/glass/emoji. Motion is CSS (brand.css "Landing page motion")
 * via LandingMotion helpers and stops under prefers-reduced-motion.
 * Kept behind a dynamic import (see GuestExperience) so the hero paints first.
 */

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CountUp, Marquee, Reveal, useInView } from "./LandingMotion";

const companionTimeline = [
  {
    time: "08:00 AM",
    title: "Timetable Check",
    desc: "AmazeCC wakes up with a clean view of today's schedule, locations, and attendance.",
  },
  {
    time: "11:00 AM",
    title: "Can I skip?",
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
    desc: "Your timetable, marks and attendance are saved on your phone, so they open without internet.",
  },
  { title: "Fast", desc: "Pages open from what is already on your phone; syncing only fetches what changed." },
];

const roadmap = [
  {
    status: "In Progress",
    title: "AI Assistant",
    desc: "Ask questions about your slots and exams in plain words.",
  },
  {
    status: "Planned",
    title: "Placement Tracker",
    desc: "Log active job listings and requirements inside the profile.",
  },
  {
    status: "Planned",
    title: "Reminders",
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

const INK = "text-obsidian";
const CARD = "rounded-[14px] border-[3px] border-border-ink shadow-brutal-md";
const BADGE =
  "inline-flex rounded-[6px] border-2 border-border-ink px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-[0.06em]";

function Heading({ label, title, sub, tone = "" }: { label: string; title: ReactNode; sub?: string; tone?: string }) {
  return (
    <Reveal className={`max-w-2xl space-y-3 ${tone}`}>
      <span className={`${BADGE} bg-surface text-text-primary`}>{label}</span>
      <h2 className="font-display text-[26px] font-bold uppercase leading-[1.05] sm:text-[38px]">{title}</h2>
      {sub ? <p className="text-sm opacity-80 sm:text-base">{sub}</p> : null}
    </Reveal>
  );
}

/** Attendance tile: the bar fills to 79% with the 75% line drawn. */
function AttendanceMini() {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="font-display text-[44px] font-bold leading-none">
          <CountUp to={79.1} decimals={1} suffix="%" />
        </span>
        <span className="pb-2 font-mono text-sm font-bold">53 of 67</span>
      </div>
      <div className="relative h-5 overflow-hidden rounded-[6px] border-[3px] border-obsidian bg-cream">
        {inView ? <div className="landing-fill h-full bg-teal" style={{ width: "79%" }} /> : null}
        <div className="absolute inset-y-0 left-[75%] w-1 bg-obsidian" />
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <span className={`${BADGE} bg-mint ${INK}`}>Can skip 2</span>
        <span className={`${BADGE} bg-cream ${INK}`}>Line = 75%</span>
      </div>
    </div>
  );
}

function TimetableMini() {
  return (
    <ul className="space-y-2">
      {[
        ["08:00", "DBMS Lab", "AB1-209", "bg-mint"],
        ["09:50", "Sustainability", "AB3-403", "bg-ochre"],
        ["14:55", "Data Science", "AB3-107", "bg-coral"],
      ].map(([t, c, r, col], i) => (
        <li key={t} className="flex items-center gap-2 rounded-[10px] border-2 border-cream/60 bg-cream/10 px-2 py-1.5">
          <span className={`rounded-[6px] border-2 border-obsidian px-1.5 font-mono text-xs font-bold ${col} ${INK}`}>
            {t}
          </span>
          <span className="min-w-0 flex-1 truncate font-display text-sm font-bold uppercase">{c}</span>
          <span className="font-mono text-xs opacity-80">{r}</span>
          {i === 0 ? <span className="landing-blink font-mono text-xs font-bold text-ochre">NOW</span> : null}
        </li>
      ))}
    </ul>
  );
}

function SlotGridMini() {
  const filled = new Set([1, 4, 6, 9, 11, 14, 17, 18]);
  const clash = 12;
  return (
    <div className="grid grid-cols-6 gap-1.5" aria-hidden>
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className={`h-5 rounded-[4px] border-2 border-obsidian ${
            i === clash ? "bg-coral landing-blink" : filled.has(i) ? "bg-teal" : "bg-cream"
          }`}
        />
      ))}
    </div>
  );
}

const MODULE_TAGS = [
  "Attendance",
  "Marks",
  "Timetable",
  "Exams",
  "FFCS planner",
  "Mess menu",
  "Buses",
  "OD hours",
  "Libraries",
  "Events",
  "Free rooms",
  "Faculty finder",
  "Payments",
  "Question bank",
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
  const simBtn =
    "inline-flex min-h-12 flex-1 items-center justify-center rounded-[10px] border-[3px] border-obsidian px-3 font-mono text-sm font-bold uppercase tracking-[0.06em] shadow-brutal-sm brutal-press";

  const dayColours = ["bg-ochre", "bg-mint", "bg-coral", "bg-sage", "bg-orange", "bg-teal text-cream"];

  return (
    <div>
      {/* Ticker */}
      <div className="border-y-[3px] border-border-ink bg-ochre py-3 text-obsidian">
        <Marquee items={MODULE_TAGS} itemClassName="font-display text-base font-bold uppercase sm:text-lg" />
      </div>

      {/* Why: the portals students juggle today */}
      <section id="sec-problem" className="bg-coral px-4 py-16 text-obsidian sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <Heading
            label="Why AmazeCC"
            title="Five portals for one day of college"
            sub="VTOP for attendance, another site for the mess menu, a PDF for the bus, Koha for books, a group chat for events. AmazeCC puts them on one screen."
          />
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[
              ["VTOP", "Session expired. Log in again.", "bg-cream", "-rotate-2"],
              ["Mess", "Menu is page 4 of a PDF.", "bg-ochre", "rotate-2"],
              ["Hostel", "Outing pass OTP pending.", "bg-mint", "rotate-1"],
              ["Library", "Catalogue search failed.", "bg-sage", "-rotate-1"],
            ].map(([where, pain, bg, rot], i) => (
              <Reveal as="li" key={where} delay={i * 90}>
                <div className={`${CARD} ${bg} ${rot} p-5 transition-transform duration-200 hover:rotate-0`}>
                  <span className={`${BADGE} bg-obsidian text-cream`}>{where}</span>
                  <p className="mt-3 font-display text-lg font-bold leading-tight">{pain}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Modules bento */}
      <section id="sec-features" className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-8 sm:py-20">
        <Heading
          label="Modules"
          title={
            <>
              Everything you open <span className="text-hero">VTOP</span> for
            </>
          }
          sub="And a few things VTOP never had. All of it works offline once synced."
        />
        <div className="grid grid-cols-1 gap-5 pb-2 pr-2 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal className={`${CARD} bg-ochre p-6 text-obsidian sm:col-span-2 lg:row-span-2`}>
            <span className={`${BADGE} bg-obsidian text-cream`}>Attendance</span>
            <h3 className="mt-4 font-display text-2xl font-bold uppercase leading-tight">Know before you skip</h3>
            <p className="mt-2 max-w-md text-base">
              Every course with the 75% line drawn, and how many classes you can skip or must attend.
            </p>
            <div className="mt-6">
              <AttendanceMini />
            </div>
          </Reveal>
          <Reveal delay={80} className={`${CARD} bg-teal p-6 text-cream sm:col-span-2`}>
            <span className={`${BADGE} bg-ochre ${INK}`}>Timetable</span>
            <h3 className="mt-3 font-display text-xl font-bold uppercase">Today, at a glance</h3>
            <div className="mt-4">
              <TimetableMini />
            </div>
          </Reveal>
          <Reveal delay={120} className={`${CARD} bg-sage p-6 text-obsidian`}>
            <span className={`${BADGE} bg-cream ${INK}`}>Marks</span>
            <p className="mt-4 font-display text-[36px] font-bold leading-none">
              <CountUp to={8.42} decimals={2} />
            </p>
            <p className="mt-1 font-mono text-xs font-bold uppercase">CGPA // plan with target grades</p>
          </Reveal>
          <Reveal delay={160} className={`${CARD} bg-mint p-6 text-obsidian`}>
            <span className={`${BADGE} bg-cream ${INK}`}>FFCS</span>
            <h3 className="mt-3 font-display text-lg font-bold uppercase leading-tight">Spot the clash</h3>
            <div className="mt-3">
              <SlotGridMini />
            </div>
          </Reveal>
          <Reveal delay={80} className={`${CARD} bg-orange p-6 text-obsidian`}>
            <span className={`${BADGE} bg-cream ${INK}`}>Mess</span>
            <p className="mt-3 font-display text-lg font-bold uppercase leading-tight">Breakfast till 09:00</p>
            <p className="mt-1 text-sm">Idli, vada, sambar, chutney.</p>
          </Reveal>
          <Reveal delay={120} className={`${CARD} bg-coral p-6 text-obsidian`}>
            <span className={`${BADGE} bg-cream ${INK}`}>On duty</span>
            <p className="mt-3 font-display text-[44px] font-bold leading-none">
              <CountUp to={39} />
              <span className="text-xl">/40</span>
            </p>
            <p className="mt-1 font-mono text-xs font-bold uppercase">OD hours this semester</p>
          </Reveal>
          {[
            ["Exams", "Seat, venue and reporting time for every CAT and FAT."],
            ["Faculty finder", "Where a teacher is right now, and their free slots."],
            ["Free classrooms", "Empty rooms by block and hour."],
            ["Payments", "Dues, receipts and wallet without digging in VTOP."],
            ["Libraries", "Search the catalogue, see what is due back."],
            ["Events", "Club events and hackathons, registrations in one place."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={(i % 4) * 70} className={`${CARD} bg-surface p-5`}>
              <h3 className="font-display text-base font-bold uppercase leading-tight text-text-heading">{t}</h3>
              <p className="mt-2 text-sm text-text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Live simulator */}
      <section className="border-y-[3px] border-border-ink bg-sage px-4 py-16 text-obsidian sm:px-8 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <Heading
            label="Try it"
            title="Tap. Watch the line."
            sub="Attend or skip and see the number move. The real app does this for every course, every day."
          />
          <Reveal className={`${CARD} space-y-5 bg-cream p-6 mr-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.06em]">
                {"BCSE302L // Database Systems"}
              </span>
              <span className={`${BADGE} ${below ? "bg-coral" : "bg-mint"} ${INK}`}>
                {below ? "Below 75%" : "Safe"}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <span className="font-display text-[48px] font-bold leading-none tabular-nums text-teal">
                {mockPercent.toFixed(1)}%
              </span>
              <span className="pb-2 font-mono text-sm font-bold">
                {mockAttended} of {mockTotal}
              </span>
            </div>
            <div className="relative h-5 w-full overflow-hidden rounded-[6px] border-[3px] border-obsidian bg-white/60">
              <div
                className={`h-full transition-[width] duration-300 ${below ? "bg-coral" : "bg-teal"}`}
                style={{ width: `${Math.min(100, mockPercent)}%` }}
              />
              <div aria-hidden className="absolute inset-y-0 left-[75%] w-1 bg-obsidian" />
            </div>
            <p className="font-display text-lg font-bold leading-snug" aria-live="polite">
              {verdict}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${simBtn} bg-mint ${INK}`}
                onClick={() => {
                  setMockAttended((v) => v + 1);
                  setMockTotal((v) => v + 1);
                }}
              >
                Attend
              </button>
              <button type="button" className={`${simBtn} bg-coral ${INK}`} onClick={() => setMockTotal((v) => v + 1)}>
                Skip
              </button>
              <button
                type="button"
                className={`${simBtn} flex-none bg-cream ${INK}`}
                onClick={() => {
                  setMockAttended(17);
                  setMockTotal(20);
                }}
              >
                Reset
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Facts band (real product facts, not invented user numbers) */}
      <section className="bg-teal px-4 py-16 text-cream sm:px-8">
        <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-6 lg:grid-cols-4">
          {[
            [<CountUp key="m" to={14} />, "modules in one app"],
            [<CountUp key="l" to={75} suffix="%" />, "line drawn on every bar"],
            [<CountUp key="a" to={0} />, "ads, ever"],
            [<CountUp key="t" to={2} />, "themes, light and dark"],
          ].map(([n, label], i) => (
            <Reveal as="li" key={i} delay={i * 80} className="border-l-[3px] border-ochre pl-4">
              <p className="font-display text-[40px] font-bold leading-none text-ochre sm:text-[48px]">{n}</p>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.06em]">{label}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-8 sm:py-20">
        <Heading label="Trust" title="Built by students, kept on your phone" />
        <ul className="grid grid-cols-1 gap-5 pb-2 pr-2 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <Reveal
              as="li"
              key={b.title}
              delay={i * 80}
              className={`${CARD} p-6 ${["bg-mint text-obsidian", "bg-teal text-cream", "bg-ochre text-obsidian", "bg-surface text-text-primary"][i % 4]}`}
            >
              <h3 className="font-display text-lg font-bold uppercase leading-tight">{b.title}</h3>
              <p className="mt-2 text-sm opacity-85">{b.desc}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* A day */}
      <section
        id="sec-timeline"
        className="border-y-[3px] border-border-ink bg-surface-secondary px-4 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.3fr]">
          <Heading label="A day" title="One app from 8 am to 9 pm" />
          <ol className="space-y-3 pr-2">
            {companionTimeline.map((t, i) => (
              <Reveal as="li" key={t.time} delay={i * 70}>
                <div className={`${CARD} grid grid-cols-[auto_1fr] items-center gap-4 bg-surface p-4`}>
                  <span
                    className={`rounded-[8px] border-[3px] border-border-ink px-2 py-1 font-mono text-sm font-bold ${dayColours[i % dayColours.length]} ${i % dayColours.length === 5 ? "" : INK}`}
                  >
                    {t.time}
                  </span>
                  <div>
                    <p className="font-display text-base font-bold uppercase text-text-heading">{t.title}</p>
                    <p className="text-sm text-text-muted">{t.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Roadmap */}
      <section id="sec-roadmap" className="mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-8 sm:py-20">
        <Heading label="Roadmap" title="What is coming next" />
        <ul className="grid grid-cols-1 gap-5 pb-2 pr-2 sm:grid-cols-2 lg:grid-cols-4">
          {roadmap.map((r, i) => (
            <Reveal as="li" key={r.title} delay={i * 80} className={`${CARD} bg-surface p-6`}>
              <span
                className={`${BADGE} ${
                  r.status === "In Progress"
                    ? `bg-ochre ${INK}`
                    : r.status === "Planned"
                      ? `bg-mint ${INK}`
                      : "bg-surface-secondary text-text-muted"
                }`}
              >
                {r.status}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold uppercase leading-tight text-text-heading">
                {r.title}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{r.desc}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section
        id="sec-faq"
        className="border-t-[3px] border-border-ink bg-mint px-4 py-16 text-obsidian sm:px-8 sm:py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1.4fr]">
          <Heading label="FAQ" title="Questions students ask" />
          <Reveal className={`${CARD} divide-y-[3px] divide-obsidian overflow-hidden bg-cream mr-2`}>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex min-h-16 w-full items-center justify-between gap-3 px-5 text-left font-display text-base font-bold uppercase hover:bg-ochre/40"
                  >
                    {f.q}
                    <ChevronDown
                      aria-hidden
                      className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open ? <p className="px-5 pb-5 text-base">{f.a}</p> : null}
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* Second ticker, reversed */}
      <div className="border-y-[3px] border-border-ink bg-obsidian py-3 text-ochre">
        <Marquee
          reverse
          items={["Free", "Made by students", "Works offline", "Light and dark", "No ads", "For VIT Chennai"]}
          itemClassName="font-display text-base font-bold uppercase sm:text-lg"
        />
      </div>
    </div>
  );
}
