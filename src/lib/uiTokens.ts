/**
 * Design tokens shared across the app's surfaces.
 *
 * Exactly three surface grammars (tile / list shell / list row) and one button
 * + chip style, so every screen speaks the same visual dialect.
 *
 * Colours are semantic tokens, not zinc steps. That is what makes the accent
 * colour picker reach them: `Main.tsx` repaints `--surface`, `--border-muted`,
 * `--text-heading` and friends on `documentElement` when the palette changes,
 * and anything reading a variable follows. Zinc steps now resolve to those same
 * variables via the `@theme inline` block in `globals.css`, so the ~95 files
 * still written in zinc also follow — but a token that names the variable is
 * legible about why it changes colour, and a zinc step is not.
 *
 * Kept free of any feature-specific import so pages (Libraries, OD hours, exam
 * schedule, …) can all speak the same visual dialect.
 */

/**
 * The shared tile surface. Every "card" in the app is this panel; only the
 * padding, layout and sizing utilities on top differ.
 *
 * Brand spec (src/app/brand.css): 2px ink edge, 14px radius, a 4px hard
 * shadow. The interior is `.card-surface` (plain `--surface`). Only the
 * outermost layer casts a shadow, so anything nested inside a tile should use
 * a border alone, never another TILE.
 */
const TILE_SURFACE = "rounded-[14px] card-surface border-2 border-border-ink shadow-brutal-md";

export const TILE = `${TILE_SURFACE} p-4 sm:p-5 flex flex-col justify-between text-left relative overflow-hidden`;

/**
 * `TILE` plus the interaction affordance.
 *
 * This exact suffix was copy-pasted at every tile call site in Libraries and
 * Simplified Mobile Home. Extracted because the social landing has eleven
 * interactive tiles and a missed suffix reads as a dead surface.
 */
export const TILE_INTERACTIVE = `${TILE} brutal-press cursor-pointer`;

/** The press affordance (lift on hover, sink on press), for any surface. */
const TILE_AFFORDANCE = "brutal-press cursor-pointer";

/**
 * An interactive surface whose children sit in a ROW.
 *
 * `TILE` is a column: it ships `flex flex-col justify-between` so a label, a
 * value and a footer can be pushed apart. A row-shaped surface — a course pill,
 * a nav card, a list entry that is itself a button — must not use it. Appending
 * `flex items-center` to `TILE_INTERACTIVE` does not work, because `flex-col` and
 * `items-center` are different properties: the result is a column whose items
 * are centred, which is the bug this token exists to make impossible.
 *
 * Built on `TILE_CARD` (no flex at all) with the row direction stated outright,
 * so there is nothing to override.
 */
export const TILE_INTERACTIVE_ROW = `${TILE_SURFACE} p-3.5 sm:p-4 flex flex-row items-center justify-between gap-3 text-left relative overflow-hidden ${TILE_AFFORDANCE}`;

/**
 * Same surface as `TILE`, but children stay in normal document flow.
 *
 * Deliberately no `flex flex-col justify-between` and no `relative`: the cards
 * that used this recipe stack plain sections, so adding the column flex (or a
 * containing block) would change their layout.
 */
export const TILE_CARD = `${TILE_SURFACE} p-4 sm:p-5 overflow-hidden`;

/** The boxed search input, shared by the Libraries catalog and Social people search. */
export const SEARCH_FIELD =
  "w-full px-4 py-2.5 min-h-11 rounded-[10px] bg-surface border-2 border-border-ink text-sm font-medium text-text-primary placeholder:text-text-muted placeholder:font-normal focus:shadow-brutal-sm";

export const LIST_SHELL =
  "overflow-hidden rounded-[14px] card-surface border-2 border-border-ink shadow-brutal-sm divide-y divide-border-muted";

export const LIST_ROW =
  "w-full min-h-11 flex items-center gap-3 py-3 px-4 text-left transition-colors hover:bg-surface-secondary";

export const CHIP =
  "font-mono text-xs font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-[6px] bg-surface-secondary text-text-primary border-2 border-border-ink";

export const SECTION_CHIP = CHIP;

export const ICON_BUTTON =
  "inline-flex items-center justify-center min-h-11 min-w-11 p-2.5 rounded-[10px] bg-surface border-2 border-border-ink text-text-primary shadow-brutal-sm brutal-press cursor-pointer shrink-0";

/**
 * Active/inactive segmented-control segments.
 *
 * `SEG_ACTIVE` deliberately carries no text colour: the accent colour is the
 * caller's choice, and baking it in would leave two competing `text-*` classes
 * for the cascade to arbitrate. (The dark surface is `--surface`, which is what
 * all nine segmented controls in the app already use.)
 */
