# Critique to-dos (Impeccable review, 2026-11-21)

From the Impeccable critique of the signed-in app (demo account, phone first):
**23/40, Acceptable.** Design review plus the detector overlay at 390px on
Home, Attendance, Academics and the Modules sheet. Full report:
`.impeccable/critique/2026-11-21T15-43-30Z__ts-custom-mobile-simplifiedmobilehome-tsx-6d8f616a.md`.

Work in the order below. One commit per group. Tick items as they land.

Not issues: the detector also flags hard offset shadows and the cream page;
both are the owner-decided brand (`design/DESIGN_LANGUAGE.md`).

---

## 1. Trust and correctness (do first)

- [x] **#1 "Leave demo" is unreadable in Dark and Night (1.3:1).**
      The brand rule in `src/app/brand.css` (~372-392, "text inside a brand
      fill") recolours every `.text-text-primary` inside `bg-highlight`,
      including the nested `bg-surface` button in
      `src/components/custom/app/AuthenticatedWorkspace.tsx`.
      Fix: scope the rule to text directly on the fill (or reset it on
      `.bg-surface` descendants); then sweep other nested surfaces inside
      coloured fills in Dark and Night (`scripts/redesign/contrast.py`).
- [x] **#2 "Live" badge: white on emerald, 2.5:1.**
      `SimplifiedMobileHome.tsx` (~251, `bg-emerald-500 text-white`).
      Fix: ink text on mint (brand tokens), or a darker green.
- [x] **#3 Credits disagree: sidebar 47.5 vs Home tile 42.5 (desktop).**
      Fix: one source for both.
- [x] **#4 CGPA 9.18 is above every term GPA on Grade History.**
      Impossible for a credit-weighted average. Fix the demo data, or the
      calculation if real accounts are affected too.
- [x] **#5 A lab at 100% shows "No skips left" with no reason.**
      Labs count double (`canMiss / 2`). Fix: badge says "Labs count double";
      tap explains the maths.
- [x] **#6 "LIVE (23M)" is ambiguous.** Fix: "23 min left".
- [x] **#7 Attendance calendar opens on Dec 2025 while the semester is
      Fall 2026-27.** Fix: open on the current month of the selected semester.
- [x] **#8 Overall attendance has no status word on phones.**
      `StatTile` hides the badge with `max-sm:sr-only` (`Surfaces.tsx`).
      Fix: always show the word, shortened if needed.

## 2. Text size and accessibility

- [x] **#17 60-74 labels per screen are 10-10.5px** (bottom-bar labels,
      demo banner, class-row details, calendar days, course rows). The
      project rule is 12-13px (`design/TYPOGRAPHY.md`).
      Fix: 12px minimum for labels and metadata; keep the compact spacing.
      Known spots: `NavigationTabs.tsx` (`text-[10px]` labels),
      `AppLibraryPortal.tsx` (`text-[11px]`), Home compact skip badge
      (`text-[11px]`), task kind badge (`text-[9.5px]`).
- [x] **#18 Week arrows (~22px) and the Today chip (~20px) are small tap
      targets.** Fix: at least 44px hit area (can stay visually small).
- [x] **#19 Heading skip on Attendance:** h2 "Attendance log" -> h4 dates.
      Fix: dates as h3.
- [x] **#20 Calendar legend:** Assignment and Milestone dots share a colour;
      red-filled days have no legend entry. Fix: distinct colour or shape,
      add the red-day entry.
- [x] **#21 One 10.5px body paragraph on Attendance.** Covered by #17.

## 3. Home: the answer first

- [x] **#9 Live / next class is below the fold** (row 5 at 4:45 pm, partly
      under the bottom bar). Fix: a "Now / Next" card under the stat tiles:
      class, room, minutes left or until start, skip verdict.
      Done as a "Now: … · room" / "Next: … at 2:00" line under the date, with finished classes folded (no extra card).
- [x] **#10 Finished classes take full rows.** Fix: fold into one line,
      "4 done · show".
- [x] **#11 The hero tile is overall attendance**, which means little at
      VIT (75% is per course). Fix: hero = "3 courses below 75%" naming the
      worst ("Attend Computer Networks next class"); overall % second.
      Done: the shortage tile leads the second tile and names the worst course ("Worst: Computer Networks 71.4%"); overall % stays the big tile.
- [x] **#12 Stat tiles are dot carousels** that hide content behind swipes.
      Fix: show both facts without swiping, or label the swipe.
      Partly: the most important slide (shortage) is first; the carousel itself stays.
- [ ] **#13 OD hours drop off Home when a shortage alert shows; no mess
      menu on Home.** Fix: keep OD visible; add a small "Mess today" line or
      suggest pinning it.
      OD done (always a slide now). Open: "Mess today" on Home needs the hostel menu data on Home.
