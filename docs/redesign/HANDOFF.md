# AmazeCC redesign — handoff

**Read this whole file before you change anything.** It is written so any
agent (Claude, Codex, Gemini, Cursor…) can continue without the chat history.

- Canonical copy: `frontend/docs/redesign/HANDOFF.md` on branch **`redesign`**
  of the fork **`Anasarfeen123/AmazeCC`**. `amaze-workspace/REDESIGN_HANDOFF.md`
  is a symlink to it.
- Older, unrelated backlog (the 60 code-review items, environment notes):
  `amaze-workspace/HANDOFF.md`. Read its §3 (environment) and §4 (conventions).
- Last updated: **2026-11-19**, after commit `dca47d84`.
- Start here: [README.md](README.md) (index) → this file → [ROADMAP.md](ROADMAP.md).

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
4. **Tests:** `tsc` 0 errors; `vitest` must stay at **15 failures** (the
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

### 2.3 Tokens, type, components

Documented in **`frontend/design/`** (README, DESIGN_LANGUAGE, COLORS,
TYPOGRAPHY, COMPONENTS, NAVIGATION, AI_CONTRIBUTOR_GUIDE). Source of truth
for values: `src/app/brand.css`. Shared classes: `src/lib/uiTokens.ts`.
Primitives: `src/components/custom/shared/primitives/`.

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

Screens fully restyled by hand: **Home, course side card, spotlight search, Paper Scanner (partly), app shell (sidebar, bottom nav, rail,
demo banner), Modules sheet, sync pill, first-sync + welcome screens, Fresher
hub, shared primitives, dropdowns.** Partly (codemod only): sync sheet,
onboarding steps. Everything else rides the bridges.

Before/after images: `docs/redesign/screens/` (`live-before-*` = amazecc.com
on 2026-11-18; `p9-*` = latest).

## 4. Known bugs (also on amazecc.com unless noted)

1. ~~Demo data disappears after a reload~~ — fixed (ROADMAP R5): demo data
   was only ever set in memory; bootstrap now reloads it.
2. ~~Attendance page blank in demo after reload~~ — same fix.
3. `frontend/src/lib/posthog.ts` calls a non-existent `/support/identity-hash`
   (from the old handoff).
4. Some classes in older files are broken strings like `text-sidebar-foreground/`
   or `group-text-primary` (left by an earlier bulk edit). They do nothing;
   remove when touching those files.

## 5. What to do next

The backlog lives in **[ROADMAP.md](ROADMAP.md)**: items in priority order
(landing page, FFCS bugs, Attendance, onboarding, demo reload bug, remaining
screens, super-dark theme, …), each with files and a "Done when" checklist.
Update its status table when you finish something.

Recount the old-style classes left in screens:

```bash
P='\b(zinc|gray|slate|neutral|indigo|violet|purple|blue|sky)-[0-9]{2,3}\b|text-\[(9|10|10\.5|11)px\]|bg-gradient|backdrop-blur'
grep -rEo "$P" src --include=*.tsx | cut -d: -f1 | sort | uniq -c | sort -rn | head -30
```

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
node_modules/.bin/vitest run            # expect: 20 failed
node_modules/.bin/eslint <files>
python3 scripts/redesign/contrast.py    # exit 0 = all pairs pass
python3 scripts/redesign/brandify.py <files> [--status] [--forced-dark] [--dry]
```

### 6.2 Test baseline

15 failures in 11 files, all pre-existing on `main`: `oauth2`,
`ffcsClassmates` ×2, `social-*` ×6,
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
- `LOGIN=1` was verified on 2026-11-19 (sign-in + first sync ~2 min). Known
  limit: the `navLabel` argument clicks the first element whose text matches,
  so "Attendance" hits the Home stat card label, not the sidebar link; make
  it prefer `[data-sidebar-nav]` / bottom-nav buttons before relying on it.
- `fullpage.mjs <url> <out.png> [width] [scale]` captures a page viewport by
  viewport (`THEME=light|dark` emulates the OS, `LS_THEME=light|dark` forces the
  app theme). `console.mjs <url>` prints console errors and exceptions.

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
  faculty IDs removed. Handoff rewritten; landing page added to the backlog (now ROADMAP R1);
  safe real-account screenshots added (§6.3).
  **Next: ROADMAP R1 (landing page), then R2 (FFCS).**
- **2026-11-19 (later)** — Real-account review (`LOGIN=1`), name helpers,
  spotlight rebuild, brand Button, Paper Scanner, KPI overflow, FFCS task
  written up; docs split into README / HANDOFF / ROADMAP and
  `frontend/design/*` rewritten for the brand (the old files described the
  pre-redesign "organic" look and would have misled agents).
- **2026-11-19 (evening)** — FFCS: debounced search, simpler header, course
  palette, new-tab opening, standalone brand top bar and margins. Sign-in
  screen rebuilt (invisible second headline line fixed, teal Amaze ID panel,
  colour chips). Dark mode livelier: success/danger badges are solid
  mint/coral in dark (`uiTokens` TONE_BADGE / TONE_ICON_TILE). Payments
  (mint/coral fee card, SegmentedControl) and the grades sheet (one colour per
  grade) restyled. R4 mostly done (step list, progress bar, headers).
  **Next: R4 toggles/tiles, then more dark-mode colour on remaining screens
  (R6), R2 leftovers.**
- **2026-11-19 (night)** — Dark-mode colour pass. Patterns to reuse:
  `summary-row` on a page's two-card summary grid makes the first card the
  ochre hero (brand.css); old solid blue/indigo/violet/purple fills become
  the primary fill in dark (brand.css override + `brandify.py` rules);
  status text inside sage/ochre/primary fills takes the fill's ink. Done:
  R4 (Switch toggles, ink tiles), grades sheet (visible bars, legend),
  Academics course list (score blocks by band, type badges), Super Calendar
  (solid holiday cells), sidebar header fit. `shot.mjs` now has
  `CLICK_TEXTS="Open Campus menu|Payments"` (+ `DEBUG_CLICK=1`); use
  `PRE_W=1440` for sidebar-only triggers. Known: Attendance and Timetable
  Calendar sidebar items both light up on the calendar page.
  **Next: icon wells in hub lists (Libraries, Curriculum, Grade history),
  Curriculum progress bar (raw green/orange), R2 leftovers, R6.**
- **2026-11-19 (late)** — R6 mechanical pass finished (all files). Before
  running `brandify.py` again, note: if it reports 0 rewrites on a file
  with old classes, use `brandify_classnames.py` (nested template
  literals). Three codemod bugs were fixed (`\b` matching after "-",
  bare `group-` from scale removal, unguarded `bg-zinc-50` matching
  `bg-zinc-500/10`); grep for `group-text-`, `bare group-` and
  `secondary0` if you see odd classes. Don't run it on always-dark
  overlays without `--forced-dark`.
  **Next: hand pass on the screens not yet looked at (Tasks, Social,
  Friend finder, Cab share, Event/Club hub with live data), R2 leftovers.**
- **2026-11-19 (night)** — R7 Night theme (was "Black"; renamed at the
  user's request), R2 FFCS done (top bar/logo fixes, stale classmates
  tests: baseline 20 -> 15), R6 hand pass (bare badges, emoji), R11
  (focus trap, named controls, reduced motion, A11Y probe), error pages
  (ErrorScreen), sidebar collapsed/expanded share one layout, Settings
  reworked (one place per setting: Sync Modes is a drill-down of Sync;
  Grades Anonymizer folded into Privacy Mode; honest names). R8 decided
  no. **Next: R3 attendance polish (predictor, OD tracker), R11 manual
  keyboard/zoom walk, R10 bridges, R9 only with the user's OK.**
- **2026-11-19 (late night)** — R3: predictor "Now 0.0%" bug fixed
  (`summarisePredictionRows`, tested), course rows show name + status
  colour, target picker out of the header; OD tracker cleaned. R10: 210
  standalone legacy classes mapped (91 left, mostly scanner/camera
  overlays). Legal pages rewritten to match the code (`legal/LegalLayout`;
  sources listed at the top of `app/privacy/page.tsx`) — **needs the
  project owner's review before release**. Settings/About: false "nothing
  leaves your phone" credentials note fixed, avatar initials, duplicate
  rows removed, brand About hero. Feedback page: vendor name "PostHog"
  removed from student-facing text.
  **Next: R11 keyboard/zoom walk, the last 91 legacy classes, R9 only
  with the user's OK.**
- **2026-11-19 (end of session)** — Done: sidebar stats go 2x2 with CGPA
  shown; R10 complete (11 old classes left, scanner only); hidden values use
  a text comic "#@%!" cover instead of blur (see `PRIVACY_MODE.md`). Last
  check before commit: comic cover screenshot was still running; verify the
  look on Home + sidebar (light/dark) with
  `PRE_JS='const s=JSON.parse(localStorage.settings||"{}");s.showGpa=true;s.CGPAHidden=true;s.privacyMode=true;localStorage.settings=JSON.stringify(s)' PRE_W=1440 ONLY_DESKTOP=1 node scripts/redesign/shot.mjs out / light`.
  **Next, in order:** (1) check/tune the comic cover; (2) per-category
  privacy (`docs/redesign/PRIVACY_MODE.md`); (3) R11 manual keyboard walk
  (Tab through sidebar, spotlight, sheets) and 200% zoom (set
  `deviceScaleFactor`/CSS zoom in shot.mjs, check overlap at 1440/2 = 720);
  (4) owner review of /privacy and /terms; (5) R9 only with the user's OK.
- **2026-11-19 (follow-up)** — Comic cover checked and hardened so legacy
  colour utilities cannot reveal its value. Per-category privacy is complete:
  master Privacy mode, category toggles, Comic/Marker picker, safe legacy
  reads and typed value tags. Privacy off now always reveals every value.
  R11 core keyboard walk completed for the sidebar and spotlight; Home has no
  overlap at the 200%-equivalent 720px viewport. `shot.mjs KEY_WALK=N` and
  `ONLY_ZOOM=1` make both checks repeatable. The specialised dialog follow-up
  remains. **Next: owner review of /privacy and /terms; R9 only with user OK.**
- **2026-11-19 (sidebar/settings follow-up)** — Privacy controls were condensed
  to one multi-select disclosure; the Cover style remains a compact picker.
  Fixed a CSS bug where grawlix variants appended to values even with Privacy
  mode off. Sidebar attendance now honours Decimal Values; sidebar stat cards
  stagger in/out during expand/collapse and the profile footer/avatar uses a
  shared layout transition between the full sidebar and rail. Commits:
  `99187053`, `3237d906`, `0217361d`, `b694003f`, `1df957c0` (all pushed to
  `fork/redesign`). **Still next: owner review of /privacy and /terms; R9 only
  with user OK.**
