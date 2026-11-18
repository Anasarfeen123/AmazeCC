# AmazeCC redesign — handoff

**Read this whole file before you change anything.** It is written so any
agent (Claude, Codex, Gemini, Cursor…) can continue without the chat history.

- Canonical copy: `frontend/docs/redesign/HANDOFF.md` on branch **`redesign`**
  of the fork **`Anasarfeen123/AmazeCC`**. `amaze-workspace/REDESIGN_HANDOFF.md`
  is a symlink to it.
- Older, unrelated backlog (the 60 code-review items, environment notes):
  `amaze-workspace/HANDOFF.md`. Read its §3 (environment) and §4 (conventions).
- Last updated: **2026-11-19**, after commit `3582347c`.

---

## 0. Hard rules (do not break these)

1. **Fork only.** Work only on `Anasarfeen123/AmazeCC` (and
   `Anasarfeen123/AmazeUI` if ever needed) until the user says the redesign is
   done. No push, PR, issue or comment on `AmazeContinuityProjects/*`, and **no
   `npm publish`** of `@amazecontinuityprojects/amazeui`. Push with
   `git push fork redesign` (`branch.redesign.pushRemote` is already `fork`).
2. **Never put the user's VTOP credentials** in the repo, a commit, a log, a
   screenshot you share, or a chat message. See §6.3 for the safe way.
3. **Colours only through tokens** (`src/app/brand.css`). No raw hex in
   components. Run `python3 scripts/redesign/contrast.py` after any colour change.
4. **Tests:** `tsc` 0 errors; `vitest` must stay at **28 failures** (the
   pre-existing baseline, §6.2); `eslint` 0 errors on touched files.
5. **One commit per logical change** with a body: why, what, how it was
   verified. Commit messages end with the session line if your tool adds one.
6. Ask the user before: changing the visual direction, deleting a feature,
   anything outside the fork.

## 1. Why this exists

Reviewer feedback on the web app (quoted by the user):

> "The thing is it looks cluttered coz it is vibe coded. But the way the back
> button is placed, page shells, primitives were all done perfectly. It's just
> I got too impatient as there are too many screens to refactor in web app."

Goal: a **branded, consumer-grade** app that stands out and is easy to use on
**phone, tablet and desktop**. Keep what works (back button placement,
`PageShell`, primitives, navigation structure) and fix the clutter.

## 2. The look (decided by the user — follow it)

### 2.1 Direction

**Friendly Brutalist**, matched to the user's two reference mocks (an
"ON-DUTY HOURS" screen in light and in dark, shared 2026-11-19):

- Light: paper page `#F7F1E6`, cream cards, **thick ink edges** (`#001E1D`),
  **big hard shadows**, a **teal card with an ochre number**, an **ochre card
  with ink text**, sage chips. Space Mono everywhere for titles, numbers and
  labels; uppercase short labels; `//` separators in metadata
  (`REF: OD-8821 // 3 COURSES`).
- Dark: **obsidian teal** page `#001E1D`, mid-teal cards `#002B29`, bright
  teal edges `#3F8F84`, near-black hard shadows, ochre `#F9BC60` hero cards
  and primary buttons, sage `#ABD1C6` chips, coral danger.
- Vibrancy comes from **solid fills** (ochre/teal/sage cards and chips), not
  from a colourful page.

