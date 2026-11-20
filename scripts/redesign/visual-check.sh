#!/usr/bin/env bash
# Visual check: capture key screens in light / dark / night and diff them
# against the previous run, so colour regressions (an ochre number on an
# ochre card, a pale box with pale text) show up as a list, not a user report.
#
# Usage (dev server on :3017, from frontend/):
#   bash scripts/redesign/visual-check.sh            # capture + compare
#   SCREENS="home academics-grades" bash scripts/redesign/visual-check.sh
#   WIDTHS="390" THEMES="dark" bash scripts/redesign/visual-check.sh
#
# Output: ../.scratch/visual/<timestamp>/<screen>_<theme>-w<width>.png, a
# report.txt, and diff_*.png (old | new | changed pixels in red) for screens
# that changed more than THRESHOLD percent. Screens open via /?tab=<id>.
# ../.scratch is git-ignored; never commit captures (they may hold real data
# if you use LOGIN=1).
set -euo pipefail
cd "$(dirname "$0")/../.."
SHOT="$(pwd)/scripts/redesign/shot.mjs"
ROOT="$(pwd)/../.scratch/visual"
SCREENS=${SCREENS:-"home attendance-calendar academics-courses academics-grades academics-schedule payments libraries transport free-class hostel-overview tools-overview tools-tasks"}
THEMES=${THEMES:-"light dark night"}
WIDTHS=${WIDTHS:-"390 1440"}
THRESHOLD=${THRESHOLD:-0.5}

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$ROOT/$STAMP"
PREV=$(ls -1d "$ROOT"/2* 2>/dev/null | tail -1 || true)
mkdir -p "$OUT"

for id in $SCREENS; do
  for t in $THEMES; do
    for w in $WIDTHS; do
      ROUTE="/?tab=$id" ONLY_W="$w" timeout 150 node "$SHOT" "$OUT/${id}_$t" / "$t" >/dev/null 2>&1 || echo "capture failed: $id $t $w"
    done
  done
done

python3 - "$OUT" "${PREV:-}" "$THRESHOLD" <<'EOF'
import sys, os, glob
from PIL import Image, ImageChops
out, prev, thr = sys.argv[1], sys.argv[2], float(sys.argv[3])
lines = []
for f in sorted(glob.glob(os.path.join(out, "*.png"))):
    name = os.path.basename(f)
    old = os.path.join(prev, name) if prev else ""
    if not prev or not os.path.exists(old):
        lines.append(f"new      {name}")
        continue
    a = Image.open(old).convert("RGB"); b = Image.open(f).convert("RGB")
    h = min(a.height, b.height); a = a.crop((0, 0, a.width, h)); b = b.crop((0, 0, b.width, h))
    if a.size != b.size:
        lines.append(f"resized  {name}"); continue
    d = ImageChops.difference(a, b).convert("L").point(lambda p: 255 if p > 24 else 0)
    pct = 100 * sum(d.histogram()[255:]) / (d.width * d.height)
    if pct > thr:
        red = Image.new("RGB", b.size, (225, 97, 98))
        marked = Image.composite(red, b, d)
        sheet = Image.new("RGB", (b.width * 3 + 20, h), "white")
        sheet.paste(a, (0, 0)); sheet.paste(b, (b.width + 10, 0)); sheet.paste(marked, (2 * b.width + 20, 0))
        sheet.save(os.path.join(out, "diff_" + name))
        lines.append(f"CHANGED  {name}  {pct:.1f}%")
    else:
        lines.append(f"same     {name}  {pct:.2f}%")
report = "\n".join(lines)
open(os.path.join(out, "report.txt"), "w").write(report + "\n")
print(report)
print(f"\ncompared with: {prev or '(no previous run)'}\nresults: {out}")
EOF
