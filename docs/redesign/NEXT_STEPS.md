# Next steps for the next contributor (written 2026-11-19, end of session)

Read first: `HANDOFF.md` (rules, how to work), `ROADMAP.md` (status table),
`design/README.md`, `PRIVACY_MODE.md`. Fork only: `git push fork redesign`.
Test baseline: 15 failures (oauth2, social-* x6 files, syncNotificationRedesign).
Dev server: `node_modules/.bin/next dev --webpack -p 3017` (machine is low on
memory; close it when idle). Screenshots: `scripts/redesign/shot.mjs`
(options documented at the top of the file and in ROADMAP R12).

Every item says what to check on screen. Do not mark anything done without
light + dark captures at 390 and 1440 (and 820 where layout changes).

## Done 2026-11-20 (and what it changed)

- Dark/Night: shadow colour = border colour; cards a step lighter than the
  page (dark #003431, Night #0f1615); faint dot grid on the dark page;
  second summary-row card sage-tinted. User: "better, could be better".
- Marks pills (My Courses & Marks) and Grade History bars coloured by score
  with brand mint / ochre / coral in every theme.
- Grade History: CGPA and term GPAs respect privacy; term chips on their
  own row; plain copy; no duplicate course boxes.
- Classmates: only your batch by default (toggle "Only my batch").
- Sidebar "All modules" trial rejected and reverted; row icons stay.
- Skip-to-content link; shot.mjs gained KEYS= and EVAL=.

Open from this round: a colour per course (asked the user, no answer yet);
360px checks beyond Home; Find Classmates with a real account (batch
filter not seen on screen).

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
dossier). For each: keep row icons (user 2026-11-20: removing them made pages an "info barrage"; drop only icons that repeat a nearby one); one ochre hero per page
(`summary-row`); status in words; no emoji; mono labels; 44px targets.

## P2 — polish ideas the user is likely to want

- **Landing**: re-check after the Night theme (no `night` styles were tuned
  for the landing art); hero art at 390.
- **Night theme**: check every page once; borders `#4FB3A5` can be loud on
  long lists — consider `--border-muted` for inner dividers in `.dark.night`.
- **Sidebar, tried and rejected (2026-11-20)**: a core-only sidebar with an
  "All modules" item (and a desktop drill-in panel listing every module).
  User: "redundant and weird". Reverted (`SIDEBAR_CORE_ONLY = false` in
  `NavigationTabs.tsx`, commit 8ea8bad6). Try a different idea to lower the
  weight of non-core modules; do not bring "All modules" back.
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

## More (added on request)

### Bugs / risks seen this session, worth a check

- `brandify.py` had three bugs (fixed): `\b` after "-", bare `group-`, and
  `bg-zinc-50` matching `bg-zinc-500/10`. Grep the tree for leftovers:
  `group-text-`, `" group- "`, `secondary0`, `text-primary text-primary`
  (duplicated classes from codemods), `hover:brightness-110 hover:brightness-110`.
- Fill-ink rules (`brand.css`) recolour text inside sage/ochre/primary fills.
  Any new status colour inside a fill must be added there or it goes
  unreadable (this happened with mint-on-ochre).
- `summary-row` forces ink text with `!important`; it now skips
  `.crayon-hide` and `[data-private]`. Anything else that must keep its own
  colour inside the first card needs a `bg-*` class or an exclusion.
- Sidebar "Attend" stat toggles % vs fraction on click (not a link to the
  predictor); confirm with the user this is wanted.
- The OD tracker "Recovered" slide and the official records only show real
  data with the user's account (`LOGIN=1`); demo has none.
- `ProfilePage.tsx` is ~2,750 lines; split sections into files
  (`settings/sections/*.tsx`) before more edits.

### Mobile

- Check every screen at 360px too (smallest common Android), not only 390.
- Bottom bar overlaps page bottoms in a few screens (calendar day simulator
  card on the predictor was partly under it): add bottom padding equal to the
  bar height + safe area on pages that end with a card.
- Long course names truncate in Home class cards; consider two lines.
- Test the installed PWA (standalone): FFCS planner opens in the same tab
  there by design; check the back path.

### Performance

- `perf.mjs` exists: measure Home first paint, the FFCS planner and the
  predictor on a mid phone profile (CPU 4x throttle).
- Large client components (FFCSTimetableTab ~4.7k lines, FFCSGuidedSelector
  ~5.4k, ProfilePage ~2.7k) re-render a lot; memoise lists and split.
- Landing art: serve AVIF/WebP at 1x/2x with `srcset`; the blurred hero image
  can be much smaller since it is blurred.

### Copy and content

- Run a plain-words pass on all toasts and error messages (many still say
  "Failed to fetch", "dispatch", "sweep"). Words for status everywhere.
- Remove developer jargon in student-facing text (VAPID, DPoP, HMAC, digest,
  API mirror) or move it into Advanced.
- Dates: one format app-wide (e.g. "Thu 19 Nov"); several screens differ.

### Tests to add

- Visual smoke: a script that captures ~15 key screens x 3 themes into
  `.scratch/visual/` and diffs against the previous run (pixelmatch), so
  colour regressions from bridge removal are caught.
- Unit tests for `gradeTone`, `courseColors`, `summary-row` behaviour (DOM
  class presence), theme switching (`night` adds both `dark` and `night`).

### Ask the user before doing

- Which bottom-bar shortcuts to offer; whether to keep the Tools/More hubs.
- Whether the Night theme should be the default for dark-mode OS users.
- Release plan: when the redesign may go to `AmazeContinuityProjects/*`
  (until then fork only) and when AmazeUI may be published (R9).
