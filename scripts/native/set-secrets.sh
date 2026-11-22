#!/usr/bin/env bash
# Load the app signing keys from ~/.config/amazecc into the GitHub Actions
# secrets of a repository (default: the origin of this checkout's fork).
#   bash scripts/native/set-secrets.sh [owner/repo]
# Prints only the secret names, never their values.
set -euo pipefail
REPO="${1:-Anasarfeen123/AmazeCC}"
K="$HOME/.config/amazecc"
set -a
. "$K/android-release.env"
. "$K/tauri-updater.env"
set +a
base64 -w0 "$K/android-release.jks" | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO"
printf '%s' "$ANDROID_KEYSTORE_PASSWORD" | gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$REPO"
printf '%s' "$ANDROID_KEY_ALIAS" | gh secret set ANDROID_KEY_ALIAS --repo "$REPO"
printf '%s' "$ANDROID_KEY_PASSWORD" | gh secret set ANDROID_KEY_PASSWORD --repo "$REPO"
gh secret set TAURI_SIGNING_PRIVATE_KEY --repo "$REPO" < "$K/tauri-updater.key"
printf '%s' "$TAURI_SIGNING_PRIVATE_KEY_PASSWORD" | gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD --repo "$REPO"
echo "Set on $REPO:"
gh secret list --repo "$REPO" | awk '{print "  " $1}'
