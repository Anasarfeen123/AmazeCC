# AmazeCC redesign — handoff

Canonical location: `frontend/docs/redesign/HANDOFF.md` on branch `redesign`
(fork `Anasarfeen123/AmazeCC`). `amaze-workspace/REDESIGN_HANDOFF.md` is a
symlink to it.

Started 2026-11-18. Keep this file current: any agent (Claude, Codex, Gemini…)
should be able to pick up from here. Update the **Progress log** at the end of
every work session. `HANDOFF.md` (same folder) covers the older 60-item
backlog and the environment setup; read its sections 3–4 too.

---

## 1. Why

Reviewer feedback on the web app:

> "The thing is it looks cluttered coz it is vibe coded. But the way the back
> button is placed, page shells, primitives were all done perfectly. It's just
> I got too impatient as there are too many screens to refactor in web app."

Goal: pivot to a **branded, consumer-grade** look that stands out and is easy
to use on **phone, tablet and desktop**. Keep what works (back button, PageShell,
primitives) and tighten everything around it.

> **HARD RULE (user, 2026-11-18): work only on the fork `Anasarfeen123/AmazeCC`
> (and `Anasarfeen123/AmazeUI`) until the redesign is properly built.** Nothing
> to `AmazeContinuityProjects/*`: no pushes to `origin`, no PRs against the org
> repos, no comments there, and **no npm publish of
> `@amazecontinuityprojects/amazeui`**. Push with `git push fork redesign`
> (`branch.redesign.pushRemote` is set to `fork`). Any PR is fork-internal
> (`Anasarfeen123/AmazeCC` redesign → its own main/feature branch), and only
> when the user asks.

## 2. Decisions (made by the user, 2026-11-18)

| Question                                                                             | Decision                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Visual direction                                                                     | **Friendly Brutalist** spec (see §4). Replaces `frontend/design/DESIGN_LANGUAGE.md` "soft organic".        |
| Accent themes (Ocean/Forest/Lavender/Sunset/custom) and "Card look" (glass vs solid) | **Drop them.** One brand look, light + dark only.                                                          |
| Branch                                                                               | New branch **`redesign`** (frontend; same name in ui when touched), on the **fork only**. Not `anas-work`. |
| Priority screens after foundation + app shell                                        | **Home / dashboard**, then **Attendance**.                                                                 |
| Logos                                                                                | Use the new logo set from `LOGOs.zip` (user, mid-session: "Use the logos from the zip files").             |

Note: PR #181 (`anas-work` → `feat/anas`) was **merged** on 2026-11-10 and
`anas-work` was reset to `origin/main`. `redesign` branches from `origin/main`
at `e995bfd8`. Main has since gained "modernize UI with Radix primitives"
(`a3b0f611`), so others are also touching UI; rebase often.

### Later direction from the user (2026-11-19) — these override the spec

- **Dark mode = the user's reference mock** (obsidian teal #001E1D page,
  mid-teal cards, bright teal edges, ochre hero cards/buttons, sage chips,
  coral danger, hard black shadows): "vibrant but perfect for dark mode".
  Neutral-black and warm-charcoal versions were tried and rejected (bland).
  Light mode gets the same vibrancy (paper, teal ink, ochre + sage fills). Tokens in `src/app/brand.css` `.dark`; check with
  `python3 scripts/redesign/contrast.py` after any colour change.
- **Icons: fewer, not none.** No decorative icon wells, emojis, or icons in
  front of facts in content. BUT navigation keeps icons next to labels
  (user: "Add icons in sidebars and bottom bar, its all too text"): sidebar
  items, bottom bar, rail, plus universal controls (close, back, search,
  chevron, sync, theme).
- **Reference mocks are the target** (user's images, 2026-11-19, light and
  dark "ON-DUTY HOURS" screens): Space Mono bold titles/numbers, Space Mono
  labels, cream cards with thick ink edge + big hard shadow, teal card with
  ochre number, ochre card with ink text, sage chips. Fonts in layout.tsx /
  brand.css (`--font-display`, `--font-mono`).
