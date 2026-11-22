/**
 * The app-local Android plugin (native/capacitor/android/.../AmazeNativePlugin.java):
 * app lock and home-screen widget data. Every call is a no-op off Android.
 */
function plugin(): any | null {
  const cap = (typeof window !== "undefined" ? (window as any).Capacitor : null) as any;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.AmazeNative ?? null;
}

export async function biometricAvailable(): Promise<boolean> {
  try {
    return !!(await plugin()?.biometricStatus())?.available;
  } catch {
    return false;
  }
}

/** Show the fingerprint / face / screen-lock prompt. Resolves true on success. */
export async function authenticate(title = "Unlock AmazeCC", subtitle = ""): Promise<boolean> {
  try {
    return !!(await plugin()?.authenticate({ title, subtitle }))?.ok;
  } catch {
    return false;
  }
}

export type WidgetClass = { start: number; title: string; detail: string; when: string };

/** Send the home-screen widget its data (it picks the next class itself). */
export async function updateWidget(data: { classes: WidgetClass[]; attendance: string }) {
  try {
    await plugin()?.updateWidget({ data: JSON.stringify(data) });
  } catch {
    /* no widget support */
  }
}
