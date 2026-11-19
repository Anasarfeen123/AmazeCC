#!/usr/bin/env python3
"""
brandify.py — move a screen's Tailwind classes onto the AmazeCC brand tokens.

Usage:  python3 scripts/redesign/brandify.py <file.tsx> [...] [--dry] [--status] [--forced-dark]

  --status       also map emerald/amber/rose/red text, tints and borders to the
                 success/warning/danger tokens (check each still has a word).
  --forced-dark  for screens built as always-dark (no `dark:` pairs): map the
                 lone zinc-950/900/800 + text-white classes to theme tokens.

Conservative, pattern-based rewrites of the class strings the vibe-coded
screens repeat everywhere (zinc greys, indigo accents, 9-11px type, gradients,
glass, 24-32px radii). It only touches text inside quotes/backticks that looks
like Tailwind classes; it never changes logic.

Always review the diff and look at the screen afterwards (scripts/redesign/
shot.mjs). Things it deliberately leaves for a human:
  - which element is the "one loud thing" on a card,
  - layout/decluttering decisions,
  - status colours that need a word next to them.

Order matters: paired light/dark patterns run before single-token fallbacks.
"""
import re
import sys

OP = r"(?:/\d{1,3})?"  # optional opacity suffix, e.g. /80

RULES = [
    # ── type ──────────────────────────────────────────────────────────
    (r"text-\[(?:9|10|10\.5|11)px\]", "text-xs"),
    (r"\bfont-black\b", "font-bold"),
    (r"\bfont-extrabold\b", "font-bold"),
    # ── text colour pairs ─────────────────────────────────────────────
    (rf"\btext-(?:zinc|gray|slate)-(?:900|950){OP} dark:text-(?:white|zinc-(?:50|100)){OP}", "text-text-heading"),
    (rf"\btext-(?:zinc|gray|slate)-(?:700|800){OP} dark:text-(?:zinc|gray|slate)-(?:100|200|300){OP}", "text-text-primary"),
    (rf"\btext-(?:zinc|gray|slate)-(?:400|500|600){OP} dark:text-(?:zinc|gray|slate)-(?:300|400|500|600){OP}", "text-text-muted"),
    (rf"\btext-(?:indigo|blue|sky|violet|purple)-(?:500|600|700|800){OP} dark:text-(?:indigo|blue|sky|violet|purple)-(?:200|300|400){OP}", "text-primary"),
    # ── surface pairs ─────────────────────────────────────────────────
    (rf"\bbg-white{OP} dark:bg-(?:zinc|gray|slate)-(?:800|900|950){OP}", "bg-surface"),
    (rf"\bbg-(?:zinc|gray|slate)-(?:50|100){OP} dark:bg-(?:zinc|gray|slate)-(?:800|900|950){OP}", "bg-surface-secondary"),
    (rf"\bhover:bg-(?:zinc|gray|slate)-(?:50|100|200){OP} dark:hover:bg-(?:zinc|gray|slate)-(?:700|800|900){OP}", "hover:bg-surface-hover"),
    (rf"\bbg-(?:indigo|blue|sky|violet|purple)-(?:50|100){OP} dark:bg-(?:indigo|blue|sky|violet|purple)-(?:900|950){OP}", "bg-secondary"),
    (rf"\bbg-(?:indigo|blue|sky|violet|purple)-500/(?:5|10|15|20)\b", "bg-secondary"),
    # Solid accent fills. The bridge maps blue/indigo 500-700 to dark teal,
    # which vanishes on the dark page (found on the grades bars). Make them the
    # primary fill (teal light / ochre dark); the fill-ink rule fixes the text.
    (r"\btext-white (bg-(?:indigo|blue|violet|purple)-(?:500|600|700))(?![\w/-])", r"\1"),
    (r"\b(?:dark:)?(?:hover:)?bg-(?:indigo|blue|violet|purple)-(?:400|500|600|700|800)(?![\w/-])\s+(?:dark:(?:hover:)?bg-(?:indigo|blue|violet|purple)-\d{3}(?![\w/-])\s*)+", "bg-primary "),
    (r"\bhover:bg-(?:indigo|blue|violet|purple)-(?:600|700|800)(?![\w/-])", "hover:brightness-110"),
    (r"\bdark:(?:hover:)?bg-(?:indigo|blue|violet|purple)-(?:400|500|600|700)(?![\w/-])", ""),
    (r"\bbg-(?:indigo|blue|violet|purple)-(?:500|600|700)(?![\w/-])", "bg-primary"),
    (r"\bbg-sky-(?:400|500)(?![\w/-])(?:\s+dark:bg-sky-\d{3}(?![\w/-]))?", "bg-sage"),
    # ── border pairs → 2px ink edge ──────────────────────────────────
    (rf"\bborder border-(?:zinc|gray|slate)-(?:100|200|300){OP} dark:border-(?:zinc|gray|slate)-(?:700|800|900){OP}", "border-2 border-border-ink"),
    (rf"\bborder-(?:zinc|gray|slate)-(?:100|200|300){OP} dark:border-(?:zinc|gray|slate)-(?:700|800|900){OP}", "border-border-ink"),
    (rf"\bborder border-(?:indigo|blue|sky|violet|purple)-(?:100|200|300){OP} dark:border-(?:indigo|blue|sky|violet|purple)-(?:700|800|900){OP}", "border-2 border-border-ink"),
    (rf"\bborder-(?:indigo|blue|sky|violet|purple)-(?:100|200|300){OP} dark:border-(?:indigo|blue|sky|violet|purple)-(?:700|800|900){OP}", "border-border-ink"),
    # ── single-token fallbacks (after pairs) ─────────────────────────
    (rf"\bdark:(?:text|bg|border|hover:bg|hover:text|hover:border)-(?:zinc|gray|slate)-\d{{2,3}}{OP}", ""),
    (rf"\btext-(?:zinc|gray|slate)-(?:900|950){OP}", "text-text-heading"),
    (rf"\btext-(?:zinc|gray|slate)-(?:700|800){OP}", "text-text-primary"),
    (rf"\btext-(?:zinc|gray|slate)-(?:400|500|600){OP}", "text-text-muted"),
    (rf"\bbg-(?:zinc|gray|slate)-(?:50|100){OP}", "bg-surface-secondary"),
    (rf"\bbg-(?:zinc|gray|slate)-(?:200|300){OP}", "bg-surface-tertiary"),
    (rf"\bhover:bg-(?:zinc|gray|slate)-(?:50|100|200){OP}", "hover:bg-surface-hover"),
    (rf"\bborder-(?:zinc|gray|slate)-(?:100|200|300|700|800){OP}", "border-border-ink"),
    (rf"\bdivide-(?:zinc|gray|slate)-\d{{2,3}}{OP}", "divide-border-muted"),
    (rf"\bhover:text-(?:indigo|blue|sky|violet|purple)-\d{{3}}{OP} dark:hover:text-(?:indigo|blue|sky|violet|purple)-\d{{3}}{OP}", "hover:text-primary"),
    (rf"\b(?:dark:)?(?:hover:)?text-(?:indigo|blue|sky|violet|purple)-(?:400|500|600){OP}(?![\w-])", "text-primary"),
    (rf"\b(?:lg:)?border-(?:indigo|blue|sky|violet|purple)-(?:400|500|600){OP}(?![\w-])", "border-border-ink"),
    (rf"\bdark:border-(?:indigo|blue|sky|violet|purple)-\d{{3}}{OP}(?![\w-])", ""),
    (rf"\b(lg:)?ring-(?:indigo|blue|sky|violet|purple)-\d{{3}}{OP}(?![\w-])", r"\1ring-border-ink"),
    (rf"\btext-(?:zinc|gray|slate)-(?:200|300){OP}(?![\w-])", "text-text-muted"),
    # odd grey steps (gray-150, zinc-455, slate-655…) by range
    (r"\b(?:hover:)?text-(?:zinc|gray|slate)-(?:[34]\d\d|5\d\d|6\d\d)(?:/\d{1,3})?(?![\w-])", "text-text-muted"),
    (r"\b(?:hover:)?text-(?:zinc|gray|slate)-(?:[789]\d\d)(?:/\d{1,3})?(?![\w-])", "text-text-primary"),
    (r"\bborder-(?:zinc|gray|slate)-\d{2,3}(?:/\d{1,3})?(?![\w-])", "border-border-muted"),
    (r"\bdivide-(?:zinc|gray|slate)-\d{2,3}(?:/\d{1,3})?(?![\w-])", "divide-border-muted"),
    (r"\bbg-white(?![\w/-])", "bg-surface"),
    (r"\btext-(?:blue|indigo|sky)-\d{3}(?![\w/-])", "text-primary"),
    # ── banned surfaces ───────────────────────────────────────────────
    (r"\b(?:dark:)?bg-gradient-to-[a-z]{1,2}\b", ""),
    (r"\b(?:dark:)?(?:from|via|to)-[a-z]+-\d{2,3}(?:/\d{1,3})?(?![\w-])", ""),
    (r"\b(?:dark:)?(?:from|via|to)-(?:white|black|transparent)(?:/\d{1,3})?(?![\w-])", ""),
    (r"\b(?:dark:|sm:|md:)?backdrop-blur(?:-[a-z0-9]+)?\b", ""),
    (r"\bring-(?:1|2) ring-(?:indigo|blue|sky|violet|purple)-500/\d{1,3}\b", ""),
    # glows and coloured soft shadows (banned: blur shadows / glows)
    (r"\b(?:dark:|hover:|group-hover:)?drop-shadow-\[[^\]\s]*\]", ""),
    (r"\b(?:dark:|hover:)?shadow-\[0_0_[^\]\s]*\]", ""),
    (r"\bshadow-(?:sm|md|lg|xl|2xl) (?:dark:)?shadow-[a-z]+-\d{3}/\d{1,2}(?![\w-])", "shadow-brutal-sm"),
    (r"\b(?:dark:|hover:)?shadow-[a-z]+-\d{3}/\d{1,2}(?![\w-])", ""),
    # dark-only white/black overlays: the dark tokens already cover them
    (r"\bdark:(?:hover:|active:|placeholder:)?(?:border|bg|text)-(?:white|black)(?:/(?:\[[\d.]+\]|\d{1,3}))?(?![\w-])", ""),
    (r"\bdark:placeholder:text-[a-z]+-\d{3}(?![\w-])", ""),
    # inverted (ink) buttons and log boxes
    (r"\bbg-(?:zinc|gray|slate)-900 dark:bg-black/\d{1,3}(?![\w-])", "bg-surface-secondary"),
    (r"\bbg-(?:zinc|gray|slate)-900 hover:bg-(?:zinc|gray|slate)-800(?: active:bg-black)?", "bg-text-primary hover:opacity-90"),
    (r"\bactive:bg-(?:indigo|blue|violet|purple|sky)-\d{3}(?![\w/-])", ""),
    (r"\bhover:bg-(?:indigo|blue|violet|purple|sky)-(?:50|100|105)(?![\w/-])", "hover:brightness-95"),
    (r"\bbg-(?:indigo|blue|violet|purple|sky)-500(?![\w/-])", "bg-primary"),
    (r"\bbg-(?:rose|red)-500/\[0\.0\d\](?![\w-])", "bg-danger-surface"),
    (r"\b(?:hover|active):bg-(?:rose|red)-500/\[[\d.]+\](?![\w-])", "hover:brightness-95"),
    # ── shape ─────────────────────────────────────────────────────────
    (r"\brounded-\[(?:24|28|32)px\]", "rounded-[14px]"),
    (r"\brounded-3xl\b", "rounded-[14px]"),
    (r"\bactive:scale-\[0\.9[5-8]\]|\bactive:scale-95\b|\bhover:scale-\[1\.0[1-3]\]|\bhover:scale-105\b", ""),
]