- **Sidebar is a solid teal panel** (`.brand-sidebar` in brand.css redefines
  the tokens inside it); active item ochre, group labels ochre, icons sage.
- Shadows are 3/5/7px (user: make them bigger, they were hidden in dark).
- Colours must not go "too light or too dark" for text and icon wells: keep
  every pair passing contrast.py.
- Fix list given so far: dropdowns (done: positioning, size, chevron),
  onboarding (themed; full redesign pending), dark mode, theme switch
  animation (done), animations (done), badges/buttons too small or too round
  (done in shared tokens + Home), Modules sheet (done), sync popup (pill
  done; welcome + first-sync screens pending), fresher hub shown to seniors
  (fixed; hub page look pending), Home exam card (done).

## 3. Source material (all on the user's disk)

| What                                | Where                                                                                                                                                                                                                                   | Status                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Brutalist spec (authoritative look) | skill `amazecc-brutalist-ui` (`~/.claude/skills/synced/*/amazecc-brutalist-ui/SKILL.md`, dated 2026-11-18). Mentions `design/BRUTALIST_SPEC.md` + `tokens.css`; **those files do not exist yet** — the token table in §4 is the source. | newest                  |
| Logo set (final)                    | `amaze-workspace/LOGOs.zip` (= `~/Downloads/LOGOs.zip`, 2026-11-10 18:40): `amazecc-01-primary.svg` … `09-small-size.svg`, `amazecc-primary-512.png`. Extracted copy: `amaze-workspace/.scratch/logos/`.                                | use this                |
| Older logo set                      | `~/Downloads/AmazeCC-Vector-Identity-v2.zip` (17:27 same day, simpler SVGs).                                                                                                                                                            | superseded by LOGOs.zip |
| ~~Design Directions~~               | `~/Downloads/AmazeCC Design Directions.html` (2026-11-08). **IGNORED — user, 2026-11-18: "We are ignoring other designs. We will be focusing fully on Brutalist."** Do not take layouts or tokens from it.                              | ignore                  |
| Current real design                 | the deployed app (see §8) — keep its structure (back button, PageShell, primitives, navigation) and restyle it to Brutalist.                                                                                                            | base                    |

Logo palette (from the SVGs): deep teal `#003A3A`/`#0E5A5E`/`#00141A`, cream
`#FFF8EC`, ochre `#FFC857`/`#FDB23B`, orange `#E66A2C`-ish. Tagline on the
lockup: **"Your Campus Companion"**. This matches the Brutalist palette.

## 4. The Brutalist spec (summary — the skill file is the full version)

Tokens (never raw colours, never `zinc/gray/slate/neutral/indigo-*` in components):

| Role              | Light             | Dark              |
| ----------------- | ----------------- | ----------------- |
| background        | #F7F1E6           | #001E1D           |
| surface/card      | #FFFDF8           | #002B29           |
| surface-secondary | #EFE7D8           | #003532           |
| text-primary      | #001E1D           | #F7F1E6           |
| text-muted        | #4A5F5C           | #8FB5AA           |
| border-ink        | #001E1D           | #4F8F86           |
| shadow-ink        | #001E1D           | #000A0A           |
| primary (+fg)     | #004643 / #F7F1E6 | #F9BC60 / #001E1D |
| secondary         | #ABD1C6           | #ABD1C6           |
| highlight         | #F9BC60           | #F9BC60           |
| hero-number       | #004643           | #F9BC60           |
| warning text      | #7A4F00           | #F9BC60           |
| danger            | #B3261E           | #FFB4A8           |