Rejected along the way (do not bring back): soft "organic" grey/indigo look,
accent-colour picker, glass cards, neutral-black dark, warm/brown dark, the
`~/Downloads/AmazeCC Design Directions.html` file ("We are ignoring other
designs"), centred empty hero screens, emoji.

### 2.2 Specific user rules

| Topic          | Rule                                                                                                                                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Themes         | One brand, light + dark only. Accent palettes and "Card look" removed.                                                                                                                                                            |
| Sidebar        | Solid **teal panel** in both themes; ochre active item, ochre group labels, sage icons (`.brand-sidebar` in `brand.css`).                                                                                                         |
| Icons          | **Navigation keeps icons + labels** (sidebar, bottom bar, rail). **Content avoids decorative icons**: no icon wells, no icons before facts, no emoji. Universal controls keep theirs (close, back, search, chevron, sync, theme). |
| Shadows        | Hard, zero blur, **3 / 5 / 7 px** (`shadow-brutal-sm/md/lg`). Must be visible in dark.                                                                                                                                            |
| Badges/buttons | Never tiny or pill-round: 6px radius badges, 10px buttons, 44px tap targets, min 12px text. Stat-card badges hidden on phones.                                                                                                    |
| Contrast       | Text >= 4.5:1, edges >= 3:1, both themes (`contrast.py`).                                                                                                                                                                         |
| Clutter        | One loud thing per card; words not colour alone; drop noise (e.g. faculty employee IDs on class cards).                                                                                                                           |
| Dropdowns      | Must open at the field (no fly-in), size to content, small chevron.                                                                                                                                                               |
| Motion         | Short and flat (≈150–200ms, no springs/bounce/blur); respect reduced motion.                                                                                                                                                      |

### 2.3 Tokens and type (source of truth: `src/app/brand.css`)

| Role                        | Light                                                          | Dark                 |
| --------------------------- | -------------------------------------------------------------- | -------------------- |
| page `--background`         | `#F7F1E6`                                                      | `#001E1D`            |
| card `--surface`            | `#FFFDF8`                                                      | `#002B29`            |
| inset `--surface-secondary` | `#EFE7D8`                                                      | `#003A37`            |
| text `--text-primary`       | `#001E1D`                                                      | `#F2ECE0`            |
| muted `--text-muted`        | `#4A5F5C`                                                      | `#8FB5AA`            |
| edge `--border-ink`         | `#001E1D`                                                      | `#3F8F84`            |
| shadow `--shadow-ink`       | `#001E1D`                                                      | `#000807`            |
| `--primary` (+fg)           | `#004643` / paper                                              | `#F9BC60` / obsidian |
| `--secondary` sage (+fg)    | `#ABD1C6` / ink                                                | `#ABD1C6` / obsidian |
| `--highlight` ochre (+fg)   | `#F9BC60` / ink                                                | same                 |
| `--hero-number`             | `#004643`                                                      | `#F9BC60`            |
| danger / warning / success  | `--danger*`, `--warning*`, `--success*` (surface + foreground) |                      |

Tailwind names: `bg-surface`, `text-text-muted`, `border-border-ink`,
`bg-secondary text-secondary-foreground`, `bg-highlight text-highlight-foreground`,
`text-hero`, `shadow-brutal-md`, `font-display`, `font-mono`; fixed brand
colours `bg-teal`, `text-cream`, `bg-ochre`, `bg-sage`.

Fonts (`src/app/layout.tsx`): **Space Mono** 400/700 = `--font-display` and
`--font-mono` (titles, numbers, labels); Space Grotesk = fallback; Geist = body.

Utilities in `brand.css`: `.brutal-card` (+ `.brutal-card-hero` 3px edge),
`.brutal-press` (lift on hover, sink on press), `.brutal-label`,
`.theme-switching` (pauses transitions during light/dark swap), and a rule that
**text inside a sage/ochre/primary fill takes that fill's ink** (fixes
unreadable selected tiles everywhere).

Bridges (so unconverted screens already look on-brand): `zinc/gray/slate-*`
map to the semantic tokens (AmazeUI + `globals.css`), `indigo/blue/sky/
violet/purple-*` map to a teal `brand-*` scale, every `shadow-*` step is a
hard offset, `rounded-2xl/3xl` are 14/20px. These are a crutch: converted
screens should use semantic names directly.

## 3. What is done (branch `redesign`, from `origin/main` `e995bfd8`)

