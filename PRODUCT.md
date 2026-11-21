# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(A Next.js static-export web app, installable as a PWA. Mobile web is the main
way students use it; tablet and desktop are fully supported.)

## Users

VIT Chennai students, all years, from freshers onward. They use it mostly on
their phones, in short checks between classes, in the hostel and on the bus:
"can I skip this class?", "where is my next class?", "what are my CAT marks?",
"what is for lunch?". Other VIT campuses are not a target yet.

## Product Purpose

AmazeCC is one app for a VIT Chennai student's whole day. It signs in to VTOP
with the student's own credentials, syncs their records, and shows attendance,
marks, grades, timetable, exams, OD hours, payments, libraries, buses, the mess
menu, events, free classrooms and the FFCS planner in one place.

Success: a student opens AmazeCC instead of VTOP and the other portals, gets
the answer in seconds, and trusts it.

## Positioning

- **Smarter than VTOP.** It computes what VTOP never shows: how many classes
  you can skip or must attend to stay above 75%, marks next to the class
  average, grade and CGPA predictions, FFCS slot clashes.
- **Your data stays on your phone.** Records are saved on the device and open
  offline; the VTOP password is stored encrypted on the device and is only sent
  to sign in to VTOP.
- **Free, no ads, made by students.** An independent student project, not
  affiliated with VIT or VTOP, and not monetised.

## Operating Context

- Sign-in uses the student's VTOP user ID and password; a full sync runs
  after sign-in, then incremental syncs (manual or on a timer).
- An optional Amaze ID account links AmazeCC with other AmazeCC apps (Club
  Hub, Admin Portal, GoRoBo).
- A demo mode with sample data lets a visitor try the app before signing in.
- The FFCS planner works without signing in (`/ffcs/`).
- Used outdoors and on the move: one-handed, bright sun or late at night, on
  campus Wi-Fi or mobile data that drops.

## Capabilities and Constraints

- Modules: Home, Attendance (calendar, skip predictor), Academics (courses,
  marks, grades, curriculum), Exam schedule, OD hours, FFCS planner (generator,
  friends, faculty reviews), Payments, Libraries, Transport, Hostel and mess,
  Events, Free classrooms, Faculty finder, Question bank, Tools, Student
  Report (PDF / HTML / JSON export).
- Three themes: Light, Dark and Night. Display sizes: Compact, Default, Large.
- API calls go through mounts (`src/lib/apis/`); the student can pick the
  target server on the sign-in screen.
- Not official: the product must never imply VIT or VTOP endorsement.
- Redesign work stays on the fork `Anasarfeen123/AmazeCC` until the owner
  says the redesign is done (see `docs/redesign/HANDOFF.md`).

## Brand Commitments

- Name: AmazeCC ("Amaze" + a "CC" tag). Tagline: "Your campus companion".
- One app icon everywhere (the owner's design, `design/icon/`); no separate
  marks per surface, no branding on the easter-egg game.
- Voice: plain, friendly, a little funny (loading tips), never corporate.
- The visual system is documented in `design/README.md` and
  `src/app/brand.css` (owner-decided; changes need the owner's approval).

## Evidence on Hand

- Real user numbers exist (analytics and API stats, e.g.
  `https://api.amazecc.com/stats`). **Open:** the exact figures and which ones
  may be shown publicly have not been given yet; ask before using any number.
- Real product screenshots: `public/landing/` (home, phone and desktop, light
  and dark) and the demo account.
- No student testimonials, ratings, press or club endorsements. Never invent
  them.

## Product Principles

1. **The answer first.** Every screen leads with the one thing the student
   opened it for (the percentage, the next class, the mark), not chrome.
2. **Trust is the product.** Be exact about what is stored, where, and what is
   sent; never overstate privacy or accuracy.
3. **Phone first, everywhere.** Design for one hand on a small screen, then
   scale up; dense beats sparse when the student is checking quickly.
4. **Honest and independent.** Student-made, free and unofficial; no fake
   proof, no dark patterns, no ads.

## Accessibility & Inclusion

- Touch targets at least 44px; text and controls meet WCAG 2.1 AA contrast in
  all three themes (`scripts/redesign/contrast.py`).
- Respect `prefers-reduced-motion`; every animation has a still fallback.
- Works on low-end Android phones and slow or dropping connections.