# Extra rules for screens designed as permanently dark (onboarding, intro):
# single dark classes with no `dark:` pair become theme tokens so the screen
# follows light/dark like the rest of the app. Opt in with --forced-dark.
FORCED_DARK_RULES = [
    (rf"\bbg-(?:zinc|gray|slate|neutral)-950(?:/(?:[6-9]\d|100))?(?![\w/-])", "bg-background"),
    (rf"\bbg-(?:zinc|gray|slate|neutral)-950/\d{{1,2}}(?![\w-])", "bg-surface-secondary"),
    (rf"\bbg-(?:zinc|gray|slate|neutral)-900{OP}(?![\w-])", "bg-surface"),
    (rf"\bbg-(?:zinc|gray|slate|neutral)-800{OP}(?![\w-])", "bg-surface-secondary"),
    (rf"\bhover:bg-(?:zinc|gray|slate|neutral)-(?:700|800|900){OP}(?![\w-])", "hover:bg-surface-hover"),
    (rf"\bborder-(?:zinc|gray|slate|neutral)-(?:600|700|800|900){OP}(?![\w-])", "border-border-ink"),
    (rf"\btext-(?:zinc|gray|slate)-(?:50|100){OP}(?![\w-])", "text-text-primary"),
    (rf"\btext-(?:zinc|gray|slate)-(?:200|300){OP}(?![\w-])", "text-text-secondary"),
    (rf"\bhover:text-(?:white|zinc-(?:100|200|300)){OP}(?![\w-])", "hover:text-text-heading"),
    (rf"\btext-(?:indigo|blue|sky|violet|purple|fuchsia)-(?:200|300|400){OP}(?![\w-])", "text-primary"),
    (rf"\bbg-(?:indigo|blue|sky|violet|purple)-(?:500|600)/(?:\[[0-9.]+\]|\d{{1,2}})(?![\w-])", "bg-secondary"),
    (rf"\bborder-(?:indigo|blue|sky|violet|purple)-500/\d{{1,2}}(?![\w-])", "border-border-ink"),
]

