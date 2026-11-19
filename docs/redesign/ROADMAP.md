# AmazeCC redesign — roadmap

What is left, in the order to do it. Each item has a **Done when** list: do
not call an item finished until every box is true and you have looked at
the screenshots. Rules and how-to: `HANDOFF.md`. Design rules: `design/`.

Status: ✅ done · 🟡 partly · ⬜ not started. Last updated 2026-11-19 (`dca47d84`).

| #   | Item                                 | Status                   | Size |
| --- | ------------------------------------ | ------------------------ | ---- |
| R1  | Landing page                         | ⬜                       | M    |
| R2  | FFCS planner bugs                    | ⬜                       | L    |
| R3  | Attendance screens                   | 🟡 (side card done)      | M    |
| R4  | Onboarding steps                     | 🟡 (themed, layout weak) | S    |
| R5  | Demo data lost on reload             | ⬜                       | S    |
| R6  | Remaining screens (codemod + polish) | 🟡                       | XL   |
| R7  | "Super dark" black theme             | ⬜                       | S    |
| R8  | Uppercase display titles on cards    | ⬜                       | S    |
| R9  | Move brand layer into AmazeUI        | ⬜ (needs user OK)       | M    |
| R10 | Remove bridges, final lint           | ⬜                       | M    |
| R11 | Accessibility pass                   | ⬜                       | S    |
| R12 | Screenshot script polish             | 🟡                       | S    |

Done so far (see `HANDOFF.md` §3 for commits): tokens, logos, primitives,
app shell, Home, course side card, Modules sheet, spotlight search, sync
pill, first-sync + welcome, Fresher hub, dropdowns, shared Button, theme
switch, motion.

---

## R1 · Landing page (user priority)

Files: `components/custom/app/GuestExperience.tsx` (hero + top nav),
`components/custom/landing/LandingSections.tsx` (`sec-problem`,
`sec-features` with `Tilt3DCard`, `sec-timeline`, `sec-roadmap`, `sec-faq`).
Today: purple gradient headline, indigo buttons, hero fills a third of the
screen, generic stats row. Before shots: `screens/live-before-*`.

Plan: logo lockup + "Your campus companion"; Space Mono uppercase headline;
one sentence; primary **Try the demo**, secondary **Sign in with VTOP**;
trust line ("Your password never leaves this device"). Real phone + desktop
screenshots of Home in ink-edged frames. Features as a grid of brutal cards
that each show a real mini UI (attendance with the 75% line, a timetable
day, OD hours, FFCS). Drop the 3D tilt cards and fake stats. Shorter
problem/timeline/roadmap; FAQ as 44px accordion rows. Top nav: logo, 3–4
anchors, theme, Try demo, Get started; phone = menu sheet. Footer with
links, privacy, terms.

Done when:

- [ ] No gradient, glass, blur, indigo or emoji anywhere on `/`
- [ ] Hero shows the product (real screenshot), not abstract art
- [ ] "Try the demo" works from hero and nav; "Get started" opens sign-in
- [ ] Looks right at 360 / 768 / 1440 px, light and dark, no horizontal scroll
- [ ] Lighthouse accessibility ≥ 95; all images have alt text
- [ ] Before/after screenshots added to `screens/`

## R2 · FFCS planner bugs ("bugging so much", demo and real)

A debugging project first, styling second. Files:
`exams/FFCSTimetableTab.tsx` (4.7k lines),
`exams/FFCS/components/FFCSGuidedSelector.tsx` (5.4k lines), `exams/FFCS/*`,
standalone route `app/ffcs/`.

1. Ask the user for exact repro steps (what they click, what goes wrong).
2. Make the three FFCS tests in the baseline pass: `ffcsTab.render`,
   `ffcsClassmates.render`, `ffcsClassmates` (they probably show real breakage).
3. Reproduce in demo and with `LOGIN=1`; record console errors (`shot.mjs`
   prints `EXC` / `CERR`).
4. Check the fixed `.ffcs-bottom-bar` (z-240) against the new teal bottom bar
   and `BrandSheet` (see `.dashboard-shell:has(.ffcs-bottom-bar)` in `globals.css`).
5. Before changing behaviour in `FFCSGuidedSelector`, group its state
   (reducer or context); cards read 13–38 pieces of state each.
6. Then restyle with `brandify.py --status` and hand polish.

Done when:

- [ ] Every repro the user gave is fixed and has a test
- [ ] The three FFCS baseline tests pass (baseline drops to 25 — update HANDOFF §6.2)
- [ ] No console errors through a full plan → generate → save flow, demo and real
- [ ] Bottom bars do not overlap on phones
- [ ] Planner restyled; screenshots at three widths, both themes

