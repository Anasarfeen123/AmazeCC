# AmazeCC design language

Version 2.0 (Friendly Brutalist, November 2026). Replaces 1.0 "Organic".

## 1. What AmazeCC is

A student app for VIT Chennai that replaces daily VTOP use: attendance,
marks, timetable, exams, campus services, FFCS planning. Students open it
between classes, in queues, on bad wifi. Every screen should answer "what do
I need right now?" first.

## 2. Principles

1. **Readable beats pretty.** When the look and readability conflict,
   readability wins.
2. **One loud thing per card.** A card has at most one hero value or title.
3. **Numbers say what to do.** A percentage comes with its consequence
   ("Can skip 2", "Attend next 1"), and every attendance bar draws the 75% line.
4. **Words, not colour alone.** Status always carries a word (badge or text).
5. **Less is more.** Remove noise (employee IDs, repeated category labels,
   decorative icons) before adding anything.
6. **Same everywhere.** Reuse the shared tokens and primitives; do not invent
   a new card, button or shadow.

## 3. The look

- **Light:** paper page, cream cards, 2px ink (near-black teal) edges, hard
  ink shadows offset to the bottom right.
- **Dark:** obsidian-teal page, mid-teal cards, bright teal edges, near-black
  shadows. Not neutral black, not brown.
- **Colour comes from solid fills:** an ochre hero card, a teal card with an
  ochre number, sage chips and selection. The page itself stays calm.
- **Sidebar and phone bottom bar** are a solid teal panel in both themes, with
  an ochre active item.
- **Type:** Space Mono bold for titles and numbers, Space Mono for labels and
  metadata, Geist for running text.

Reference: the user's "ON-DUTY HOURS" light and dark mocks (described in
`docs/redesign/HANDOFF.md` §2).

## 4. Shape and depth

| Thing                    | Edge    | Radius      | Shadow               |
| ------------------------ | ------- | ----------- | -------------------- |
| Card                     | 2px ink | 14px        | md (5px)             |
| Hero card, dialog        | 3px ink | 14px / 20px | md / lg (7px)        |
| Button, chip, input, row | 2px ink | 10px        | sm (3px) when raised |
| Badge                    | 2px ink | 6px         | none                 |

- Shadows are hard: zero blur, bottom-right, `--shadow-ink`. Only the
  outermost layer casts one; nested rows get an edge only.
- Leave room (≈6px right/bottom) so `overflow-hidden` parents do not clip shadows.
- Never radius 0, never pill-round text buttons/badges (circles are fine for
  avatars, dots, switch thumbs).

## 5. Motion

- 80–200ms, ease-out, no springs, no bounce, no scale pops, no blur.
- Pressable things use `.brutal-press` (lift on hover, sink on press).
- Light/dark switch: circular reveal with CSS transitions paused
  (`.theme-switching`); instant for reduced motion.
- `prefers-reduced-motion`: no movement; colour/shadow changes only.

## 6. Icons

- Lucide only, stroke ≈2.2, sized 16–20px.
- **Navigation keeps icons with labels** (sidebar, rail, bottom bar).
- **Content avoids icons:** no decorative icon wells, no icon before every
  fact, no emoji. Use words ("Venue AB1-301", not a building icon).
- Universal controls keep theirs: close, back, search, chevron, sync, theme.

## 7. Banned

Blur shadows, glows, gradients, glass / `backdrop-blur`, raw hex or
`zinc/gray/slate/indigo-*` classes in components, text under 12px, pill-round
text buttons, emoji in UI, accent-colour pickers, colour-only status.

## 8. Accessibility

WCAG AA: text ≥ 4.5:1, edges and large numbers ≥ 3:1 (checked by
`scripts/redesign/contrast.py`). 44px touch targets. 3px ochre focus ring,
never removed. Every icon-only button has an accessible name.
