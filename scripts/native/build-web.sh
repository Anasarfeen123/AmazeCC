#!/usr/bin/env bash
# Static export for the native shells: out/ with no base path (the apps serve
# from their own origin, not /AmazeCC/). Skipped when SKIP_WEB_BUILD=1 and
# out/ already exists (CI builds it once and shares it).
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ "${SKIP_WEB_BUILD:-}" = "1" ] && [ -f out/index.html ]; then
  echo "Using existing out/"
  exit 0
fi
unset PAGES_BASE_PATH
NEXT_TELEMETRY_DISABLED=1 node_modules/.bin/next build --webpack
node scripts/prune-sw-precache.js
