# Next steps for the next contributor (written 2026-11-19, end of session)

Read first: `HANDOFF.md` (rules, how to work), `ROADMAP.md` (status table),
`design/README.md`, `PRIVACY_MODE.md`. Fork only: `git push fork redesign`.
Test baseline: 15 failures (oauth2, social-* x6 files, syncNotificationRedesign).
Dev server: `node_modules/.bin/next dev --webpack -p 3017` (machine is low on
memory; close it when idle). Screenshots: `scripts/redesign/shot.mjs`
(options documented at the top of the file and in ROADMAP R12).

Every item says what to check on screen. Do not mark anything done without
light + dark captures at 390 and 1440 (and 820 where layout changes).

## P0 — finish what is half done

1. **Comic cover for hidden values** (`src/app/globals.css` "Hidden values",
   `components/custom/theme/GrawlixTagger.tsx`). Last change (varied symbols
   and colours) was never seen on screen. Capture Home + sidebar with
   `PRE_JS='const s=JSON.parse(localStorage.settings||"{}");s.showGpa=true;s.CGPAHidden=true;s.privacyMode=true;localStorage.settings=JSON.stringify(s)'`.
   Check: symbols not clipped in the sidebar tiles and in truncating values;
   colours readable on ochre cards (inside fills `--crayon-ink` is obsidian;
   variants may override it, so verify contrast there); the hover peek works
   for privacy mode; no layout shift when hiding. Rerun vitest after.
2. **Per-category privacy** — plan in `PRIVACY_MODE.md` (user asked for it).
3. **Legal pages** — `/privacy`, `/terms` were rewritten to match the code.
   They need the project owner's review before any release. Keep the
   "sources" comment at the top of `app/privacy/page.tsx` in sync when data
   flows change.

## P1 — accessibility (ROADMAP R11)

- Manual keyboard walk: Tab through sidebar (open and rail), Modules sheet,
  spotlight (Ctrl+K), settings, a BottomSheet, the FFCS planner. Focus must be
  visible (ochre ring), never trapped outside an open dialog, Esc closes.
- OptionPicker, CommandPalette, FFCS settings modal have their own focus code:
  move them to `lib/useFocusTrap` if they do not trap.
- 200% zoom: run shot.mjs at 720px width with `deviceScaleFactor: 2`, or set
  `document.documentElement.style.zoom=2`; look for overlap/clipping in the
  sidebar, Home stat cards, tables, sheets.
- Run `A11Y=1` probe on any screen you change (shot.mjs).

## P1 — screens still not hand-checked in both themes

Tasks, Focus timer, Social/People/Pairs sheets, Cab Share (reach via Hostel
Hub), Event hub and Club hub with live data (their APIs were unreachable from
the dev machine), Marks predictor (`CoursePredictorPage`), Course detail
subpage, QBank, Paper scanner (always dark on purpose), Friend Finder site
(`/friend-finder`), FFCS planner internals (guided selector, generator,
dossier). For each: icon wells in content -> remove; one ochre hero per page
(`summary-row`); status in words; no emoji; mono labels; 44px targets.

## P2 — polish ideas the user is likely to want

- **Landing**: re-check after the Night theme (no `night` styles were tuned
  for the landing art); hero art at 390.
- **Night theme**: check every page once; borders `#4FB3A5` can be loud on
  long lists — consider `--border-muted` for inner dividers in `.dark.night`.
- **Sidebar**: collapsed and open now share one order; check the tablet
  (820) rail and the popovers beside it.
- **Settings**: Profile status tiles still use icon wells; the Navigation
  section lists "Profile"/"Credentials"/"More Hub" as bottom-bar choices,
  which are odd shortcuts — ask the user which to keep.
- **About**: "Important links" rows use the same link icon for every row;
  give each its own icon or drop icons.
- **Feedback page**: "Diagnostics" internals still mention PostHog and HMAC
  (developer-facing; fine), but the "Record bug reproduction" red button is
  off-brand (raw red) — make it a coral brand button.
- **Error pages**: ErrorScreen exists; in-page error panels ("Couldn't reach
  Event Hub") could reuse its wording style.

## P3 — structural (only with the user's OK)

- **R9** move `brand.css` tokens and primitives into AmazeUI (needs publish
  permission).
- **R10** remove the zinc/indigo bridges in `brand.css`/`globals.css`: only 11
  legacy classes remain (scanner). Remove bridges one family at a time and
  screenshot, since tests do not catch colour regressions.
- Social / Amaze ID failing tests belong to a teammate's in-progress work;
  do not "fix" them by rewriting their contracts without asking.

## How to verify quickly

```bash
cd frontend
node_modules/.bin/tsc --noEmit -p tsconfig.json
node_modules/.bin/vitest run            # 15 failures = baseline
node_modules/.bin/eslint <changed files>
python3 scripts/redesign/contrast.py    # if you touched colours (light/dark/night)
```