- Borders 2px ink on cards/buttons/chips/inputs/rows; 3px on hero cards + dialogs.
- Radius: badge 6, button/chip/input/row 10, card 14, dialog 20. Never 0.
- Shadows hard, 0 blur, bottom-right: sm 2px, md 4px, lg 6px in `--shadow-ink`. Only the outermost layer casts one.
- Banned on surfaces: blur shadows, glows, gradients, glass, `backdrop-blur` (logo art exempt).
- Type: Space Grotesk 700 for titles/hero numbers (page title 28/36px uppercase, hero number 40/56px); Geist 16px body; Geist Mono 13px 600 uppercase labels; min 12px anywhere; `//` metadata separators.
- Press: hover lift −1px + bigger shadow, active sink +2px (80ms), `.brutal-press`. Focus 3px ochre outline, 2px offset. 44px touch targets.
- Status never colour alone; badges always carry a word. One loud thing per card.
- Lint gate before finishing (run in `frontend/`):
  ```bash
  git diff --name-only | grep -E '\.(tsx|ts|css)$' | xargs grep -nE 'text-\[(9|10|11)px\]|\b(zinc|gray|slate|neutral|indigo)-[0-9]{2,3}\b|shadow-(sm|md|lg|xl|2xl)\b|backdrop-blur|bg-gradient|#[0-9a-fA-F]{6}' || echo clean
  ```

## 5. Layout approach

Base is the **current deployed app** (its screens, navigation, PageShell, back
button, primitives), restyled to the Brutalist spec and the logo palette, and
de-cluttered: one loud thing per card, fewer nested boxes, readable type
(no text under 12px), status always as words. Same destinations on phone,
tablet and desktop; layouts adapt (bottom nav on phone, sidebar on md+, which
is what exists today). No other design file is used.

## 6. Where the leverage is (code map)

The app is 364 `.tsx` files / ~122k lines with ~8,500 `zinc/gray/slate…` class
uses, ~1,400 `text-[9–11px]`, 75 `backdrop-blur`, 34 gradients. Hand-editing
every screen first is not feasible, so the plan works top-down:

1. **Tokens live in AmazeUI**: `ui/src/tailwind.css` defines `--background`, `--surface*`, `--text-*`, `--border-*`, `--primary`, status colours and maps `gray-*`/`slate-*` → `--neutral-*`. It ships verbatim as `@amazecontinuityprojects/amazeui/dist/tailwind.css`, which `frontend/src/app/globals.css` imports on line 1.
2. **frontend `globals.css`** maps `zinc-*` → `--neutral-*` too, plus odd steps (`zinc-455` …), border overrides, palette-repaint rules (`[data-color-palette]…`), `.card-surface`, scrollbars, animations.
3. **`frontend/src/lib/uiTokens.ts`**: shared class strings (`TILE`, `TILE_INTERACTIVE`, `LIST_SHELL`, `SECTION_CHIP`, `TONE_BADGE`, …). Changing these restyles every screen that uses them.
4. **Primitives**: `frontend/src/components/custom/shared/primitives/` (PageShell, Surfaces, Controls, Feedback, Subpage, TitleBlock, …).
5. **Accent palette code to remove**: `src/components/custom/app/useAppAppearance.ts` (repaints vars on `documentElement`, sets `data-color-palette`, `data-card-surface`), `header/ProfilePage.tsx` (~L379–430 palette picker, ~L1716, ~L1772 card-look toggle), `onboarding/AmazeOnboardingFlow.tsx` ~L609 palette step, `store/settingsAtoms.ts` (`colorPalette`, `customPalette`, `cardSurfaceZinc`).
6. **Shell**: `components/custom/Dashboard.tsx` (L265 content padding `md:pl-80`/`md:pl-24` for the sidebar), `dashboard/DashboardNavigator.tsx`, `header/NavigationTabs.tsx`, `mobile/SimplifiedMobileHome.tsx`, bottom nav class `mobile-bottom-nav-bar`.
7. **Fonts**: `src/app/layout.tsx` loads Geist, Geist Mono, DM Sans via `next/font/google`. Add Space Grotesk; DM Sans/`font-outfit` become the display font alias.
8. **Logos/icons**: `public/logo.png`, `public/favicon/*`, `public/manifest*.json`, `components/custom/IconUpdater.tsx`; logo also referenced in GuestExperience, NavigationTabs, AboutSection, Onboarding, ProfilePage, SimplifiedMobileHome, StudentReportPage.

## 7. Plan (phases)

