"use client";

import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Switch } from "../shared/primitives";
import SelectField from "../shared/primitives/SelectField";
import { settingsAtom } from "@/store/settingsAtoms";
import { nativeShell, type NativeShell } from "@/lib/nativeShell";
import { requestReminderPermission } from "@/lib/nativeReminders";

/**
 * Settings that exist only inside the Android / desktop app: class
 * reminders, and (desktop) launching at login. Nothing renders on the website.
 */
export default function NativeAppSettings() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [shell, setShell] = useState<NativeShell>(null);
  const [denied, setDenied] = useState(false);
  useEffect(() => setShell(nativeShell()), []);
  if (!shell) return null;

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