| Commit     | What                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ccd0b78f` | Logo set from `LOGOs.zip` → `public/brand/`; favicons, PWA + maskable icons, manifests; `brand.css` tokens; mobile zoom back to 100%.                                                                                                                                                 |
| `f0fb30e2` | This handoff + screenshot scripts.                                                                                                                                                                                                                                                    |
| `e3421ae5` | Accent palette + card-look removed (settings keys kept, deprecated); `uiTokens.ts` and all `shared/primitives` restyled; `BrandBackButton` (ochre, labelled) used by `PageShell` (`backLabel` prop).                                                                                  |
| `86036381` | App shell: docked full-height sidebar, tablet (768–1023px) shows the rail by default, labelled bottom nav, ochre demo banner, brand page background.                                                                                                                                  |
| `50e4d4b2` | Home decluttered (5 rainbow buttons → one Quick actions grid); `scripts/redesign/brandify.py` codemod.                                                                                                                                                                                |
| `402bf52f` | Theme-switch fix, short motion + `MotionConfig`, `OptionPicker` rewrite (positioning, size, chevron, phone sheet), `BrandSheet` for the Modules sheet, sync pill, week strip squares, Home exam card, onboarding themed, **fresher hub only for first-years** (`src/lib/fresher.ts`). |
| `93c0b23e` | Dark = reference mock; `StatTile variant="highlight"/"primary"`; fill-ink rule; first-sync + welcome screens rebuilt; onboarding emoji/icons removed; sidebar header + semester KPI cells.                                                                                            |
| `0562228f` | Space Mono; shadows 3/5/7; teal sidebar both themes; nav icons restored; Fresher hub restyled.                                                                                                                                                                                        |
| `31056458` | Stat-card badges hidden on phones.                                                                                                                                                                                                                                                    |
| `3582347c` | Faculty employee IDs removed from Home class cards.                                                                                                                                                                                                                                   |

Screens fully restyled by hand: **Home, course side card, app shell (sidebar, bottom nav, rail,
demo banner), Modules sheet, sync pill, first-sync + welcome screens, Fresher
hub, shared primitives, dropdowns.** Partly (codemod only): sync sheet,
onboarding steps. Everything else rides the bridges.

Before/after images: `docs/redesign/screens/` (`live-before-*` = amazecc.com
on 2026-11-18; `p9-*` = latest).

## 4. Known bugs (also on amazecc.com unless noted)

1. **Demo data disappears after a reload.** Enter demo, reload: Home shows
   "0 of 0 attended", Attendance is an empty page. Likely the restored semester
   id (`config.json` current term) does not match the demo's `CH20252605`.
   Screenshots therefore use `NO_RELOAD=1`.
2. **Attendance page is blank in demo after reload** (same cause as 1).
3. `frontend/src/lib/posthog.ts` calls a non-existent `/support/identity-hash`
   (from the old handoff).
4. Some classes in older files are broken strings like `text-sidebar-foreground/`
   or `group-text-primary` (left by an earlier bulk edit). They do nothing;
   remove when touching those files.

## 5. What to do next (in order)

Each item: restyle by hand where noted, run `brandify.py` on the files, check
phone/tablet/desktop in light and dark, keep tests at 28, commit, push.

### 5.1 Landing page (user asked, high priority)

Files: `components/custom/app/GuestExperience.tsx` (hero + top nav, 225 lines),
`components/custom/landing/LandingSections.tsx` (831 lines: `sec-problem`,
`sec-features` with `Tilt3DCard`, `sec-timeline`, `sec-roadmap`, `sec-faq`).
Live today (`docs/redesign/screens/live-before-*`): purple gradient headline,
indigo buttons, a hero that fills only the top third, empty space below,
generic stats row (30+ / 10+ / 100%).

- Hero: logo lockup ("AmazeCC — Your campus companion"), a display headline in
  Space Mono uppercase, one sentence, **primary "Try the demo"** + secondary
  "Sign in with VTOP", trust line ("Your password never leaves this device").
- Show the product: a real phone + desktop screenshot of Home (brand
  version) framed in ink-edged cards with hard shadows, not abstract art.
- Features: replace 3D-tilt cards with a grid of brutal cards, each a real
  mini UI (attendance card with the 75% line, timetable day, OD hours,
  FFCS planner), one line of copy, no icon wells.
- Proof: real numbers if available (students, syncs), otherwise drop the row.
- Problem/timeline/roadmap/FAQ: keep content, restyle (mono labels, `//`
  metadata, accordion FAQ with 44px rows), cut length.
- Top nav: logo, 3–4 anchors, theme toggle, Try demo, Get started; becomes a
  menu sheet on phones. Footer with links, privacy, terms.
- Must look right at 360px, 768px, 1440px; no horizontal scroll.

### 5.2 Onboarding steps

`components/custom/onboarding/AmazeOnboardingFlow.tsx` (themed, but layout
is weak): on desktop the left column is empty under the title; step dots are
tiny; selected tiles need the brand "selected" look (sage fill + ink edge +
shadow); toggles use the shared `Switch`; one primary button per step.

### 5.3 Search / command palette

`components/custom/palette/*` (~130 off-spec classes) and the sidebar search
button: brand input, results as list rows with mono group labels, keyboard
hints as 6px badges, phone version as a full-height sheet.