# Status colours on any surface -> status tokens (always paired with a word).
STATUS_RULES = [
    (rf"\b(hover:)?text-(?:emerald|green)-(?:300|400|500|600|700){OP}(?:\s+dark:text-(?:emerald|green)-\d{{3}}{OP})?(?![\w-])", r"\1text-success-foreground"),
    (rf"\b(hover:)?text-(?:amber|yellow|orange)-(?:300|400|500|600|700){OP}(?:\s+dark:text-(?:amber|yellow|orange)-\d{{3}}{OP})?(?![\w-])", r"\1text-warning-foreground"),
    (rf"\b(hover:)?text-(?:rose|red)-(?:300|400|500|600|700){OP}(?:\s+dark:text-(?:rose|red)-\d{{3}}{OP})?(?![\w-])", r"\1text-danger-foreground"),
    (rf"\bbg-(?:emerald|green)-(?:50|500/(?:5|10|15|20))(?:\s+dark:bg-(?:emerald|green)-\d{{3}}{OP})?(?![\w/-])", "bg-success-surface"),
    (rf"\bbg-(?:amber|yellow)-(?:50|500/(?:5|10|15|20))(?:\s+dark:bg-(?:amber|yellow)-\d{{3}}{OP})?(?![\w/-])", "bg-warning-surface"),
    (rf"\bbg-(?:rose|red)-(?:50|500/(?:5|10|15|20))(?:\s+dark:bg-(?:rose|red)-\d{{3}}{OP})?(?![\w/-])", "bg-danger-surface"),
    (rf"\bborder-(?:emerald|green|amber|yellow|rose|red)-(?:100|200|300|400|500){OP}(?:\s+dark:border-(?:emerald|green|amber|yellow|rose|red)-\d{{3}}{OP})?(?![\w-])", "border-border-ink"),
    (rf"\bdark:(?:bg|border)-(?:emerald|green|amber|yellow|rose|red)-(?:900|950){OP}(?![\w-])", ""),
]

