# AmazeCC design system

The look is **Friendly Brutalist**: paper and ink, thick edges, hard shadows,
solid teal / ochre / sage fills, Space Mono type. It replaced the earlier
"soft organic" design in November 2026 (branch `redesign`).

Source of truth, in this order:

1. **`src/app/brand.css`** — every colour, shadow, radius and font token, plus
   the brand utilities. If a doc and this file disagree, the file wins.
2. **This folder** — the rules for using those tokens.
3. **`src/lib/uiTokens.ts`** and **`src/components/custom/shared/primitives/`** —
   the shared class strings and components every screen should build on.

| File                                               | What it covers                                                 |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [DESIGN_LANGUAGE.md](DESIGN_LANGUAGE.md)           | Principles, the look, what is banned                           |
| [COLORS.md](COLORS.md)                             | Tokens for light and dark, how to use them, contrast           |
| [TYPOGRAPHY.md](TYPOGRAPHY.md)                     | Fonts, sizes, casing, metadata style                           |
| [COMPONENTS.md](COMPONENTS.md)                     | Cards, stat cards, buttons, badges, chips, fields, sheets, nav |
| [NAVIGATION.md](NAVIGATION.md)                     | Phone / tablet / desktop structure                             |
| [AI_CONTRIBUTOR_GUIDE.md](AI_CONTRIBUTOR_GUIDE.md) | Checklist for agents and humans before committing UI           |

Work in progress, history and the backlog: `docs/redesign/README.md`.