- [~] **P0 Brand assets** — done in `ccd0b78f`: `public/brand/*`, favicons, PWA + maskable icons, `logo.png`, manifest colours. Still to do: one `<Logo variant>` component using `/brand/*.svg` (light/dark aware) and swap the remaining logo uses (§6.8); `manifest-fire.json` maskable entries.: copy LOGOs.zip set into `frontend/public/brand/`; regenerate favicons/PWA icons (`magick` is installed) from `amazecc-01-primary.svg`/`09-small-size.svg`; one `<Logo variant>` component; swap all logo uses; manifest `theme_color`/`background_color` to brand.
- [x] **P1 Tokens** — done in `ccd0b78f` (`src/app/brand.css`). Originally planned:: brand values in `ui/src/tailwind.css` (light + dark) + new vars `--border-ink`, `--shadow-ink`, `--highlight`, `--hero-number`, `--secondary` sage; utilities `shadow-brutal-sm|md|lg`, `.brutal-press`, ochre focus ring; remap zinc/gray/slate/indigo/blue/sky bridges to brand tokens so the whole app shifts at once. Because AmazeUI must not be published while we are fork-only, the brand tokens are written as **overrides in `frontend/src/app/globals.css`** (after the amazeui import) for now, and mirrored in `ui/src/tailwind.css` on the ui fork's `redesign` branch; move them into AmazeUI for real once the user approves going to the org.
- [ ] **P2 Remove accent palette + card look** (§6.5), keep light/dark.
- [ ] **P3 uiTokens + primitives** to spec (TILE → 2px ink border, 14px radius, hard shadow; chips/badges mono uppercase; PageShell title Space Grotesk; buttons `.brutal-press`).
- [ ] **P4 App shell** (bottom nav phone, sidebar md+, header) restyled + decluttered for phone / tablet / desktop.
- [ ] **P5 Home / dashboard** on phone, tablet, desktop.
- [ ] **P6 Attendance** list + detail.
- [ ] **P6b User's list (2026-11-19)** — "We need to work on the dropdowns,
  onboarding, dark modes color being so weirdly dark and clashing, animation
  switch from dark to light and vice versa, animations, badges/buttons being
  too small or too circular etc." Order taken: dark palette → theme-switch
  animation → motion → badge/button size + shape → dropdowns → onboarding.
- [ ] **P7+** remaining screens, one PR-sized group at a time; run the lint gate on each; update `frontend/design/*.md`.

## 8. How to see the app (verified working)

```bash
cd frontend
NEXT_TELEMETRY_DISABLED=1 node_modules/.bin/next dev --webpack -p 3017   # background
```

- Open **`http://localhost:3017`**, not `127.0.0.1` — on 127.0.0.1 Next dev blocks the dev chunks, the page never hydrates and buttons do nothing.
- Demo account: click "Try the demo". To skip onboarding on reload, set these localStorage keys to `"true"`: `has_selected_interface`, `introDone`, `hasSeenPushPrompt`, `push_prompt_dismissed`, `busPromptDismissed`.
- Screenshot script: `frontend/scripts/redesign/shot.mjs` (run it from any folder; set `BASE=https://amazecc.com` to shoot the live site) (`node shot.mjs <outPrefix> [path] [light|dark]` → `-phone/-tablet/-desktop.png` at 390/820/1440 px). `fullpage.mjs <url> <out.png>` captures a page viewport by viewport. Reference screenshots: `docs/redesign/screens/` (`live-before-*` = amazecc.com today, `p1-*` = after brand tokens).
- `frontend/node_modules` is now a real directory (no longer a symlink); `ui/` still has no `node_modules`.

## 8b. What the live site (amazecc.com) looks like today — problems to fix

Seen in demo mode 2026-11-18 (`docs/redesign/screens/live-before-*.png`):

- Old purple/indigo cap logo; indigo accents and a bright blue demo banner.
- Home stacks five full-width pastel buttons in different colours (timetable,
  free classrooms, faculty, classmates, report a bug): the main source of the
  "cluttered" look. Needs one quick-actions block in brand style.
- Desktop/tablet sidebar is a floating rounded panel; at 820px it takes ~250px
  and squeezes content. Sidebar has a semester summary box, search, Pinned,
  Study, Campus (8 items), Tools, Account: long and repetitive (Academics twice).