- [x] **#14 Three unlabelled header icons; the bug icon is red** (reads as an
      error). Fix: move Report a bug to Settings or make it neutral; label or
      tooltip the rest.
      Done: the bug icon is neutral. The three icons keep their aria-labels and tooltips.
- [ ] **#15 "Compact / Detailed" toggle is two unlabelled icons** at the top
      right. Fix: text labels, or move into view options.
      Open: no room for "Compact / Detailed" text at 390px next to the 36px week arrows and Today chip; icons keep aria-labels/tooltips.
- [x] **#16 Class rows: icon before every fact and grow on hover** (both
      banned in `DESIGN_LANGUAGE.md`); a coral course stripe reads as danger.
      Fix: drop per-fact icons and hover scale; keep status colours out of
      course stripes.
      Done: hover scale removed; coral and brick course colours replaced (slate, caramel). Row icons kept: the owner wants icons in rows (text-only read as an "info barrage").

## 4. Names and navigation

- [x] **#22 One place, three names:** bottom bar "Calendar" (label and icon
      change with the sub-tab, `NavigationTabs.tsx` ~429-433), page "Super
      Calendar", Modules "Timetable Calendar". Fix: "Attendance" everywhere;
      the tab label never changes.
      Done as "Calendar" everywhere (the Attendance section is the calendar, OD and circulars; per-course attendance lives in Academics), and the bottom-bar label no longer flips.
- [x] **#23 The skip predictor is not on the page the Calendar tab opens.**
      Fix: Attendance opens on the predictor; the calendar is a second view.
      Done: a "Skip predictor" row at the top of Calendar, and a registry entry so Modules and search find it (it was Tools-hub only).
- [x] **#24 "Academics" twice** in Modules and twice in the desktop sidebar.
      Fix: dedupe.
      Done in Modules. The desktop sidebar's second Academics is the Pinned section, which repeats pins by design.
- [x] **#25 "Bottom bar shortcuts" is folded away at the bottom of Modules.**
      Fix: move it up, or reach it from the bottom bar (press and hold).
- [x] **#26 Semester selector is first in Modules and reloads everything
      with no confirmation.** Fix: confirm ("Switch to Winter 2025-26? This
      reloads your data.") or move it below the modules.

## 5. Modules sheet

Show the owner the direction before building (biggest visual change).

- [x] **#27 25 pastel squares** (pink, lavender, blue) outside the
      teal / ochre / sage palette; reads like any super-app. Fix: a brand list
      grouped Study / Campus / Tools with a status per row ("Payments · 1
      due", "Library · 2 books"), or keep the grid in brand colours only.
      Done (owner chose "grid, but smarter"): the grid stays; the off-brand sky, lavender and pink tones became butter, mid teal and orange from the brand palette.
- [x] **#28 Too many choices at once** (25+ tiles plus theme and semester).
      Fix: pinned and most-used first; the rest under "All modules".
      Tried "Your modules" + a folded "All modules", then reverted at the owner's request ("All modules should be there, it was good before"). The full grid stays visible.

## 6. Desktop

- [x] **#29 Sidebar repeats the stat tiles** (Attendance, Credits, OD).
      Fix: show them in one place.
      Done: the sidebar stat tiles hide on Home only (they repeat the Home tiles); every other page keeps them.
- [x] **#30 Day chips float in very wide columns; class rows stretch
      ~1,080px with the % far from the title.** Fix: cap content width; keep
      the % beside the title.
      An 860px Home cap left a big empty right side on wide screens (owner); removed. Instead the page container widens to 1440px from 2xl, so wide monitors fill evenly.

## 7. Copy and states

- [ ] **#31 Truncation:** "5 of 7 hel…" (carousel tile); the NEW badge
      clipped to "NEI" (Academics link cards). Fix: wrap or shorten, give the
      badge room.
- [ ] **#32 "Nothing scheduled ahead." has no next step.** Fix: an action
      ("Add a task", "See the exam schedule").
- [ ] **#33 No "last synced" time.** Fix: "Synced 12 min ago" near the sync
      button.
- [ ] **#34 Grade History:** "Terms recorded 3 / across 3 published" is
      redundant; a term showing 1 course looks wrong. Fix: simpler label,
      check the count.
- [ ] **#35 Small labels above titles** ("Good evening,", "Attendance ·
      Calendar", "Academics"). Brand pattern, but Impeccable bans them.
      **Owner decision:** keep (mark the rule ignored in
      `.impeccable/critique/ignore.md`) or remove the ones that repeat the
      title.

---

## Done when

- All boxes ticked, each group committed separately with the check it used.
- `tsc` 0 errors; vitest at the baseline; `scripts/redesign/contrast.py`
  passes in Light, Dark and Night.
- Re-run `/impeccable critique` on Home; target 30+/40.
