---
title: "Settings & Profile — Known Issues (full)"
---

# Settings & Profile — Known Issues (full)

1. **Forget credentials doesn't forget data** (by design) — users expecting a nuke are surprised; the sheet says so.
2. **Theme switch cost** — full remount of styled tree; animation disables by `useThemeTransition`; on low-end phones flicker ~200 ms.
3. **Palette on midnight theme** — accent contrast check runs at selection time; some accents rejected on-device but allowed on OLED black panels — honest visual warning, not a bug.
4. **API host pokes prod** — swapping to backup/restore mid-sync unwinds all in-flight requests; banner warns "reliability may drop".
5. **Credit visibility** — the 20+ open-source licenses in About — many people hit it by accident from the 3-line button; intended discovery.

## Local data backup

Settings → Advanced can export app-managed localStorage and Paper Scanner
records, including saved PDFs, to a JSON file. Login credentials, session
tokens, social grant secrets, the credential-vault blob and cryptographic keys
are excluded. Backup files are readable and may contain academic records,
social lists and scanned papers; users should keep them private.

Restore first shows a summary. Merge keeps values already on the device and
adds missing items; replace overwrites backed-up app data and scanner records
while preserving sign-in information. Older settings-only backup files remain
supported and do not clear unrelated local data.
