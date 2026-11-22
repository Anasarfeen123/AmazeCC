"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Switch } from "../shared/primitives";
import SelectField from "../shared/primitives/SelectField";
import { settingsAtom } from "@/store/settingsAtoms";
import { nativeShell, type NativeShell } from "@/lib/nativeShell";
import { requestReminderPermission } from "@/lib/nativeReminders";
import { authenticate, biometricAvailable } from "@/lib/nativeAndroid";
import { checkForAppUpdate, installedVersion, type AppUpdate } from "@/lib/appUpdates";

/**
 * Settings that exist only inside the Android / desktop app: class
 * reminders, and (desktop) launching at login. Nothing renders on the website.
 */
export default function NativeAppSettings() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [shell, setShell] = useState<NativeShell>(null);
  const [denied, setDenied] = useState(false);
  const [canLock, setCanLock] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [update, setUpdate] = useState<AppUpdate | null | "none" | "checking">(null);
  useEffect(() => {
    const s = nativeShell();
    setShell(s);
    if (s === "android") {
      void biometricAvailable().then(setCanLock);
      void installedVersion().then(setVersion);
    }
  }, []);
  if (!shell) return null;

  const setAppLock = async (on: boolean) => {
    // Prove it works before relying on it (so nobody locks themselves out).
    if (on && !(await authenticate("Turn on fingerprint lock", "Confirm it is you"))) return;
    setSettings((prev: any) => ({ ...prev, appLock: on }));
  };

  const checkNow = async () => {
    setUpdate("checking");
    setUpdate((await checkForAppUpdate(true)) ?? "none");
  };

  const invoke = (window as any).__TAURI__?.core?.invoke as ((c: string, a?: any) => Promise<any>) | undefined;

  const setReminders = async (on: boolean) => {
    if (on) {
      const ok = await requestReminderPermission();
      setDenied(!ok);
      if (!ok) return;
    }
    setSettings((prev: any) => ({ ...prev, classReminders: on }));
  };

  const setLaunchAtLogin = async (on: boolean) => {
    if (!invoke) return;
    try {
      await invoke(on ? "plugin:autostart|enable" : "plugin:autostart|disable");
      setSettings((prev: any) => ({ ...prev, launchAtLogin: on }));
    } catch {
      /* autostart unavailable on this system */
    }
  };

  return (
    <div className="bg-surface rounded-2xl border-2 border-border-ink p-5 space-y-4 shadow-2xs">
      <h3 className="font-display text-base font-bold uppercase text-text-heading">
        {shell === "android" ? "Android app" : "Desktop app"}
      </h3>

      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-ink bg-surface-secondary p-3.5">
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">Class reminders</p>
          <p className="text-xs text-text-muted">
            A notification before each class today and tomorrow, with the room.
            {shell === "android" ? " The home-screen widget shows your next class too." : ""}
            {shell === "desktop" ? " While AmazeCC is open or in the tray." : ""}
          </p>
          {denied && (
            <p className="mt-1 text-xs font-semibold text-danger-foreground">
              Notifications are blocked. Allow them for AmazeCC in your system settings.
            </p>
          )}
        </div>
        <Switch
          label="Class reminders"
          checked={!!settings?.classReminders}
          onCheckedChange={(v) => void setReminders(v)}
        />
      </div>

      {settings?.classReminders && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-ink bg-surface-secondary p-3.5">
          <p className="text-sm font-bold text-text-primary">Remind me</p>
          <SelectField
            aria-label="Minutes before class"
            size="md"
            searchable={false}
            className="w-40 shrink-0"
            value={String(settings?.classReminderMinutes || 10)}
            options={[
              { value: "5", label: "5 min before" },
              { value: "10", label: "10 min before" },
              { value: "15", label: "15 min before" },
            ]}
            onChange={(v) => setSettings((prev: any) => ({ ...prev, classReminderMinutes: Number(v) }))}
          />
        </div>
      )}

      {settings?.classReminders && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-ink bg-surface-secondary p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Exam reminders</p>
            <p className="text-xs text-text-muted">The evening before (8 pm) and an hour before each exam.</p>
          </div>
          <Switch
            label="Exam reminders"
            checked={settings?.examReminders !== false}
            onCheckedChange={(v) => setSettings((prev: any) => ({ ...prev, examReminders: v }))}
          />
        </div>
      )}

      {shell === "android" && canLock && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-ink bg-surface-secondary p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Fingerprint lock</p>
            <p className="text-xs text-text-muted">
              Ask for your fingerprint or screen lock when AmazeCC opens, and after 30 s away.
            </p>
          </div>
          <Switch label="Fingerprint lock" checked={!!settings?.appLock} onCheckedChange={(v) => void setAppLock(v)} />
        </div>
      )}

      {shell === "android" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-ink bg-surface-secondary p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Version {version ?? "…"}</p>
            <p className="text-xs text-text-muted">
              {update === "checking"
                ? "Checking…"
                : update === "none"
                  ? "You have the latest version."
                  : update
                    ? `Version ${update.version} is available.`
                    : "Updates are checked once a day."}
            </p>
          </div>
          {update && typeof update === "object" ? (
            <a
              href={update.apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 shrink-0 items-center rounded-[10px] border-2 border-border-ink bg-primary px-3 font-mono text-xs font-bold uppercase text-primary-foreground shadow-brutal-sm brutal-press"
            >
              Download
            </a>
          ) : (
            <button
              type="button"
              onClick={() => void checkNow()}
              disabled={update === "checking"}
              className="inline-flex min-h-10 shrink-0 items-center rounded-[10px] border-2 border-border-ink bg-surface px-3 font-mono text-xs font-bold uppercase text-text-heading shadow-brutal-sm brutal-press cursor-pointer disabled:opacity-60"
            >
              Check now
            </button>
          )}
        </div>
      )}

      {shell === "desktop" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-ink bg-surface-secondary p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-text-primary">Start with your computer</p>
            <p className="text-xs text-text-muted">Opens in the tray at login, so reminders keep coming.</p>
          </div>
          <Switch
            label="Start with your computer"
            checked={!!settings?.launchAtLogin}
            onCheckedChange={(v) => void setLaunchAtLogin(v)}
          />
        </div>
      )}
    </div>
  );
}
