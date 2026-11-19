# AmazeCC — guide for AI contributors (and humans)

Read `design/README.md`, then `docs/redesign/HANDOFF.md` before changing UI.

## Always

- Build on `lib/uiTokens.ts` and `shared/primitives/` (see COMPONENTS.md).
- Use semantic colour tokens only (COLORS.md). Fills with their `-foreground`.
- Words for status; one loud thing per card; 44px targets; 12px minimum text.
- Check phone (390), tablet (820) and desktop (1440), light and dark
  (`scripts/redesign/shot.mjs`, see HANDOFF §6.3).
- Keep accessible names on icon-only buttons and `aria-current` on nav.

## Never

- New card, button, shadow or radius styles.
- Raw hex, `zinc/gray/slate/neutral/indigo/blue/sky/violet/purple-*`,
  gradients, blur, glass, glows, emoji, `text-[9–11px]`.
- Pill-round text buttons/badges; icon wells in content.
- Accent-colour pickers or alternative card looks (removed on purpose).
- Pushing to or opening PRs on `AmazeContinuityProjects/*` while the
  redesign is fork-only (HANDOFF §0).

## Before you commit

```bash
cd frontend
node_modules/.bin/tsc --noEmit -p tsconfig.json          # 0 errors
node_modules/.bin/vitest run                              # 15 failures = baseline
node_modules/.bin/eslint <changed files>                  # 0 errors
python3 scripts/redesign/contrast.py                      # if you touched colours
git diff --name-only | grep -E '\.(tsx|ts|css)$' | xargs grep -nE \
  'text-\[(9|10|11)px\]|\b(zinc|gray|slate|neutral|indigo)-[0-9]{2,3}\b|backdrop-blur|bg-gradient|#[0-9a-fA-F]{6}' || echo clean
```

Converting an old screen: `python3 scripts/redesign/brandify.py <files> --status`
does the mechanical class mapping; then fix layout, remove icon wells and
noise by hand, look at the screenshots, and update tests that pinned old
class names (keep their intent).

When unsure about a visual decision, ask the user; do not guess a new style.
