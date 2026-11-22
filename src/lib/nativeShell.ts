/**
 * Running inside the Android (Capacitor) or desktop (Tauri) app?
 *
 * Both shells load the same static export as the website, so the app only
 * needs to know where it is in a few places: no service worker (the files
 * are already on the device, and a cached worker would serve the previous
 * version after an app update), no "install the app" prompt, and in the
 * desktop app links to other sites go to the system browser.
 * See native/README.md.
 */
export type NativeShell = "android" | "desktop" | null;

export function nativeShell(): NativeShell {
  if (typeof window === "undefined") return null;
  const w = window as any;
  if (w.Capacitor?.isNativePlatform?.()) return "android";
  if (w.__TAURI__ || w.__TAURI_INTERNALS__) return "desktop";
  return null;
}

/**
 * Desktop app: open links to other sites in the system browser. The Tauri
 * webview would otherwise navigate away from the app (or ignore
 * target="_blank"). Android needs no handler: Capacitor already sends
 * other origins to the browser.
 */
export function installDesktopLinkHandler(): () => void {
  const w = window as any;
  const openUrl: ((url: string) => Promise<void>) | undefined = w.__TAURI__?.opener?.openUrl;
  if (!openUrl) return () => {};
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    let url: URL;
    try {
      url = new URL(a.href, window.location.href);
    } catch {
      return;
    }
    if (!/^https?:$|^mailto:$/.test(url.protocol) || url.origin === window.location.origin) return;
    e.preventDefault();
    openUrl(url.toString()).catch(() => {});
  };
  document.addEventListener("click", onClick, true);
  // window.open("https://…") from code paths (exports, VTOP links).
  const originalOpen = window.open;
  window.open = (url?: string | URL, target?: string, features?: string) => {
    const href = url ? String(url) : "";
    if (/^https?:\/\//.test(href) && !href.startsWith(window.location.origin)) {
      openUrl(href).catch(() => {});
      return null;
    }
    return originalOpen.call(window, url as any, target, features);
  };
  return () => {
    document.removeEventListener("click", onClick, true);
    window.open = originalOpen;
  };
}
