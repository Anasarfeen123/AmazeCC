# AmazeCC AI Contributor Guidelines

Read `DESIGN_LANGUAGE.md` first. The short version: Calm Notebook, flat
surfaces, hairlines, one accent, colour only for meaning.

---

When generating UI:

Always:

- Reuse AmazeUI components (Button, StatusBadge, AttendanceBar, CourseDot,
  SlotBadge, Switch, sheets and popovers)
- Use tokens: `bg-background`, `bg-surface`, `bg-surface-2`, `border-line`,
  `divide-line-2`, `text-ink`, `text-ink-2`, `text-muted`, `accent`, `ok`,
  `warn`, `danger`, `course-1…8`
- Use Geist for text and Geist Mono for codes, slots, times and rooms
- Pair every status colour with words
- Check both light and true-black dark, at 390px wide

Never:

- Add gradients, glows, glass effects or decorative shadows
- Use Tailwind grey scales (`zinc`, `slate`, `gray`) or hard-coded hex colours
- Put icons in tinted tiles
- Use all-caps labels
- Create new card, button or badge styles
- Disable text selection outside of chrome
- Ignore accessibility requirements

When uncertain:

Use an existing component.

Do not invent a new one.
