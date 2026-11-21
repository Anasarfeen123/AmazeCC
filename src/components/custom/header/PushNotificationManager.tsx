"use client";

import { getAssetPath } from "@/lib/utils";

import Switch from "../shared/primitives/Switch";

import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { settingsAtom, unifiedIdentityAtom } from "@/store";
import type { UnifiedUserIdentity } from "@/types";

import { api } from "@/lib/sync-engine";
import {
  Bell,
  Volume2,
  Moon,
  AlertTriangle,
  Calendar,
  BookOpen,
  Utensils,
  FileText,
  Sparkles,
  Send,
  CheckCircle,
  Key,
  Plane,
  Bus,
  BookMarked,
  Award,
  Clock,
} from "lucide-react";
import SelectField from "@/components/custom/shared/primitives/SelectField";

// Cryptographically valid uncompressed NIST P-256 ECDSA VAPID Public Key (65 bytes starting with 0x04)
const DEFAULT_VAPID_PUBLIC_KEY =
  "BPWVsRBGW3upzaJFeMS2vd-U8YheUIu7_d1h4zQKqPv7KH-s27CnpGlZHKnjy0aVqTQmQUjCMIk3LITlQsBZuy8";

function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) return new Uint8Array(0);
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.error("Invalid VAPID Base64 key:", e);
    return new Uint8Array(0);
  }
}

