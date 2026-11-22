#!/usr/bin/env bash
# Build the desktop app (Tauri 2) for the current OS. Needs Rust; on Linux
# also webkit2gtk-4.1, libappindicator and librsvg dev packages.
# Output: native/tauri/src-tauri/target/release/bundle/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$ROOT/scripts/native/build-web.sh"
cd "$ROOT/native/tauri"
npm ci --no-audit --no-fund
node_modules/.bin/tauri build "$@"
