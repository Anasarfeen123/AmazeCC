#!/usr/bin/env python3
"""
contrast.py — WCAG contrast of the brand token pairs, read from src/app/brand.css.

Usage: python3 scripts/redesign/contrast.py

Text pairs need 4.5:1 (AA body); large display numbers and icons 3:1; edges
(borders against the page/surface) 3:1 for non-text contrast. Fails print
with a ✗. Run it after touching any colour in brand.css.
"""
import re
import sys
from pathlib import Path

CSS = Path(__file__).resolve().parents[2] / "src/app/brand.css"


def block(src, selector):
    m = re.search(re.escape(selector) + r"\s*\{(.*?)\n\}", src, re.S)
    return dict(re.findall(r"(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;", m.group(1))) if m else {}


def lum(hex_):
    r, g, b = (int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


PAIRS = [
    # (foreground, background, minimum, what)
    ("--text-primary", "--background", 4.5, "body text on page"),
    ("--text-primary", "--surface", 4.5, "body text on card"),
    ("--text-muted", "--background", 4.5, "muted text on page"),
    ("--text-muted", "--surface", 4.5, "muted text on card"),
    ("--text-muted", "--surface-secondary", 4.5, "muted text on inset"),
    ("--hero-number", "--surface", 3.0, "hero number on card"),
    ("--primary-foreground", "--primary", 4.5, "primary button label"),
    ("--secondary-foreground", "--secondary", 4.5, "text/icon on sage well"),
    ("--highlight-foreground", "--highlight", 4.5, "text on ochre"),
    ("--warning-foreground", "--surface", 4.5, "warning text on card"),
    ("--danger-foreground", "--surface", 4.5, "danger text on card"),
    ("--success-foreground", "--surface", 4.5, "success text on card"),
    ("--border-ink", "--background", 3.0, "edge vs page"),
    ("--border-ink", "--surface", 3.0, "edge vs card"),
    ("--secondary", "--surface", 1.0, "sage well vs card (info)"),
]


def main():
    src = CSS.read_text()
    light = block(src, ":root")
    dark = {**light, **block(src, ".dark")}
    black = {**dark, **block(src, ".dark.black")}  # R7 super-dark theme
    bad = 0
    for name, toks in (("light", light), ("dark", dark), ("black", black)):
        print(f"\n{name}")
        for fg, bg, need, what in PAIRS:
            if fg not in toks or bg not in toks:
                print(f"  ? {what}: {fg}/{bg} not a plain hex")
                continue
            r = ratio(toks[fg], toks[bg])
            ok = r >= need
            bad += not ok
            print(f"  {'✓' if ok else '✗'} {r:5.2f}  (need {need})  {what}  {toks[fg]} on {toks[bg]}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