### 5.4 Attendance (user priority screen)

`components/custom/attendance/*` (~530 off-spec). Follow the reference mock
style: course list with %, a bar that marks 75%, "attend next N / can skip N"
in words; detail page with big %, a plain sentence, what-if tiles, recent
classes with Present/Absent badges. Fix bug 4.2 first so it can be checked.

### 5.5 Remaining screens (codemod + hand polish), biggest first

Off-spec class count on 2026-11-19 (9,805 in 216 files):

| Area                                                                                         | Count  | Notes                              |
| -------------------------------------------------------------------------------------------- | ------ | ---------------------------------- |
| `exams/` (FFCS planner, curriculum, course detail, marks)                                    | 3,463  | `FFCSGuidedSelector.tsx` alone 887 |
| `header/` (ProfilePage 572, settings)                                                        | 750    |                                    |
| `hostel/`                                                                                    | 628    | Leave, laundry, mess               |
| `attendance/`                                                                                | 531    | §5.4                               |
| `social/`                                                                                    | 490    |                                    |
| `tasks/`                                                                                     | 479    | `TaskEditSheet`                    |
| `app/` (`useAppCommands` 344)                                                                | 427    | palette commands                   |
| `shared/` (sync sheet, SyncModeEditor)                                                       | 417    |                                    |
| `app/friend-finder`, `friendfinder/`                                                         | ~490   |                                    |
| `feedback/` (FeedbackReportPage 244)                                                         | 286    |                                    |
| `timetable/`, `libraries/`, `tools/`, `clubs/`, `profile/`, `events/`, `qbank/`, legal pages | ~1,300 |                                    |

Recount with:

```bash
P='\b(zinc|gray|slate|neutral|indigo|violet|purple|blue|sky)-[0-9]{2,3}\b|text-\[(9|10|10\.5|11)px\]|bg-gradient|backdrop-blur'
grep -rEo "$P" src --include=*.tsx | cut -d: -f1 | sort | uniq -c | sort -rn | head -30
```

### 5.6 Later / nice to have

- **"Super dark" (blackish / AMOLED) theme** — user request 2026-11-19, as an
  _extra_ option next to Light and Dark, not a replacement for the obsidian
  teal dark. Near-black page (`#000` or `#050606`), cards `#0D1010`, edges a
  bright teal or ochre so the brutalist borders still read, same ochre/sage
  fills, shadows in a visible colour (black shadows vanish on black — use
  the edge colour or a deep teal block). Implement as a third class
  (`.black` on `<html>` next to `.dark`, sharing `dark:` variants) plus a
  third option in the theme switch (sidebar footer, Modules sheet, settings).
  Run `contrast.py` with a `.black` block added.

- Uppercase display titles on cards like the mock (Home class titles,
  section titles); check line length on phones first.
- Move the brand layer into AmazeUI (`ui/src/tailwind.css`, BackButton,
  AppLibrary→BrandSheet, Sidebar classes) once the user allows publishing.
- Rewrite `frontend/design/*.md` (still the old "organic" language) from §2.
- Remove the bridges in `brand.css`/`globals.css` once screens use tokens.
- Fix the demo reload bug (4.1) and make the demo data current-term.
- Decide whether faculty IDs should also go from Faculty Schedule / FFCS.
- Accessibility pass: keyboard focus order in the sidebar and sheets,
  `aria-current` everywhere, reduced-motion check on every screen.

## 6. How to work

### 6.1 Environment

- `pnpm` is not installed; use `node_modules/.bin/*`. `frontend/node_modules`
  is a real directory now.
- Husky's pre-commit calls `pnpm`; run `node_modules/.bin/lint-staged`
  (prettier) yourself, then `git -c core.hooksPath=/dev/null commit …`.
- This Next.js has breaking changes: read `node_modules/next/dist/docs/`
  before writing Next-specific code (see `frontend/AGENTS.md`).
- `strict: false` in tsconfig; `noUnusedLocals` on (remove unused icon
  imports when you delete icons).

```bash
cd frontend
node_modules/.bin/tsc --noEmit -p tsconfig.json
node_modules/.bin/vitest run            # expect: 28 failed
node_modules/.bin/eslint <files>
python3 scripts/redesign/contrast.py    # exit 0 = all pairs pass
python3 scripts/redesign/brandify.py <files> [--status] [--forced-dark] [--dry]
```

