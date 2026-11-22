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

- **Class reminders** (both): _Settings → Notifications → Class reminders_.
  A notification 5, 10 or 15 minutes before each class today and tomorrow,
  with the time and room (`src/lib/nativeReminders.ts`). Android schedules
  real notifications that fire with the app closed; the desktop app fires
  them while it runs (it stays in the tray). Re-planned on every open and
  every timetable sync. Not shown on the website or in the demo account.
- **Android**: system back closes the open sheet, then goes back (the
  overlays use browser history); links to other sites open in the browser;
  teal status bar and splash; edge-to-edge insets via CSS variables (the app
  already pads with `env(safe-area-inset-*)`); adaptive icon on brand teal.
- **Desktop**: one instance (opening it again focuses the window); size and
  position remembered; closing the window keeps AmazeCC in the **tray**
  (left-click opens, menu: Open / Quit); **Start with your computer**
  (Settings, starts hidden in the tray); links to other sites open in the
  system browser; macOS build is universal (Apple Silicon and Intel).
- Both skip the service worker and the install prompt: the files are
  already on the device, and a cached worker would serve the previous
  version after an update.

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
