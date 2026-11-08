# AmazeCC Color System

All colours are OKLCH tokens defined in AmazeUI (`src/tailwind.css`) and used
through Tailwind classes (`bg-surface`, `text-ink`, `border-line`, …). Never
hard-code hex values or Tailwind's grey scales in AmazeCC.

## 1. Neutrals

| Token         | Light                    | Dark (true black)        | Use                   |
| ------------- | ------------------------ | ------------------------ | --------------------- |
| `--bg`        | `oklch(0.972 0.002 146)` | `oklch(0 0 0)`           | Canvas                |
| `--surface`   | `oklch(1 0 0)`           | `oklch(0.155 0.004 165)` | Cards, sheets         |
| `--surface-2` | `oklch(0.953 0.003 165)` | `oklch(0.205 0.005 165)` | Raised, hover, tracks |
| `--line`      | `oklch(0.915 0.005 165)` | `oklch(0.27 0.006 168)`  | Outer hairlines       |
| `--line-2`    | `oklch(0.947 0.003 165)` | `oklch(0.215 0.005 168)` | Row dividers          |
| `--ink`       | `oklch(0.214 0.012 167)` | `oklch(0.938 0.007 160)` | Primary text          |
| `--ink-2`     | `oklch(0.426 0.017 169)` | `oklch(0.806 0.011 168)` | Secondary text, icons |
| `--muted`     | `oklch(0.527 0.015 167)` | `oklch(0.69 0.012 165)`  | Metadata              |

## 2. Status

| Token                    | Meaning                           |
| ------------------------ | --------------------------------- |
| `ok` / `ok-soft`         | Safe, done                        |
| `warn` / `warn-soft`     | Warning, due soon, on the line    |
| `danger` / `danger-soft` | Critical, below the line, overdue |

Use the solid colour for text and marks, the `-soft` colour for badge
backgrounds. Status is always paired with words (see `StatusBadge`).

## 3. Accent

One accent drives primary buttons, links, focus rings and the selected tab. The
user picks it in Settings; it is applied by `useAppAppearance` as
`--palette-accent-*` variables.

| Palette       | Light         | Dark      |
| ------------- | ------------- | --------- |
| Ink (default) | `#24508f`     | `#8fb4ea` |
| Forest        | `#1f7a4d`     | `#6fcf9b` |
| Rust          | `#b5470b`     | `#e9844e` |
| Plum          | `#8b3a8f`     | `#cf7fd3` |
| Graphite      | `#46524d`     | `#b9c2be` |
| Custom        | user's choice | derived   |

Legacy `indigo-*` classes map onto the accent so old code follows the user's
choice; new code uses `accent` directly.

## 4. Course colours

`--course-1` … `--course-8` identify courses. A course's hue is chosen
deterministically from its code (`courseHue` in AmazeUI), so a course looks the
same on every screen. Use them for dots, rails, slot badges, grid cells and
heatmaps, never for status.

## 5. Themes

System (follows the device), Light and Dark, chosen in Settings. `ThemeProvider`
runs with `defaultTheme="system"` and `enableSystem`.
