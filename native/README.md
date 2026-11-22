# Native apps

AmazeCC ships as a website, an Android app and desktop apps. All three run the
**same static export** (`out/`, from `next build`): the apps are thin shells
around it, so a web change is an app change with no extra code.

| App                     | Shell                                  | Folder              | Output                                           |
| ----------------------- | -------------------------------------- | ------------------- | ------------------------------------------------ |
| Android                 | [Capacitor 8](https://capacitorjs.com) | `native/capacitor/` | `.apk`                                           |
| Windows / macOS / Linux | [Tauri 2](https://tauri.app)           | `native/tauri/`     | `.exe`/`.msi`, `.dmg`, `.AppImage`/`.deb`/`.rpm` |

## Automated builds

`.github/workflows/native-apps.yml` builds everything on GitHub:

- **Every push to `redesign`**, or _Actions → Native apps → Run workflow_:
  builds the APK and the three desktop installers and attaches them to the run
  (_Artifacts_ at the bottom of the run page).
- **A tag `app-v<version>`** also publishes a GitHub Release (marked
  pre-release) with every file:

  ```sh
  git tag app-v0.2.0 && git push fork app-v0.2.0
  ```

Versions: a tag `app-v0.2.0` gives version `0.2.0`; other runs are
`0.1.<run number>`. The Android `versionCode` is `1000 + run number`, so every
build installs over the previous one.

### Signing the Android release

Without secrets the workflow ships the **debug-signed** APK. It installs and
works, but Android treats each debug key as a different app, and the Play
Store rejects it. For a proper release, make one keystore and keep it safe
(losing it means users must uninstall to update):

```sh
keytool -genkey -v -keystore amazecc-release.jks -alias amazecc \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 amazecc-release.jks   # paste into the secret below
```

Repository _Settings → Secrets and variables → Actions_:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`
(`amazecc`), `ANDROID_KEY_PASSWORD`. Never commit the `.jks` file.

## Building locally

```sh
bash scripts/native/build-web.sh       # out/ with no base path
bash scripts/native/build-desktop.sh   # this OS's installers
bash scripts/native/build-android.sh   # APKs; needs JDK 21 + Android SDK
```

- Desktop needs Rust; on Linux also `webkit2gtk-4.1`, `libappindicator` and
  `librsvg` development packages. Output:
  `native/tauri/src-tauri/target/release/bundle/`.
- Android needs JDK 21 and the Android SDK (`ANDROID_HOME`). Output:
  `native/capacitor/android/app/build/outputs/apk/`. To run on a phone with
  USB debugging: `adb install -r <apk>`.
- `SKIP_WEB_BUILD=1` reuses an existing `out/`.

## What the shells add

- **Reminders** (both): _Settings → Notifications_.
  - **Class reminders**: 5, 10 or 15 minutes before each class today and
    tomorrow, with time and room.
  - **Exam reminders**: 8 pm the evening before and an hour before each
    exam in the next three weeks (on by default once reminders are on).
  - Android schedules real notifications that fire with the app closed; the
    desktop app fires them while it runs (it stays in the tray). Re-planned
    on every open, return to the app and sync; off in the demo account.
    Code: `src/lib/nativeReminders.ts`.
- **Android**
  - **Fingerprint lock**: asks for fingerprint, face or the phone's screen
    lock when the app opens and after 30 s away
    (`NativeAppLock.tsx`, `AmazeNativePlugin.java`). Turning it on asks once
    first, so nobody locks themselves out.
  - **Home-screen widget** "Next class": time, course, room and attendance
    (`NextClassWidget.java`). It picks the next class against the clock each
    time it draws, so it stays right between syncs; tap opens the app.
  - **Update check**: once a day the app compares its version with the
    latest GitHub Release and offers the new APK (`src/lib/appUpdates.ts`);
    _Settings → Android app_ shows the version and a Check now button.
  - System back closes the open sheet, then goes back; links to other sites
    open in the browser; teal status bar and splash; edge-to-edge insets via
    CSS variables; adaptive icon on brand teal.
- **Desktop**
  - **Auto-update**: on launch it reads `latest.json` from the latest GitHub
    Release, verifies the signature against the public key in
    `tauri.conf.json`, installs, and says so in a notification (the new
    version runs next time).
  - **Tray**: closing the window keeps AmazeCC in the tray (left-click opens;
    Open / Quit menu). **Start with your computer** (Settings) starts it
    hidden in the tray.
  - One instance, remembered window size, links to other sites open in the
    browser; macOS build is universal (Apple Silicon and Intel).
- Both skip the service worker and the install prompt.

## Keys and secrets

Two signing keys live **only** on the maintainer's machine, in
`~/.config/amazecc/` (never in the repo):

| File                                          | Used for                | GitHub secrets                                                                                      |
| --------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `android-release.jks` + `android-release.env` | signing the release APK | `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` |
| `tauri-updater.key` + `tauri-updater.env`     | signing desktop updates | `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`                                   |

Load them into the repository secrets once (`scripts/native/set-secrets.sh`).
Back both files up: losing the Android key means users must uninstall to
update; losing the updater key means existing desktop installs stop
updating. Without the secrets, builds still work (debug APK, no updater
files).

The web app detects the shell with `nativeShell()` in `src/lib/nativeShell.ts`.

## Updating icons

```sh
cd native/capacitor && npx capacitor-assets generate --android \
  --iconBackgroundColor '#004643' --splashBackgroundColor '#004643'
cd native/tauri && npm run icons
```

## Ideas for next steps

- Exam-day reminders (FAT / CAT) on top of class reminders.
- A home-screen widget (next class, attendance) — needs a little Kotlin.
- Fingerprint lock for the stored VTOP password (Android Keystore).
- Desktop: tray icon with the next class, launch at login, auto-update.