export const SEG_ACTIVE =
  "bg-secondary text-secondary-foreground border-2 border-border-ink shadow-brutal-sm font-bold";
export const SEG_IDLE = "border-2 border-transparent text-text-muted hover:text-text-primary";

/**
 * Pill tone recipes: `bg-<c>-500/10 border-<c>-500/20 text-<c>-600 dark:text-<c>-400`
 *
 * The semantic hues (`red`, `amber`, `emerald`, `violet`, `cyan`) stay fixed on
 * purpose: a "3 absences" badge has to read as red whatever the accent is, and
 * letting the picker repaint it would destroy the meaning. The accent family
 * (`indigo`, `sky`, `blue`) is remapped to `--theme-accent` by the block at the
 * top of `globals.css`, so those follow the picker. `zinc` is neutral and reads
 * the surface tokens.
 */
// Brand mapping: every accent hue is sage (teal family), warnings are ochre
// with ink text, success/danger use the status tokens. Always an ink edge.
// In dark, success/danger are solid mint/coral fills with ink text: the 16%
// tints read as the same dark teal and made dark mode look monochrome.
export const TONE_BADGE: Record<string, string> = {
  red: "bg-danger-surface text-danger-foreground border-border-ink dark:bg-coral dark:text-obsidian",
  amber: "bg-highlight text-highlight-foreground border-border-ink",
  emerald: "bg-success-surface text-success-foreground border-border-ink dark:bg-mint dark:text-obsidian",
  blue: "bg-secondary text-secondary-foreground border-border-ink",
  indigo: "bg-secondary text-secondary-foreground border-border-ink",
  sky: "bg-secondary text-secondary-foreground border-border-ink",
  violet: "bg-secondary text-secondary-foreground border-border-ink",
  cyan: "bg-secondary text-secondary-foreground border-border-ink",
  zinc: "bg-surface-secondary text-text-primary border-border-ink",
};

export const TONE_TEXT: Record<string, string> = {
  red: "text-danger-foreground",
  amber: "text-warning-foreground",
  emerald: "text-success-foreground",
  blue: "text-primary",
  indigo: "text-primary",
  sky: "text-primary",
  violet: "text-primary",
  cyan: "text-primary",
  zinc: "text-text-muted",
};

/**
 * Icon tiles, one brand colour per tone (classes in brand.css "Icon tiles in
 * colour"). Light: soft tint + deep icon; dark/night: deeper tint + bright
 * icon. Before 2026-11-21 sky/blue/violet/indigo were all the same sage.
 */
export type ToneName = "sky" | "sea" | "violet" | "teal" | "mint" | "ochre" | "coral" | "rose" | "apricot" | "neutral";

/** Icon-tile classes for a brand tone (see brand.css "Icon tiles in colour"). */
export function toneClass(tone: ToneName): string {
  return `icon-tone icon-tone-${tone}`;
}

/**
 * One colour per module, shared by every list that shows the module (Tools
 * hub, Modules sheet, Settings hub), so a module looks the same everywhere and
 * neighbouring rows are not all one colour (user, 2026-11-21).
 */
export const MODULE_TONE: Record<string, ToneName> = {
  home: "ochre",
  attendance: "mint",
  "attendance-calendar": "ochre",
  timetable: "ochre",
  academics: "teal",
  "academics-courses": "teal",
  "academics-grades": "mint",
  "academics-schedule": "coral",
  "academics-curriculum": "violet",
  payments: "ochre",
  libraries: "rose",
  transport: "apricot",
  events: "coral",
  clubs: "violet",
  "free-class": "teal",
  "faculty-schedule": "sky",
  "friend-finder": "sea",
  hostel: "sky",
  "hostel-overview": "sky",
  "hostel-mess": "apricot",
  "hostel-laundry": "sea",
  "hostel-leave": "mint",
  "hostel-counselling": "violet",
  "tools-overview": "sea",
  "tools-qbank": "rose",
  "tools-faculty": "violet",
  "tools-social": "sea",
  "tools-cabshare": "apricot",
  "tools-tasks": "sky",
  "tools-marks-predictor": "ochre",
  "tool-od-hours": "coral",
  "attendance-circulars": "neutral",
  "acad-circulars": "neutral",
  ffcs: "violet",
  "paper-scanner": "neutral",
  "student-report": "sky",
  tools: "sea",
  tasks: "sky",
  "attendance-predictor": "mint",
  "tools-attendance-predictor": "mint",
  qbank: "rose",
  "faculty-info": "violet",
  "marks-predictor": "ochre",
  social: "sea",
  cabshare: "apricot",
  "od-hours": "coral",
  circulars: "neutral",
  profile: "neutral",
  settings: "neutral",
  about: "neutral",
};

