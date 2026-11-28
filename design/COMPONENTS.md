# AmazeCC components

Use these before writing new markup. Paths are under `src/`.

## Surfaces — `lib/uiTokens.ts`

| Token                                            | Use                                                            |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `TILE` / `TILE_CARD`                             | The card: 2px ink edge, 14px, md shadow. Column / free layout. |
| `TILE_INTERACTIVE` / `TILE_INTERACTIVE_ROW`      | Pressable card (adds `.brutal-press`).                         |
| `LIST_SHELL` + `LIST_ROW`                        | A bordered list with soft dividers; rows are 44px+.            |
| `EMPTY_STATE`                                    | Dashed outline box for empty states.                           |
| `.brutal-card` / `.brutal-card-hero` (brand.css) | Same card as a class; hero = 3px edge.                         |

Nested things inside a card get an edge, not another shadow.

## Primitives — `components/custom/shared/primitives/`

| Component                                                               | Notes                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PageShell`                                                             | Every page's header: back button (left), actions (right), eyebrow badge, 28/36px uppercase title, mono subtitle, optional "Updated X ago". Props: `onBack`, `backLabel`, `actions`, `eyebrow`, `syncedOps`.  |
| `BrandBackButton`                                                       | Ochre, labelled ("← ATTENDANCE"), accessible name. Used by `PageShell`.                                                                                                                                      |
| `StatTile`                                                              | Stat card: mono label, hero number, mono sub-line, optional badge (hidden on phones). `variant`: `default` (surface), `highlight` (ochre card, ink text — one per row), `primary` (teal card, ochre number). |
| `InsightCarousel`                                                       | Rotating stat card; same anatomy as `StatTile`.                                                                                                                                                              |
| `SectionHeader`                                                         | Mono uppercase section label + count chip + right slot.                                                                                                                                                      |
| `MiniBar`                                                               | Thin bordered progress bar. Attendance bars should also draw the target line (see `attendance/DesktopCourseDetail.tsx`).                                                                                     |
| `KeyValue`                                                              | Label/value cell for fact grids.                                                                                                                                                                             |
| `SegmentedControl`                                                      | Bordered segment group; active = sage + shadow.                                                                                                                                                              |
| `ChipTabs`                                                              | Scrollable filter chips; selected = sage + shadow.                                                                                                                                                           |
| `RadioGroup` (Controls)                                                 | Option cards with a radio dot.                                                                                                                                                                               |
| `IconButton`, `IconLink`, `GhostButton`                                 | 44px icon button (needs `aria-label`/`title`), icon link, quiet text button.                                                                                                                                 |
| `ListShell`, `ListRowText`, `SettingRow`, `ToggleRow`                   | Bordered lists and settings rows.                                                                                                                                                                            |
| `Switch`                                                                | 2px ink track; on = primary. `SwitchTrack` is the visual-only version.                                                                                                                                       |
| `OptionPicker` / `SelectField`                                          | The dropdown. Measured before paint (no fly-in), content-sized, check mark on the selected option, em-sized chevron, bottom sheet on phones. All 44 app dropdowns use it.                                    |
| `ToneBadge`, `DotPill`, `ToneDot`, `ToneLegend`, `AvatarDot` (Feedback) | Status badges: 6px, 2px edge, mono uppercase, always with a word.                                                                                                                                            |
| `EmptyPanel`                                                            | Empty/error state: headline, one line, one action.                                                                                                                                                           |
| `BrandSheet`                                                            | Phone bottom sheet (Modules). Same props as AmazeUI `AppLibrary`.                                                                                                                                            |
| `PageSkeleton`, `ListSkeleton`                                          | Loading placeholders.                                                                                                                                                                                        |
| `useSubpageStack` + `SubpageScreen`                                     | In-page sub-screen stack with back.                                                                                                                                                                          |

## Logo — `components/custom/shared/BrandLogo.tsx`

`<BrandLogo variant="mark"|"lockup"|"wordmark" size="sm"|"md"|"lg"|"xl" tagline wordClassName markSrc />`.
Rules in DESIGN_LANGUAGE §4b. `wordClassName="text-cream"` on teal panels;
`markSrc` for the user's alternate app icon.

## Buttons — `components/custom/shared/Button.tsx`

Native `<button>`: 10px, 2px ink edge, mono uppercase label, 44px tall.
Variants: `primary` (teal light / ochre dark), `secondary` (sage), `outline`
(surface), `ghost`, `danger`, `success`, `link`. Sizes `sm` / `md` / `lg` /
`icon`. Props `icon`, `loading`. Icon-only buttons: `ICON_BUTTON` token + an
`aria-label`.

## Badges and chips

- Badge: `rounded-[6px] border-2 px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em]` + a `TONE_BADGE` entry.
- Chip / filter: 10px, 2px edge, min 36px tall; selected = `bg-secondary text-secondary-foreground shadow-brutal-sm`.
- Counts in labels: `MATCHED (4)`.

## Fields

`FIELD_INPUT` / `SEARCH_FIELD` tokens: 44px, 10px, 2px ink edge, surface
fill; focus shows the ochre ring plus a small shadow.

## Page patterns

- **Summary row hero** — add `summary-row` to a page's two-card summary
  grid; the first card becomes the page's one loud card (ochre, ink text).
- **Error pages** — `shared/ErrorScreen` (logo, stamped code, title,
  sentence, actions); `ERROR_PRIMARY/SECONDARY/LINK` button classes. Used
  by `app/not-found.tsx` and the crash card (`ErrorDiagnosticCard`).
- **Grades** — `lib/gradeTone.ts`: one fill per grade letter.
- **Dialogs** — `lib/useFocusTrap(ref, open)`: focus in, Tab wraps, focus
  back on close. BottomSheet and BrandSheet use it.
- **Theme switch** — `theme/SidebarThemeSwitch` (Light/Dark/Night; `compact`
  cycles on the rail). Theme choices also in Modules sheet, Settings >
  Appearance, command palette.

## App-level pieces

| Piece                                  | File                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| Sidebar, tablet rail, phone bottom bar | `components/custom/header/NavigationTabs.tsx` (`.brand-sidebar`, `SIDEBAR_ITEM_BRAND`) |
| Modules sheet                          | `components/custom/header/AppLibraryPortal.tsx`                                        |
| Spotlight search                       | `components/custom/shared/CommandPalette.tsx`                                          |
| Sync pill + sheet                      | `components/custom/shared/SyncNotification.tsx`                                        |
| First sync / welcome / sign-in         | `components/custom/onboarding/OnboardingIntro.tsx`                                     |
| Theme switch                           | `components/custom/ThemeToggle.tsx`                                                    |
| Demo banner                            | `components/custom/app/AuthenticatedWorkspace.tsx`                                     |
| Home shortcuts (editable)              | `components/custom/mobile/HomeShortcuts.tsx` (`row` = phone pills, `panel` = xl grid)  |
| Onboarding background                  | `components/custom/onboarding/OnboardingBackdrop.tsx` (`step` shifts the shapes)       |
| Pull down to sync                      | `components/custom/shared/PullToRefresh.tsx` (touch only, Home)                        |
| Calendar export help (Android)         | `components/custom/shared/CalendarExportNote.tsx`                                      |
| Reminder upload + below-target alerts  | `components/custom/app/ReminderScheduler.tsx` (renders nothing)                        |

## Feature libraries (no UI)

- `lib/ics.ts` — timetable / exam `.ics` files and `saveIcs()` (iPhone opens
  Apple Calendar, elsewhere downloads).
- `lib/timetableImage.ts` — the week drawn on a canvas for sharing.
- `lib/reminders.ts`, `lib/reminderCrypto.ts` — reminder planning and
  device-only AES-GCM encryption (also used by `app/sw.ts`).
- `lib/demoDates.ts` — keeps demo dates current; `demoTasks()`, `isDemoSession()`.
- `lib/haptics.ts`, `lib/useEdgeSwipeBack.ts` — phone-app feel.
