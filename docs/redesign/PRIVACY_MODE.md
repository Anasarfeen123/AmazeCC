# Privacy mode and hidden values: plan for the next contributor

User feedback (2026-11-19): privacy mode is "very stubby". It hides everything
or nothing; a blur still let people read a CGPA. Wanted: hide only some things,
and a comic style of cover.

## Done

- Blur replaced by a cover (`src/app/globals.css`, "Hidden values").
  `.crayon-hide` = explicit hide (CGPA toggle, sensitive storage values; no
  peek). `.privacy-mode [data-private]` = privacy mode (hover/focus peeks).
- Default cover is a **text** comic tag `#@%!` on a beige chip (user's first
  choice; user said: text, not images). `html.hide-marker` switches to a marker
  blackout (an SVG mask; the user disliked image looks, so keep it optional).
- Applied in: sidebar CGPA, Home stat tiles, Curriculum, InsightCarousel,
  Local storage viewer.

## Per-category privacy (done 2026-11-19)

- Settings > Appearance & Privacy has a Privacy mode master, its cover-style
  dropdown, and individual controls for CGPA/GPA, attendance, marks/grades,
  fees/payments, credits, registration number and name/photo.
- The master is authoritative: when it is off, no cover remains on screen.
  Turning it on starts with all categories; individual toggles refine that set.
- `privacyCategories` and `privacyCoverStyle` persist in settings. A legacy
  saved `privacyMode:true` becomes all categories; a pre-master CGPA hide is
  read as the CGPA category.
- `data-private` now names the relevant category for the Home/sidebar,
  attendance, academics, payments and profile surfaces. Generic stat surfaces
  remain covered by the master only.
- CSS uses one root class per category and preserves hover/focus peeking. The
  comic overlay now uses `visibility` as well as transparent text, so legacy
  colour utilities cannot leak the hidden value.
- `privacyMode.test.tsx` covers root category classes, legacy reads, master /
  category interaction and tagged stat values.
