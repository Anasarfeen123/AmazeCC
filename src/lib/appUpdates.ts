/**
 * Android app updates outside the Play Store: compare the installed version
 * with the latest GitHub Release (published by .github/workflows/native-apps.yml
 * on an app-v* tag) and offer its APK. The desktop app updates itself
 * (Tauri updater), so this is Android only.
 */
import { nativeShell } from "./nativeShell";

const REPO = process.env.NEXT_PUBLIC_APP_RELEASES_REPO || "Anasarfeen123/AmazeCC";
const LAST_CHECK_KEY = "amazecc.appUpdate.lastCheck";
const DAY_MS = 86_400_000;

export type AppUpdate = { version: string; apkUrl: string; pageUrl: string };

/** "1.10.0" > "1.9.2"; non-numeric parts count as 0. */
export function isNewer(candidate: string, current: string): boolean {
  const a = candidate.split(".").map((n) => parseInt(n, 10) || 0);
  const b = current.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  }
  return false;
}

export async function installedVersion(): Promise<string | null> {
  try {
    const info = await (window as any).Capacitor?.Plugins?.App?.getInfo?.();
    return info?.version ? String(info.version) : null;
  } catch {
    return null;
  }
}

/** The newer release, or null. `force` skips the once-a-day limit. */
export async function checkForAppUpdate(force = false): Promise<AppUpdate | null> {
  if (nativeShell() !== "android") return null;
  try {
    const last = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
    if (!force && Date.now() - last < DAY_MS) return null;
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch {}
  const current = await installedVersion();
  if (!current) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const rel = await res.json();
    const version = String(rel?.tag_name || "").replace(/^app-v/, "");
    if (!version || !isNewer(version, current)) return null;
    const apks = (rel.assets || []).filter((a: any) => /\.apk$/i.test(a?.name || ""));
    const apk = apks.find((a: any) => !/debug/i.test(a.name)) || apks[0];
    if (!apk) return null;
    return { version, apkUrl: apk.browser_download_url, pageUrl: rel.html_url };
  } catch {
    return null;
  }
}
