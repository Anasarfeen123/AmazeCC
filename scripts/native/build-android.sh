#!/usr/bin/env bash
# Build the Android app (Capacitor). Needs JDK 21 and the Android SDK
# (ANDROID_HOME). Output: native/capacitor/android/app/build/outputs/apk/
#   bash scripts/native/build-android.sh            # debug + release APKs
# Release is signed when ANDROID_KEYSTORE_FILE (+ _PASSWORD, ANDROID_KEY_ALIAS,
# ANDROID_KEY_PASSWORD) are set; otherwise use the debug APK.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
bash "$ROOT/scripts/native/build-web.sh"
cd "$ROOT/native/capacitor"
rm -rf www && cp -r "$ROOT/out" www
npm ci --no-audit --no-fund
node_modules/.bin/cap sync android
cd android
chmod +x gradlew
./gradlew --no-daemon assembleDebug assembleRelease
find app/build/outputs/apk -name '*.apk' -print
