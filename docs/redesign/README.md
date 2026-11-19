# AmazeCC redesign docs — start here

For any agent or person picking up the redesign. Read in this order:

1. **[HANDOFF.md](HANDOFF.md)** — hard rules (fork only, credentials, tests),
   the look the user chose, what is done (per commit), known bugs, how to run
   and screenshot the app, code map.
2. **[ROADMAP.md](ROADMAP.md)** — what to do next, in priority order, each
   item with files and a "Done when" checklist.
3. **[`frontend/design/`](../../design/README.md)** — the design system rules:
   language, colours, typography, components, navigation, contributor checklist.
4. **[AUDIT_2026-11-19.md](AUDIT_2026-11-19.md)** — current confirmed issues,
   visual review checklist, and remaining release checks. Takes precedence over
   older completion claims in the handoff.

Also here:

| Path                                  | What                                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `screens/`                            | Reference screenshots: `live-before-*` (amazecc.com on 2026-11-18), `p1`…`p9` (progress), `p9-*` latest |
| `../../scripts/redesign/shot.mjs`     | Headless screenshots: demo or the user's own account (`LOGIN=1`) at phone/tablet/desktop                |
| `../../scripts/redesign/fullpage.mjs` | Full-page capture of any URL                                                                            |
| `../../scripts/redesign/brandify.py`  | Codemod: old Tailwind classes → brand tokens                                                            |
| `../../scripts/redesign/contrast.py`  | Contrast check of every token pair, light + dark                                                        |

Branch: `redesign` on the fork `Anasarfeen123/AmazeCC`. Nothing goes to
`AmazeContinuityProjects/*` until the user says so.

When you stop working: update the status table in ROADMAP.md, add a line to
the progress log in HANDOFF.md §7, commit, `git push fork redesign`.
