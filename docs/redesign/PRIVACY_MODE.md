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

## To do: per-category privacy

1. Settings > Appearance & Privacy: replace the one switch with a list:
   CGPA/GPA, attendance %, marks and grades, fees and payments, credits,
   registration number, name/photo. Each on/off; "Hide all" master on top.
2. Mark values with a category: `data-private="cgpa|attendance|marks|fees|credits|id"`
   (today `data-private` has no value). Grep `data-private` to find them.
3. CSS: `html.privacy-hide-cgpa [data-private~="cgpa"]` etc. (generate one
   rule per category from a list in `useAppAppearance.ts`, which already
   toggles `privacy-mode` on `<html>`). Keep peek on hover/focus/tap.
4. Settings keys: `privacyCategories: string[]`; migrate `privacyMode:true` to
   all categories, `CGPAHidden`/`blurGrades` to `["cgpa"]`.
5. Cover style picker: Comic (#@%!, default) / Marker. Vary the symbols per
   element (e.g. `data-grawlix` set from a hash of the key) so a page is not
   all the same "#@%!".
6. Tests: one per category (class present on <html>, element covered),
   command palette toggles, Alt/Option+P still toggles "Hide all".