- Stat cards show "—" / "0 of 0 attended" in demo: demo data has no attendance
  for the current term, so empty states dominate. Fix demo data (or the term
  pick) so screenshots show real-looking numbers.
- Page bg is `bg-gray-50/50 dark:bg-black` in `Dashboard.tsx` (L265): pure
  black in dark mode, darker beige than spec in light.
- Most cards still use 1px borders and 24px radius (arbitrary `rounded-[24px]`).
- Fresher accounts (demo is one) see a "Fresher Onboarding Hub" first.

## 8c. Known bugs found during the redesign (also on amazecc.com)

- **Demo data disappears after a reload.** Enter demo, reload the page: Home
  shows "0 of 0 attended" and Attendance is an empty page. Without a reload
  the demo shows 9 courses (79%). Likely the restored semester id (Fall
  2026-27 from config) does not match the demo's `CH20252605`. The screenshot
  script therefore runs with `NO_RELOAD=1` (it sets the onboarding flags
  before clicking "Try the demo").

## 9. Test baseline on `redesign`

`vitest`: **28 failures in 11 files** (oauth2, ffcsClassmates ×2, ffcsTab.render,
social-* ×6, syncNotificationRedesign). They are on `main` already (the old
"44 failures" baseline in HANDOFF.md is from before main moved). A change is OK
if the count stays at 28. `tsc` must be 0.

Commit hook: `.husky/pre-commit` runs `pnpm exec lint-staged`, and pnpm is not
installed. Run `node_modules/.bin/lint-staged` by hand, then commit with
`git -c core.hooksPath=/dev/null commit …`.

## 10. Progress log

- **2026-11-18** — Read old HANDOFF, brutalist skill, design docs; measured scope; got the decisions in §2; created branch `redesign` (frontend, from `origin/main` e995bfd8, no commits yet); found the logos + Design Directions; got the dev server + demo screenshots working; baseline screenshots in `.scratch/before/`.
- **2026-11-18 (cont.)** — User: ignore Design Directions, Brutalist only, base = live app; fork-only rule. Captured amazecc.com (§8b). Commit `ccd0b78f` on `redesign`: P0 assets + P1 tokens. Moved this handoff + screenshot scripts into the repo; pushed `redesign` to `fork`.
  **Next step: P2** — remove the accent palette + card look (files in §6.5), then **P3** `src/lib/uiTokens.ts` (TILE → `border-2 border-[var(--border-ink)] rounded-[14px] shadow-brutal-md`, etc.) and primitives, then **P4** shell (`Dashboard.tsx` bg, sidebar, bottom nav, demo banner).
- **2026-11-19** — Commits `402bf52f` and the next one: dark palette (several rounds, now the reference mock), theme-switch fix, short motion, OptionPicker rewrite (no top-left fly-in, content-sized, em chevron, phone sheet), BrandSheet for Modules (one column), sync pill, first-sync + welcome screens rebuilt (no icons, word badges), onboarding themed + emojis/icons removed, global "text inside a sage/ochre/primary fill takes the fill's ink" rule (brand.css), fresher hub only for first-years (`src/lib/fresher.ts`), Home exam card, StatTile `variant` (highlight = ochre hero), sidebar header + semester KPIs, text-only expanded sidebar and bottom nav (rail keeps icons).
  **Next:** fresher hub page look (user screenshot: cluttered, pastel), onboarding steps layout (left column empty on desktop), sidebar footer/avatar ("photos"), search box/command palette, then Attendance (P6) and run `brandify.py` screen by screen (P7). Remember "avoid icons" + contrast.py.
- **2026-11-19 (late)** — Fresher hub restyled (brand header, ochre documents card, doc list sorted to-do/submitted/not-needed with word badges, no icons/emoji); Space Mono for display + mono; bigger shadows; teal sidebar; nav icons restored. Next: uppercase display titles on cards like the mock, onboarding step layout, command palette/search, Attendance (P6), then brandify the rest (P7).