export function moduleTone(id: string, fallback: ToneName = "teal"): string {
  return toneClass(MODULE_TONE[id] ?? fallback);
}

export const TONE_ICON_TILE: Record<string, string> = {
  sky: "icon-tone icon-tone-sky",
  blue: "icon-tone icon-tone-sea",
  emerald: "icon-tone icon-tone-mint",
  amber: "icon-tone icon-tone-ochre",
  violet: "icon-tone icon-tone-violet",
  red: "icon-tone icon-tone-coral",
  indigo: "icon-tone icon-tone-teal",
  zinc: "icon-tone icon-tone-neutral",
  rose: "icon-tone icon-tone-rose",
  apricot: "icon-tone icon-tone-apricot",
};

export const EMPTY_STATE = "p-8 rounded-[14px] border-2 border-dashed border-border-ink text-center";

export const FIELD_INPUT =
  "w-full px-4 py-2.5 min-h-11 rounded-[10px] bg-surface border-2 border-border-ink text-sm font-medium text-text-primary placeholder:text-text-muted placeholder:font-normal focus:shadow-brutal-sm";

/**
 * Size and surface for the `OptionPicker` trigger (shared/primitives).
 *
 * `OptionPicker` puts `className` on its own wrapper `div` and renders the
 * trigger as that div's first child, so the trigger's hard-coded chrome
 * (`h-9 rounded-md border-input bg-transparent`) has to be overridden through
 * the wrapper. `[&>button:first-child]` rather than `[&>div:first-child]`: the
 * trigger is a real `<button>`, and on the mobile path the component also renders
 * a modal `div` inside that same wrapper, which a `div` selector would catch.
 *
 * **Height and font size are deliberately not here.** Tailwind emits `h-*` in
 * ascending order, so a caller's `[&>button:first-child]:h-9` would be *beaten*
 * by an `h-10` set here no matter which came later in the class string — and
 * the trigger's label is a child with its own size, which a size on the button
 * cannot override anyway. `SelectField` takes a `size` prop for both.
 */
export const OPTION_PICKER_TRIGGER =
  "[&>button:first-child]:rounded-[10px] [&>button:first-child]:border-2 [&>button:first-child]:border-border-ink " +
  "[&>button:first-child]:bg-surface [&>button:first-child]:font-semibold [&>button:first-child]:shadow-brutal-sm " +
  "[&>button:first-child_span]:font-semibold [&>button:first-child_span]:text-text-primary";

/**
 * Trigger height, and the size of the label inside it.
 *
 * The label is a child of the button carrying its own `text-sm`, so its size has
 * to be set on the child or the button's size is simply ignored.
 */
const OPTION_PICKER_SIZE: Record<string, string> = {
  // Inline controls that sit in a header strip or a chip row.
  xs: "[&>button:first-child]:h-6 [&>button:first-child]:px-2 [&>button:first-child_span]:text-xs",
  sm: "[&>button:first-child]:h-7 [&>button:first-child]:px-2.5 [&>button:first-child_span]:text-xs",
  // Compact fields: the old `py-1.5` selects.
  md: "[&>button:first-child]:h-8 [&>button:first-child]:px-3 [&>button:first-child_span]:text-xs",
  lg: "[&>button:first-child]:h-11 [&>button:first-child]:px-4 [&>button:first-child_span]:text-sm",
  // The default: what the native `<select>`'s `py-3` used to give.
  xl: "[&>button:first-child]:h-10 [&>button:first-child]:px-3 [&>button:first-child_span]:text-sm",
  // A bare text link in a header — height has to collapse to the line box.
  auto: "[&>button:first-child]:h-auto [&>button:first-child]:p-0 [&>button:first-child_span]:text-xs",
};

export const optionPickerSize = (size: string): string => OPTION_PICKER_SIZE[size] ?? OPTION_PICKER_SIZE.xl;

/** Small ghost action used for secondary row/page actions (Libraries, dues). */
export const GHOST_BUTTON =
  "inline-flex items-center gap-1.5 px-3 py-1.5 min-h-9 rounded-[10px] border-2 border-transparent font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-primary hover:border-border-ink hover:bg-surface transition-colors cursor-pointer shrink-0";