CLASSY = re.compile(r'(["`])((?:(?!\1).)*?)\1', re.S)
LOOKS_TW = re.compile(r"\b(?:text|bg|border|rounded|flex|px|py|p|m|gap|font|shadow|w|h)-")


def brandify(src: str, forced_dark: bool = False, status: bool = False) -> tuple[str, int]:
    count = 0

    def fix(m):
        nonlocal count
        q, body = m.group(1), m.group(2)
        if not LOOKS_TW.search(body) or "\n" in body and q == '"':
            return m.group(0)
        new = body
        rules = (FORCED_DARK_RULES if forced_dark else []) + (STATUS_RULES if status else []) + RULES
        # Primary CTA: an accent fill with white text is the brand primary
        # button (teal + paper in light, ochre + ink in dark).
        if re.search(r"(?<![\w:-])bg-(?:indigo|blue|violet|purple|sky)-(?:500|600|700)(?![\w/-])", new) and re.search(r"(?<![\w:-])text-white(?![\w/-])", new):
            new = re.sub(r"(?<![\w:-])bg-(?:indigo|blue|violet|purple|sky)-(?:500|600|700)(?![\w/-])", "bg-primary", new)
            new = re.sub(r"(?<![\w:-])text-white(?![\w/-])", "text-primary-foreground", new)
            new = re.sub(r"(?<![\w-])hover:bg-(?:indigo|blue|violet|purple|sky)-\d{3}(?![\w/-])", "hover:brightness-110", new)
            new = re.sub(r"(?<![\w-])shadow-(?:indigo|blue|violet|purple|sky)-\d{3}/\d{1,2}(?![\w-])", "", new)
            new = re.sub(r"(?<![\w-])shadow-(?:md|lg|xl)(?![\w-])", "shadow-brutal-sm border-2 border-border-ink", new)
            count += 1
        if forced_dark and re.search(r"(?<![\w:-])text-white(?![\w/-])", new) and not re.search(r"(?<![\w:-])bg-(?!surface|background)[a-z]+-\d{3}", new):
            new = re.sub(r"(?<![\w:-])text-white(?![\w/-])", "text-text-heading", new)
            count += 1
        for pat, rep in rules:
            new, n = re.subn(pat, rep, new)
            count += n
        # Pills: a rounded-full element that carries text padding (px + py)
        # is a badge or button, not an avatar/dot/track. Spec radius: 6px for
        # badges (py-0 / py-0.5), 10px for buttons, with a tap-friendly
        # minimum height. Square sizes (w-N h-N) and h-1/h-1.5/h-2 tracks
        # are left round.
        if re.search(r"(?<![\w:-])rounded-full(?![\w-])", new) and re.search(r"(?<![\w:-])px-\d", new) and re.search(r"(?<![\w:-])py-[\d.]+", new):
            small = re.search(r"(?<![\w:-])py-(?:0|0\.5|px)(?![\w.-])", new)
            new = re.sub(r"(?<![\w:-])rounded-full(?![\w-])", "rounded-[6px]" if small else "rounded-[10px]", new)
            if not small and "min-h-" not in new:
                new += " min-h-9"
            count += 1
        if re.search(r"(?<![\w:-])bg-text-primary(?![\w-])", new):
            new = re.sub(r"(?<![\w:-])text-white(?![\w/-])", "text-background", new)
        # A sage (bg-secondary) fill always takes ink text: teal/ochre
        # `text-primary` on sage is unreadable in dark mode.
        if re.search(r"(?<![\w:-])bg-secondary(?![\w-])", new):
            new, n = re.subn(r"(?<![\w:-])text-primary(?![\w-])", "text-secondary-foreground", new)
            count += n
        if new != body:
            # tidy double spaces left by removals, keep template ${} intact
            new = re.sub(r"(?<=\S) {2,}(?=\S)", " ", new)
            new = re.sub(r"^ +| +$", "", new) if q == '"' else new
        return q + new + q

    return CLASSY.sub(fix, src), count


def main(argv):
    dry = "--dry" in argv
    forced = "--forced-dark" in argv
    status = "--status" in argv
    files = [a for a in argv if not a.startswith("--")]
    for f in files:
        src = open(f, encoding="utf8").read()
        out, n = brandify(src, forced_dark=forced, status=status)
        print(f"{f}: {n} rewrites")
        if not dry and out != src:
            open(f, "w", encoding="utf8").write(out)


if __name__ == "__main__":
    main(sys.argv[1:])