## R3 · Attendance

Files: `components/custom/attendance/*` (~530 off-spec classes). The course
side card (`DesktopCourseDetail.tsx`) is done and is the pattern to follow.
Fix R5 first so the demo shows data after reload.

Done when:

- [ ] Course list: %, bar with the 75% line, "Can skip N" / "Attend next N" in words
- [ ] Course detail: big %, a plain sentence, what-if tiles, Present/Absent badges
- [ ] Calendar/heatmap and OD screens follow the reference mock
- [ ] Faculty names via `facultyDisplayName()`
- [ ] Checked with the real account and the demo, three widths, both themes

## R4 · Onboarding steps

File: `components/custom/onboarding/AmazeOnboardingFlow.tsx`.

Done when:

- [ ] Desktop left column is not empty (step title, progress, short help)
- [ ] Step progress is a clear bar or "STEP 2 OF 5", not tiny dots
- [ ] Selected tiles use sage fill + ink edge + small shadow; toggles use `Switch`
- [ ] One primary button per step; no emoji/icon wells
- [ ] Walked through end to end in light and dark

## R5 · Demo data lost after reload

Enter demo, reload: Home shows "0 of 0 attended" and Attendance is blank
(also on amazecc.com). Likely the restored semester id (current term from
`config.json`) does not match the demo data's `CH20252605`.

Done when:

- [ ] Demo survives a reload with the same numbers
- [ ] A test covers it
- [ ] `shot.mjs` no longer needs `NO_RELOAD=1` for demo

## R6 · Remaining screens

9,805 old-style classes in 216 files on 2026-11-19 (recount command in
`HANDOFF.md` §5). Biggest: `exams/` 3,463 · `header/` 750 (ProfilePage 572) · `hostel/` 628 · `attendance/` 531 · `social/` 490 · `tasks/` 479 ·
`app/` 427 (`useAppCommands` 344) · `shared/` 417 · friend finder ~490 ·
`feedback/` 286 · timetable, libraries, tools, clubs, profile, events,
qbank, legal pages ~1,300.

Per screen:

1. `python3 scripts/redesign/brandify.py <files> --status` (add `--forced-dark` for always-dark screens).
2. Hand fixes: remove icon wells and emoji, pills → badges/buttons, one hero per card, words for status, drop noise.
3. Update tests that pinned old classes (keep intent).
4. Screenshots three widths × two themes; commit per screen or area.

Done when (per screen): lint gate in `design/AI_CONTRIBUTOR_GUIDE.md` prints
`clean` for its files, and it has been looked at in both themes.

## R7 · "Super dark" theme (user request)

An extra option next to Light and Dark, not a replacement. Near-black page
(`#000`–`#050606`), cards `#0D1010`, bright teal or ochre edges, same fills,
shadows in a visible colour (black vanishes on black). Implement as a
`.black` class on `<html>` that also gets `dark:` variants, and a third
choice in the theme switches (sidebar footer, Modules sheet, settings).

Done when:

- [ ] `contrast.py` extended with a `.black` block and passing
- [ ] Theme choice persists; system "dark" still maps to the obsidian dark
- [ ] Sidebar/bottom bar still read as the brand teal panel

## R8 · Uppercase display titles

The reference mock uppercases card titles (course names, section titles).
Try it on Home class cards and section headers; check phone line lengths
(long course names) before rolling out.

## R9 · Move the brand layer into AmazeUI (needs the user's go-ahead)

`brand.css` tokens → `ui/src/tailwind.css`; `BrandBackButton` → AmazeUI
`BackButton`; `BrandSheet` → `AppLibrary`; Sidebar item classes; shared
`Button`. Only after the user allows publishing `@amazecontinuityprojects/amazeui`.

## R10 · Remove bridges

Once R6 is done: delete the zinc/gray/slate/indigo bridges in `brand.css` /
`globals.css`, the `.card-surface`/`.surface-card` aliases, the deprecated
settings keys, and stale `frontend/docs/*` design notes. Run the lint gate on
the whole `src/`.

## R11 · Accessibility pass

Keyboard order in sidebar, sheets and spotlight; focus trapped in dialogs;
`aria-current` on all nav; reduced motion on every animated screen; 200%
zoom without overlap; screen-reader labels for all icon buttons.

## R12 · Screenshot script polish

`navLabel` clicks the first matching text (e.g. the Home stat label instead
of the sidebar "Attendance"): prefer `[data-sidebar-nav]` and bottom-nav
buttons; add a `--route` option; save console errors to a file.
