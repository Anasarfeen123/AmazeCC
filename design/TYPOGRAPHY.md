# AmazeCC Typography

Calm Notebook uses two faces from one family, loaded in `src/app/layout.tsx`
with `next/font`.

## 1. Fonts

| Face       | Token                             | Use                                                                                 |
| ---------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| Geist      | `font-sans` (`--font-geist`)      | Everything: titles, body, labels                                                    |
| Geist Mono | `font-mono` (`--font-geist-mono`) | Data: course codes, slots, times, rooms, registration numbers, percentages in lists |

There is no display face. `font-outfit` survives only as a legacy class name
and resolves to Geist (see `src/app/globals.css`). Do not add new fonts.

## 2. Scale

| Element        | Size                      | Weight                            |
| -------------- | ------------------------- | --------------------------------- |
| Page title     | 22–28px                   | 600, tracking -0.02em             |
| Section title  | 13.5–17px                 | 600                               |
| Body           | 14–16px                   | 400                               |
| Secondary text | 13–14px                   | 400, `text-ink-2` or `text-muted` |
| Metadata       | 12–12.5px (never smaller) | 400, `text-muted`                 |
| Key metric     | 28–44px                   | 600, tabular numerals             |

Landing headlines go up to 68px on desktop.

## 3. Rules

- Sentence case for everything, including buttons and tabs. No all-caps labels.
- Use `tabular-nums` (or Geist Mono) wherever numbers are compared or update in
  place.
- Course titles may truncate; codes and slots never do.
- Don't enlarge everything to fix hierarchy. Make the important thing bigger
  and quiet the rest.