export default function PushNotificationManager() {
  const [settings, setSettings] = useAtom(settingsAtom);
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [fetchStatus, setFetchStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [userID, setUserID] = useState<string | null>(null);
  const unifiedIdentity: UnifiedUserIdentity = useAtomValue(unifiedIdentityAtom);
  const activeUserID = unifiedIdentity.regNumber || userID || "STUDENT";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("IDs");
      if (raw) {
        const parsed = JSON.parse(raw);
        setUserID(parsed?.VtopUsername || "STUDENT");
      }
    } catch {
      setUserID("STUDENT");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register(getAssetPath("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (e) {
      console.warn("Service worker registration error:", e);
    }
  }

  const updateSettingField = (key: keyof typeof settings, value: any) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      return next;
    });
  };

  async function subscribeToPush() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setFetchStatus(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setFetchStatus("Subscription error: Notification permission was denied by browser.");
        return;
      }

      const rawVapidKey =
        settings?.customVapidKey?.trim() ||
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
        DEFAULT_VAPID_PUBLIC_KEY;

      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();

      if (sub) {
        try {
          await sub.unsubscribe();
        } catch {}
      }

      const keyArray = urlBase64ToUint8Array(rawVapidKey);
      try {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyArray,
        });
      } catch (vapidErr: any) {
        console.warn("Uint8Array applicationServerKey failed, trying raw string key:", vapidErr);
        try {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: rawVapidKey,
          });
        } catch (stringErr) {
          throw vapidErr;
        }
      }

      setSubscription(sub);
      updateSettingField("pushNotificationsEnabled", true);

      // Trigger local welcome alert via ServiceWorker to ensure click event opens PWA
      const notificationData = { url: window.location.origin };
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("AmazeCC notifications are on", {
          body: "Notifications are ready. Tap to open AmazeCC.",
          icon: "/favicon.ico",
          data: notificationData,
        });
      } else {
        new Notification("AmazeCC notifications are on", {
          body: "Notifications are ready. Tap to open AmazeCC.",
          icon: "/favicon.ico",
          data: notificationData,
        });
      }

      if (activeUserID) {
        api("notifications/subscribe", {
          method: "POST",
          body: {
            UserID: activeUserID,
            subscription: JSON.parse(JSON.stringify(sub)),
            settings,
          },
        }).catch((err) => console.warn("Backend push sync warning:", err));
      }

      setFetchStatus("Push notifications successfully enabled!");
      setTimeout(() => setFetchStatus(null), 4000);
    } catch (error: any) {
      console.error("Push subscription failed:", error);
      setFetchStatus("Could not enable notifications on this device. Try again after reloading.");
    }
  }

  async function unsubscribeFromPush() {
    if (!subscription) return;
    try {
      await subscription.unsubscribe();
      if (activeUserID) {
        api("notifications/unsubscribe", {
          method: "POST",
          body: {
            UserID: activeUserID,
            endpoint: subscription.endpoint,
          },
        }).catch(() => {});
      }
      setSubscription(null);
      updateSettingField("pushNotificationsEnabled", false);
      setFetchStatus("Unsubscribed from push notifications.");
      setTimeout(() => setFetchStatus(null), 3000);
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      setFetchStatus("Unsubscribe error: Failed to unsubscribe.");
    }
  }

  const sendTestNotification = async () => {
    setIsTesting(true);
    setFetchStatus(null);

    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        throw new Error("Notifications not supported");
      }

      if (Notification.permission !== "granted") {
        const p = await Notification.requestPermission();
        if (p !== "granted") throw new Error("Permission denied");
      }

      const options = {
        body: "Your test notification works. Tap to open AmazeCC.",
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: settings?.pushVibrationEnabled !== false ? [100, 50, 100] : undefined,
        data: { url: window.location.origin },
      };

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("✨ AmazeCC Push Test Passed!", options);
      } else {
        new Notification("✨ AmazeCC Push Test Passed!", options);
      }

      setFetchStatus("Test notification sent successfully!");
    } catch (err: any) {
      console.error("Push test failed:", err);
      setFetchStatus("The test notification could not be sent.");
    } finally {
      setIsTesting(false);
      setTimeout(() => setFetchStatus(null), 4000);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-warning-surface text-warning-foreground border border-border-ink text-xs font-medium">
        Push notifications are not supported in this browser. Please use Chrome, Edge, Safari or Firefox.
      </div>
    );
  }

  const isEnabled = !!subscription && settings?.pushNotificationsEnabled !== false;
  const isErrorStatus = fetchStatus && /error|failed|denied|invalid/i.test(fetchStatus);

  return (
    <div className="space-y-5">
      {/* Master Push Switch Header */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border-2 border-border-ink shadow-xs">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="text-sm font-bold text-text-heading">Push notifications</h4>
            <p className="text-xs text-text-muted">Receive real-time campus reminders on this device</p>
          </div>
        </div>

        <Switch
          checked={isEnabled}
          label="Push notifications"
          onCheckedChange={(checked) => (checked ? subscribeToPush() : unsubscribeFromPush())}
        />
      </div>

      {fetchStatus && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${isErrorStatus ? "bg-danger-surface text-danger-foreground border border-border-ink" : "bg-success-surface text-success-foreground border border-border-ink"}`}
        >
          {isErrorStatus ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          <span>{fetchStatus}</span>
        </div>
      )}

      {isEnabled && (
        <div className="space-y-4 animate-fadeIn">
          {/* Test Push Button */}
          <div className="p-4 rounded-2xl border border-border-ink flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-text-heading flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary" /> Test Notification System
              </p>
              <p className="text-xs text-text-muted mt-0.5">Send a test notification to check your settings</p>
            </div>
            <button
              onClick={sendTestNotification}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send size={13} />
              {isTesting ? "Sending..." : "Test Push"}
            </button>
          </div>

          {/* Trigger Categories */}
          <div className="p-4 rounded-2xl bg-surface border-2 border-border-ink space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted font-outfit">
                Notification Triggers
              </h5>

              {/* Class Reminder Lead Time Selector */}
              <div className="flex items-center gap-1.5 bg-surface-secondary px-2.5 py-1 rounded-xl border-2 border-border-ink">
                <Clock size={12} className="text-primary" />
                <span className="text-xs font-bold text-text-muted">Class Alert:</span>
                <SelectField
                  value={String(settings?.classReminderLeadMinutes || 15)}
                  onChange={(val) => updateSettingField("classReminderLeadMinutes", Number(val))}
                  options={[
                    { value: "10", label: "10m before" },
                    { value: "15", label: "15m before" },
                    { value: "30", label: "30m before" },
                  ]}
                  searchable={false}
                  size="xs"
                  role="group"
                  aria-label="Class alert lead time"
                  className="w-auto shrink-0 [&>button:first-child]:border-none [&>button:first-child]:bg-transparent [&>button:first-child]:px-0 [&>button:first-child]:text-xs [&>button:first-child]:text-primary dark:[&>button:first-child]:text-primary"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: "notifyLowAttendance",
                  label: "Low Attendance Alerts",
                  desc: "Notify immediately when course attendance drops below target",
                  icon: AlertTriangle,
                  color: "text-danger-foreground",
                },
                {
                  key: "notifyClassReminders",
                  label: "Class Timetable Reminders",
                  desc: "Remind before next scheduled lecture starts",
                  icon: Calendar,
                  color: "text-primary",
                },
                {
                  key: "notifyExamAlerts",
                  label: "Exam Schedule & Timetable Alerts",
                  desc: "Alerts for upcoming CAT/FAT exam dates & venues",
                  icon: FileText,
                  color: "text-warning-foreground",
                },
                {
                  key: "notifyMarksRelease",
                  label: "Marks & Grade Release Alerts",
                  desc: "Push notification when new CAT/FAT/Lab marks are published",
                  icon: Award,
                  color: "text-success-foreground",
                },
                {
                  key: "notifyMessServing",
                  label: "Hostel Mess Serving Alerts",
                  desc: "Notifications when Breakfast, Lunch, Snacks or Dinner serving starts",
                  icon: Utensils,
                  color: "text-teal-500",
                },
                {
                  key: "notifyHostelLeave",
                  label: "Hostel Leave & Outpass Approvals",
                  desc: "Instant alert when warden approves or updates leave status",
                  icon: Plane,
                  color: "text-danger-foreground",
                },
                {
                  key: "notifyBusUpdates",
                  label: "Day Scholar Bus Schedule Alerts",
                  desc: "Updates on bus routes, timings and delay alerts",
                  icon: Bus,
                  color: "text-warning-foreground",
                },
                {
                  key: "notifyLibraryBooks",
                  label: "Library Due Date Reminders",
                  desc: "Reminders before Koha library book return deadlines",
                  icon: BookMarked,
                  color: "text-primary",
                },
                {
                  key: "notifyAssignments",
                  label: "LMS & Assignment Reminders",
                  desc: "Remind about pending VITOL / Moodle assignment deadlines",
                  icon: BookOpen,
                  color: "text-primary",
                },
                {
                  key: "notifyCirculars",
                  label: "Academic Circulars & Notices",
                  desc: "Instant alert on new university circulars and announcements",
                  icon: Bell,
                  color: "text-primary",
                },
              ].map((item) => {
                const ItemIcon = item.icon;
                const active = settings[item.key as keyof typeof settings] !== false;
                return (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary border-2 border-border-ink"
                  >
                    <div className="flex items-center gap-2.5">
                      <ItemIcon size={15} className={item.color} />
                      <div>
                        <p className="text-xs font-semibold text-text-primary">{item.label}</p>
                        <p className="text-xs text-text-muted">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={active} onCheckedChange={(val) => updateSettingField(item.key as any, val)} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sound & Quiet Hours */}
          <div className="p-4 rounded-2xl bg-surface border-2 border-border-ink space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted font-outfit">
              Sound & Quiet Hours
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border-2 border-border-ink">
                <div className="flex items-center gap-2">
                  <Volume2 size={15} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Alert Sound</p>
                    <p className="text-xs text-text-muted">Play notification sound</p>
                  </div>
                </div>
                <Switch
                  checked={settings?.pushSoundEnabled !== false}
                  onCheckedChange={(val) => updateSettingField("pushSoundEnabled", val)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border-2 border-border-ink">
                <div className="flex items-center gap-2">
                  <Moon size={15} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Quiet Hours Mode</p>
                    <p className="text-xs text-text-muted">Mute alerts during night</p>
                  </div>
                </div>
                <Switch
                  checked={settings?.pushQuietHoursEnabled === true}
                  onCheckedChange={(val) => updateSettingField("pushQuietHoursEnabled", val)}
                />
              </div>
            </div>

            {settings?.pushQuietHoursEnabled && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary border-2 border-border-ink">
                <span className="text-xs font-bold text-text-primary">Quiet Hours Range:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={settings?.pushQuietHoursStart || "22:00"}
                    onChange={(e) => updateSettingField("pushQuietHoursStart", e.target.value)}
                    className="px-2 py-1 rounded bg-surface border-2 border-border-ink text-xs font-medium text-text-heading"
                  />
                  <span className="text-xs font-bold text-text-muted">to</span>
                  <input
                    type="time"
                    value={settings?.pushQuietHoursEnd || "07:00"}
                    onChange={(e) => updateSettingField("pushQuietHoursEnd", e.target.value)}
                    className="px-2 py-1 rounded bg-surface border-2 border-border-ink text-xs font-medium text-text-heading"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional VAPID Key Customization */}
          <div className="p-4 rounded-2xl bg-surface border-2 border-border-ink space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-muted font-outfit flex items-center gap-1.5">
                <Key size={13} className="text-warning-foreground" /> Custom notification key
              </h5>
              {settings?.customVapidKey && (
                <button
                  onClick={() => updateSettingField("customVapidKey", "")}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Reset Default
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Default key active; enter a custom key for self-hosting"
              value={settings?.customVapidKey || ""}
              onChange={(e) => updateSettingField("customVapidKey", e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-secondary border-2 border-border-ink text-xs font-mono text-text-heading placeholder:text-text-muted focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
