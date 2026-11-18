#!/usr/bin/env python3
"""
brandify.py — move a screen's Tailwind classes onto the AmazeCC brand tokens.

Usage:  python3 scripts/redesign/brandify.py <file.tsx> [<file.tsx> ...] [--dry]

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
    # ── banned surfaces ───────────────────────────────────────────────
    (r"\b(?:dark:)?bg-gradient-to-[a-z]{1,2}\b", ""),
    (r"\b(?:dark:)?(?:from|via|to)-[a-z]+-\d{2,3}(?:/\d{1,3})?(?![\w-])", ""),
    (r"\b(?:dark:)?(?:from|via|to)-(?:white|black|transparent)(?:/\d{1,3})?(?![\w-])", ""),
    (r"\b(?:dark:|sm:|md:)?backdrop-blur(?:-[a-z0-9]+)?\b", ""),
    (r"\bring-(?:1|2) ring-(?:indigo|blue|sky|violet|purple)-500/\d{1,3}\b", ""),
    # ── shape ─────────────────────────────────────────────────────────
    (r"\brounded-\[(?:24|28|32)px\]", "rounded-[14px]"),
    (r"\brounded-3xl\b", "rounded-[14px]"),
    (r"\bactive:scale-\[0\.9[5-8]\]|\bactive:scale-95\b|\bhover:scale-\[1\.0[1-3]\]|\bhover:scale-105\b", ""),
]

CLASSY = re.compile(r'(["`])((?:(?!\1).)*?)\1', re.S)
LOOKS_TW = re.compile(r"\b(?:text|bg|border|rounded|flex|px|py|p|m|gap|font|shadow|w|h)-")


def brandify(src: str) -> tuple[str, int]:
    count = 0

    def fix(m):
        nonlocal count
        q, body = m.group(1), m.group(2)
        if not LOOKS_TW.search(body) or "\n" in body and q == '"':
            return m.group(0)
        new = body
        for pat, rep in RULES:
            new, n = re.subn(pat, rep, new)
            count += n
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
    files = [a for a in argv if not a.startswith("--")]
    for f in files:
        src = open(f, encoding="utf8").read()
        out, n = brandify(src)
        print(f"{f}: {n} rewrites")
        if not dry and out != src:
            open(f, "w", encoding="utf8").write(out)


if __name__ == "__main__":
    main(sys.argv[1:])
