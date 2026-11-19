<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Redesign (branch `redesign`, fork only)

The UI is being rebuilt to a branded "Friendly Brutalist" design. Before any
UI change read, in order:

1. `docs/redesign/README.md` — index of the redesign docs
2. `docs/redesign/HANDOFF.md` — hard rules, decisions, state, how to work
3. `docs/redesign/ROADMAP.md` — what to do next, with "Done when" lists
4. `design/README.md` — design system rules (colours, type, components)

Hard rules: work only on the fork `Anasarfeen123/AmazeCC` (push with
`git push fork redesign`); never handle the user's VTOP password (use
`scripts/redesign/shot.mjs` with `LOGIN=1`, which reads
`~/.config/amazecc/vtop.env`); colours only through tokens in
`src/app/brand.css`; keep `vitest` at the 20-failure baseline.
