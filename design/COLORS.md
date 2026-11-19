# AmazeCC colours

All colours are CSS variables in `src/app/brand.css` (`:root` = light,
`.dark` = dark, `.brand-sidebar` = the teal sidebar/bottom bar). Components
use the Tailwind names below, never raw hex and never `zinc/gray/slate/
neutral/indigo/blue/sky/violet/purple-*` steps (those only exist as bridges
for screens not converted yet).

## Semantic tokens

| Role          | Tailwind                                      | Light                  | Dark                       |
| ------------- | --------------------------------------------- | ---------------------- | -------------------------- |
| Page          | `bg-background`                               | `#F7F1E6` paper        | `#001E1D` obsidian teal    |
| Card          | `bg-surface`                                  | `#FFFDF8`              | `#002B29`                  |
| Inset / well  | `bg-surface-secondary`                        | `#EFE7D8`              | `#003A37`                  |
| Deeper inset  | `bg-surface-tertiary`                         | `#E6DCCB`              | `#00443F`                  |
| Hover         | `bg-surface-hover`                            | `#F3ECDF`              | `#003532`                  |
| Heading text  | `text-text-heading`                           | `#001E1D`              | `#F7F1E6`                  |
| Body text     | `text-text-primary`                           | `#001E1D`              | `#F2ECE0`                  |
| Muted text    | `text-text-muted`                             | `#4A5F5C`              | `#8FB5AA`                  |
| Edge          | `border-border-ink`                           | `#001E1D`              | `#3F8F84`                  |
| Soft divider  | `border-border-muted` / `divide-border-muted` | ink 22%                | teal 45%                   |
| Shadow        | `shadow-brutal-sm/md/lg`                      | `#001E1D`              | `#000807`                  |
| Primary (+fg) | `bg-primary text-primary-foreground`          | teal `#004643` / paper | ochre `#F9BC60` / obsidian |
| Sage (+fg)    | `bg-secondary text-secondary-foreground`      | `#ABD1C6` / ink        | `#ABD1C6` / obsidian       |
| Ochre (+fg)   | `bg-highlight text-highlight-foreground`      | `#F9BC60` / ink        | same                       |
| Hero number   | `text-hero`                                   | teal                   | ochre                      |
| Success       | `bg-success-surface text-success-foreground`  | `#DCEFE4` / `#14533A`  | tinted / `#8FE0B3`         |
| Warning       | `bg-warning-surface text-warning-foreground`  | `#FDF0D6` / `#7A4F00`  | tinted / `#F9C97F`         |
| Danger        | `bg-danger-surface text-danger-foreground`    | `#FBE3E0` / `#8C1D17`  | tinted / `#FFB4A8`         |

Fixed brand colours (same in both themes, use sparingly):
`bg-teal` `#004643`, `bg-ochre` `#F9BC60`, `bg-sage` `#ABD1C6`, `text-cream` `#F7F1E6`.

## Rules

- **Fills carry their own ink.** Text inside a sage / ochre / primary fill
  automatically takes that fill's foreground (rule in `brand.css`), so a
  selected tile never ends up light-on-light. Still prefer setting the
  `-foreground` class explicitly.
- **One hero fill per row.** E.g. Home's attendance stat card is ochre
  (`StatTile variant="highlight"`), the others are surface cards.
- **Status = word + colour.** Use `TONE_BADGE.emerald/amber/red/zinc` from
  `uiTokens.ts` with a word inside.
- **Never ochre text on light backgrounds** (fails contrast). Ochre text is
  fine on teal and on dark.
- **Selection:** sage fill + ink edge + small shadow (chips, segments); in the
  week strip, the selected day is an ink tile; in the sidebar/bottom bar and
  spotlight, ochre.

## Contrast check

```bash
python3 scripts/redesign/contrast.py
```

Reads the hex values from `brand.css` and checks text pairs (≥ 4.5:1) and
edges (≥ 3:1) in light and dark. Exit code 1 means something fails. Run it
after any colour change.

## Planned

A third "super dark" (near-black, AMOLED) theme option — see
`docs/redesign/ROADMAP.md`.
