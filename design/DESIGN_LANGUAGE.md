# AmazeCC Design Language

Version: 2.0 (Calm Notebook)

---

# 1. Introduction

AmazeCC is a Student Operating System.

It brings together academics, attendance, timetable, campus life, student tools, and productivity features into a unified experience.

The goal of AmazeCC is not to look futuristic or corporate.

The goal is to help students navigate university life quickly, confidently, and with minimal cognitive load.

---

# 2. Product Principles

Every design decision must follow these principles.

## 2.1 Student First

Every screen should answer:

"What does the student need right now?"

before showing analytics, charts, or secondary information.

---

## 2.2 Clarity Over Decoration

Visual beauty should never reduce usability.

Information must always be easier to understand than it is beautiful.

---

## 2.3 Fast Navigation

Students frequently use AmazeCC while:

- Walking between classes
- Standing in queues
- Checking attendance quickly
- Looking up exam information

Navigation must always be fast and obvious.

---

## 2.4 Consistency Over Creativity

A consistent interface is more valuable than a creative interface.

Reusing existing patterns is preferred over inventing new ones.

---

# 3. Visual Identity: Calm Notebook

AmazeCC looks like a well-kept notebook: flat paper surfaces, hairline rules,
one ink colour for action, and colour reserved for meaning.

- Quiet surfaces, not glass, gradients or glows.
- Hairline borders separate things; shadows are almost never used.
- Course colours identify courses. Status colours (green, amber, red) carry
  attendance and urgency. Everything else is ink on paper.
- Numbers that matter are large and tabular; codes, slots, times and rooms are
  set in Geist Mono so they line up and read as data.
- Dark mode is true black (`--bg: oklch(0 0 0)`), with raised surfaces only a
  few steps lighter.

The tagline is the brief: **Your VIT life, on one calm page.**

---

# 4. Surfaces

Four levels, used the same way on every screen.

| Level                | Token                                                 | Use                                                            |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------- |
| Background           | `bg-background` (`--bg`)                              | The app canvas                                                 |
| Surface              | `bg-surface`                                          | Cards, list shells, sheets                                     |
| Raised / interactive | `bg-surface-2`                                        | Selected segments, hover and pressed rows, tracks, empty cells |
| Rules                | `border-line` (outer), `divide-line-2` (between rows) | Hairlines                                                      |

A card is `rounded-md border border-line bg-surface`. A list is the same shell
with `divide-y divide-line-2` rows. Do not stack shadows, tints and borders on
the same element.

---

# 5. Radius

| Token               | Value | Use                                              |
| ------------------- | ----- | ------------------------------------------------ |
| `rounded-sm`        | 6px   | Buttons, inputs, segmented controls, small tiles |
| `rounded-md`        | 10px  | Cards, list shells, banners                      |
| `rounded-lg` and up | 14px  | Sheets and dialogs                               |
| `rounded-full`      |       | Badges, avatars, dots, switches                  |

`rounded-xl` and `rounded-2xl` resolve to 14px; prefer `rounded-md` for cards.

---

# 6. Elevation

There is no shadow scale. Depth comes from surface level and hairlines.
Shadows are allowed only on things that float above the page: bottom sheets,
dialogs, popovers and menus, and the switch thumb.

---

# 7. Spacing

Tailwind's 4px scale. Common rhythms:

- Page gutters: 16px on phones (`px-4`), 24–32px on larger screens.
- Between sections on a page: 20–24px (`space-y-5` / `space-y-6`).
- Section title to its content: 8px (`pb-2`).
- List rows: `px-3.5 py-2.5`, minimum height 48px (56px for two-line rows).

---

# 8. Motion

Motion explains a change; it never decorates a static screen.

- Hover and press: colour only, 120ms (`transition-colors duration-[120ms]`).
- Overlays (sheets, menus, popovers): 150–250ms, ease-out, anchored to their
  trigger.
- Content reveals and the landing page's live demo: 300–700ms.
- Respect `prefers-reduced-motion`: every looping or scroll-triggered effect
  must stop or appear instantly.

---

# 9. Icons

Lucide, line style, `strokeWidth` 1.7–1.8, 18px in rows and 20px in the bottom
bar, coloured `text-ink-2`. Icons sit bare in rows; do not put them in tinted
tiles.

---

# 10. Layout

- Mobile first. Phones render at 1:1 (`initialScale: 1`).
- Every scroll container reserves space for the bottom bar and the device's
  safe-area inset; sheets sit above the bar and size to their content.
- One primary action per screen region.
- Text is selectable by default. Only chrome (buttons, tabs, switches, nav)
  turns selection off.

---

# 11. Status

One vocabulary, rendered by AmazeUI's `StatusBadge`, decided by AmazeCC.

| Status             | Meaning                                    | Colour         |
| ------------------ | ------------------------------------------ | -------------- |
| Safe               | Comfortably above the attendance target    | green (`ok`)   |
| Warning            | Within 5 points of the target, or due soon | amber (`warn`) |
| Critical           | Below the target, overdue                  | red (`danger`) |
| Neutral            | No data yet, or unavailable                | grey           |
| Info / in progress | General information                        | accent         |

Colour is never the only signal: a badge always carries words ("Below 75%").
The attendance rule lives in `src/lib/attendanceStatus.ts`.

---

# 12. Accessibility

- Touch targets at least 44px.
- Body text at least 14px; metadata never below 12px.
- Contrast: ink and ink-2 on every surface meet WCAG AA in both themes.
- Overlays are labelled dialogs, close on Escape and on the system back gesture.
- Never rely on colour alone (see Status).

---

# 13. Ownership

| AmazeUI owns                                      | AmazeCC owns                                  |
| ------------------------------------------------- | --------------------------------------------- |
| Tokens, themes, `ThemeProvider`                   | The user's theme and accent choice            |
| Button, Card, StatusBadge, Switch, Sheet, Popover | Attendance rules and recovery maths in the UI |
| AttendanceBar, CourseDot, SlotBadge               | Home, Academics, Calendar, campus modules     |
| Calendar and table primitives                     | Academic calendar and marks tables            |

Product rules never move into AmazeUI.

---

# Final Principle

If a screen needs decoration to look finished, the information is not
organised yet.