### 6.2 Test baseline

28 failures in 11 files, all pre-existing on `main`: `oauth2`,
`ffcsClassmates` ×2, `ffcsTab.render`, `social-*` ×6,
`syncNotificationRedesign`. When a redesign change breaks a test that pins an
old class name, update the test to the new class and keep its intent (see
`weekStrip.test.ts`, `optionPicker.test.tsx` for examples).

### 6.3 Seeing the app

```bash
NEXT_TELEMETRY_DISABLED=1 node_modules/.bin/next dev --webpack -p 3017   # background
```

- Use **`http://localhost:3017`**, not 127.0.0.1 (dev chunks are blocked
  there and the page never hydrates).
- `scripts/redesign/shot.mjs` drives headless Chromium:
  `node shot.mjs <outPrefix> [navLabel] [light|dark]` → `-phone/-tablet/-desktop.png`
  (390 / 820 / 1440 px). Env: `NO_RELOAD=1` (keep demo data), `ONLY_PHONE=1`,
  `ONLY_DESKTOP=1`, `PRE_W=390` (set width before clicking, for the bottom
  nav), `ONBOARD=1` (stop at onboarding), `NAV_WAIT`, `TEXT_LEN`,
  `BASE=https://amazecc.com` (live site), `FULL=1` (full-length phone).
- **Real VTOP account (user's own):** `LOGIN=1` makes the script sign in with
  `AMAZECC_VTOP_USER` / `AMAZECC_VTOP_PASS` read from
  `~/.config/amazecc/vtop.env` (chmod 600, outside the repo). The user creates
  that file themselves; agents must not ask for the password in chat, print
  it, or copy it anywhere. The Chromium profile is deleted after each run.
  Screenshots from a real account contain personal data: keep them in
  `amaze-workspace/.scratch/`, never commit them.
- `fullpage.mjs <url> <out.png>` captures a page viewport by viewport.

### 6.4 Code map

- Tokens/utilities: `src/app/brand.css` (imported by `globals.css` line 2).
- Shared class strings: `src/lib/uiTokens.ts` (`TILE`, `LIST_SHELL`, `CHIP`,
  `ICON_BUTTON`, `TONE_BADGE`, `TONE_TEXT`, …).
- Primitives: `src/components/custom/shared/primitives/` (`PageShell`,
  `TitleBlock`, `Surfaces` = `StatTile`/`SectionHeader`/`MiniBar`/`KeyValue`,
  `Controls`, `Feedback`, `OptionPicker`, `SelectField`, `Switch`,
  `BrandBackButton`, `BrandSheet`).
- Shell: `components/custom/Dashboard.tsx`, `header/NavigationTabs.tsx`
  (sidebar, rail, bottom nav; `SIDEBAR_ITEM_BRAND`), `app/AuthenticatedWorkspace.tsx`
  (demo banner), `header/AppLibraryPortal.tsx` (Modules sheet).
- Home: `components/custom/mobile/SimplifiedMobileHome.tsx`; week strip
  tokens `src/lib/weekStrip.ts`.
- Sync UI: `shared/SyncNotification.tsx` (pill + sheet),
  `onboarding/OnboardingIntro.tsx` (`SyncFace`, `WelcomeFace`, sign-in).
- Theme switch: `components/custom/ThemeToggle.tsx`
  (`animateThemeCircularExpansion`).
- Fresher rule: `src/lib/fresher.ts`, used in
  `dashboard/useDashboardWelcomeState.ts`.

### 6.5 Assets

- Logos: `public/brand/` (`icon-primary.svg`, `icon-small.svg`, `glyph.svg`,
  `lockup.svg`, light/dark/mono/outline, maskable PNGs). Source zip:
  `amaze-workspace/LOGOs.zip`.
- The older `AmazeCC-Vector-Identity-v2.zip` is superseded.

## 7. Progress log

- **2026-11-18** — Decisions taken; branch created; logos + tokens (P0/P1).
- **2026-11-19** — Primitives, shell, Home, dark palette rounds, dropdowns,
  Modules, sync UI, onboarding/welcome, fresher fix, reference-mock match,
  teal sidebar, Space Mono, nav icons back, phone stat badges hidden,
  faculty IDs removed. Handoff rewritten; landing page added to §5.1;
  safe real-account screenshots added (§6.3).
  **Next: §5.1 landing page.**
