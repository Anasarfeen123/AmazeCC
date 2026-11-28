# AmazeCC typography

Fonts load in `src/app/layout.tsx` (`next/font/google`, all OFL); the font
tokens live in `src/app/brand.css`. Each face has **one job** (owner,
2026-11-28: "add more fonts so it is not monotonous"; Courage and Homeland
were requested but are paid / personal-use only, so free faces fill those
roles).

| Tailwind       | Font                            | Used for                                                                                                                                                      |
| -------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `font-title`   | **Bricolage Grotesque 600/800** | Page titles (`TitleBlock`), the Home greeting name, section headers (`SectionHeader`), sheet and card titles, landing card titles, stat values that are words |
| `font-display` | **Space Mono 700**              | Hero numbers (79%, 9.18, 3 courses), the brand signature                                                                                                      |
| `font-outfit`  | **Space Grotesk 500/700**       | Course names and card titles inside lists                                                                                                                     |
| `font-label`   | **DM Sans** (semibold)          | Small labels, eyebrows, stat labels, field labels: sentence case, no letter-spacing                                                                           |
| `font-mono`    | **Space Mono 400/700**          | Badges, chips, slot codes, metadata (`BCSE202 // THEORY`)                                                                                                     |
| `font-hand`    | **Caveat 600/700**              | Handwritten accents, sparingly: Home greeting line, loading-screen "Did you know?", "Nice, you're in.", landing sticky notes, the "Your day" date             |
| default        | Geist / DM Sans                 | Sentences, descriptions, form text                                                                                                                            |

Caveat and Geist Mono are not preloaded (accent / fallback).

## Sizes

Text floors hold on the compact phone root (13–14px): `text-xs` ≥ 13px,
`text-sm` ≥ 14px, `text-base` ≥ 16px, with line heights 1.45 / 1.5 / 1.55
(Fontfabric reading guide, 2026-11-22).

| Use                       | Phone                        | ≥ 640px |
| ------------------------- | ---------------------------- | ------- |
| Page title (`TitleBlock`) | 28px Bricolage 800, as typed | 36px    |
| Home greeting name        | 30px Bricolage 800           | 38px    |
| Hero number (stat card)   | 32–40px Space Mono           | 40–56px |
| Section header            | 15px Bricolage 700           | same    |
| Card title                | 16–20px                      | 18–24px |
| Body                      | 14–16px                      | 14–16px |
| Label                     | 13px DM Sans semibold        | same    |
| Badge / chip              | 12–13px mono, uppercase      | same    |

**Never below 12px.** Inputs are 16px on touch devices (prevents iOS zoom).

## Casing and copy

- **Uppercase only on bordered badges and chips** (`NEAR 75%`, `FAT`,
  `SOON`). Labels, eyebrows, headers and titles are written in normal case;
  do not add `uppercase tracking-*` to a label (use `font-label`).
- Sentences, errors and help text stay sentence case.
- Metadata uses `//` separators: `BCSE202 // THEORY // 3 CREDITS`.
  In JSX write them as strings (`{" // "}`), or eslint reads them as comments.
- Plain, warm, short words students use. Explain VTOP/FFCS terms.
- Codes (`OD-8821`, `L31+L32`) go in the metadata line, not the headline.
- Names from VTOP: use `facultyDisplayName()` (drops the employee id) and
  `greetingName()` (first name) from `src/lib/displayNames.ts`.
- No emojis in the UI; use Lucide icons.
