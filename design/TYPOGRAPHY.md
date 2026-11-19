# AmazeCC typography

Fonts load in `src/app/layout.tsx` (`next/font/google`); the font tokens live
in `src/app/brand.css`.

| Token            | Tailwind                                | Font                   | Used for                                                    |
| ---------------- | --------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `--font-display` | `font-display` (also old `font-outfit`) | **Space Mono 700**     | Page titles, card titles, hero numbers                      |
| `--font-mono`    | `font-mono`                             | **Space Mono 400/700** | Labels, badges, chips, buttons, metadata, numbers in tables |
| `--font-sans`    | `font-sans` (default)                   | Geist                  | Sentences, descriptions, form text                          |

Space Grotesk is loaded as a fallback for glyphs Space Mono lacks.

## Sizes

| Use                       | Phone                                     | ≥ 640px |
| ------------------------- | ----------------------------------------- | ------- |
| Page title (`TitleBlock`) | 28px, uppercase                           | 36px    |
| Hero number (stat card)   | 32–40px                                   | 40–56px |
| Card title                | 16–20px                                   | 18–24px |
| Body                      | 14–16px                                   | 14–16px |
| Label / button / badge    | 12–13px, mono, uppercase, tracking 0.06em | same    |
| Metadata                  | 12px mono                                 | same    |

**Never below 12px** (no `text-[9px|10px|11px]`). Inputs are 16px on touch
devices (prevents iOS zoom; rule in `globals.css`).

## Casing and copy

- Uppercase only for short runs (labels, badges, titles of six words or
  fewer), applied with the `uppercase` class, not typed in caps.
- Sentences, errors and help text stay sentence case.
- Metadata uses `//` separators: `BCSE202 // THEORY // 3 CREDITS`.
  In JSX write them as strings (`{" // "}`), or eslint reads them as comments.
- Plain, warm, short words students use. Explain VTOP/FFCS terms.
- Codes (`OD-8821`, `L31+L32`) go in the metadata line, not the headline.
- Names from VTOP: use `facultyDisplayName()` (drops the employee id) and
  `greetingName()` (first name) from `src/lib/displayNames.ts`.
