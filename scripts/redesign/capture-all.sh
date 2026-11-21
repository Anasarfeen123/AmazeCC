#!/usr/bin/env bash
# Capture every main screen at seven device sizes in light / dark / night.
#
#   bash scripts/redesign/capture-all.sh            # everything
#   THEMES="night" bash scripts/redesign/capture-all.sh
#
# Output: ../.scratch/screens/<date>/<device>/<theme>/<page>.png
# Devices: mobile-1 (360x780, small Android), mobile-2 (390x844, iPhone),
# mobile-3 (430x932, large iPhone), tablet (820x1180), pc-1 (1280x800),
# pc-2 (1440x900), pc-3 (1920x1080).
# Uses the demo account; needs the dev server on :3017. ../.scratch is
# git-ignored: never commit captures.
set -euo pipefail
cd "$(dirname "$0")/../.."
SHOT="$(pwd)/scripts/redesign/shot.mjs"
ROOT="$(pwd)/../.scratch/screens/$(date +%Y-%m-%d)"
THEMES=${THEMES:-"light dark night"}
SIZES=${SIZES:-"mobile-1:360:780:1,mobile-2:390:844:1,mobile-3:430:932:1,tablet:820:1180:1,pc-1:1280:800:0,pc-2:1440:900:0,pc-3:1920:1080:0"}
APP_ROUTES=${APP_ROUTES:-"home=/,calendar=/?tab=attendance-calendar,courses=/?tab=academics-courses,grades=/?tab=academics-grades,exams=/?tab=academics-schedule,predictor=/?tab=tools-attendance-predictor,ffcs-in-app=/?tab=ffcs,payments=/?tab=payments,libraries=/?tab=libraries,hostel=/?tab=hostel-overview,tools=/?tab=tools-overview,scanner=/?tab=paper-scanner,settings=/?tab=profile"}
GUEST_ROUTES=${GUEST_ROUTES:-"landing=/,sign-in=/?signin=1,ffcs-planner=/ffcs/"}

mkdir -p "$ROOT"
for t in $THEMES; do
  (
    BATCH_DIR="$ROOT/.tmp-app-$t" BATCH_ROUTES="$APP_ROUTES" BATCH_SIZES="$SIZES" NAV_WAIT=6000 \
      timeout 3000 node "$SHOT" x / "$t" >"$ROOT/.log-app-$t" 2>&1 || echo "app $t failed (see $ROOT/.log-app-$t)"
    GUEST=1 NO_RELOAD=1 BATCH_DIR="$ROOT/.tmp-guest-$t" BATCH_ROUTES="$GUEST_ROUTES" BATCH_SIZES="$SIZES" NAV_WAIT=7000 \
      timeout 1800 node "$SHOT" x / "$t" >"$ROOT/.log-guest-$t" 2>&1 || echo "guest $t failed (see $ROOT/.log-guest-$t)"
  ) &
done
wait

# <tmp>/<device>/<page>.png  ->  <device>/<theme>/<page>.png
for t in $THEMES; do
  for kind in app guest; do
    src="$ROOT/.tmp-$kind-$t"
    [ -d "$src" ] || continue
    for dev in "$src"/*/; do
      d=$(basename "$dev")
      mkdir -p "$ROOT/$d/$t"
      mv "$dev"*.png "$ROOT/$d/$t/" 2>/dev/null || true
    done
    rm -rf "$src"
  done
done
echo "Saved to $ROOT"
find "$ROOT" -name '*.png' | wc -l | xargs echo "screenshots:"
