import { getAssetPath } from "@/lib/utils";
import { useState, useEffect } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Bell, X } from "lucide-react";
import { syncEngine } from "@/lib/sync-engine";
import { getTypedStorageItem, setTypedStorageItem } from "@/lib/storage";

function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) return new Uint8Array(0);
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function PushPromptModal({ UserID }: { UserID: string }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!UserID) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Never show if permission is already granted
    if (Notification.permission === "granted") return;

    // Periodic reminder logic: check when prompt was last shown
    const lastPromptTime = getTypedStorageItem("lastPushPromptTimestamp");
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    const shouldShow = !lastPromptTime || Date.now() - Number(lastPromptTime) > THREE_DAYS_MS;

    if (shouldShow && "serviceWorker" in navigator && "PushManager" in window) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [UserID]);

  const handleClose = () => {
    setTypedStorageItem("lastPushPromptTimestamp", String(Date.now()));
    setIsOpen(false);
  };

  const DEFAULT_VAPID_PUBLIC_KEY =
    "BPWVsRBGW3upzaJFeMS2vd-U8YheUIu7_d1h4zQKqPv7KH-s27CnpGlZHKnjy0aVqTQmQUjCMIk3LITlQsBZuy8";

  const handleEnable = async () => {
    handleClose();

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;

      const registration = await navigator.serviceWorker.register(getAssetPath("/sw.js"));
      await navigator.serviceWorker.ready;

      let sub: PushSubscription | null = null;
      try {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      } catch (vapidErr) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      await syncEngine.sync("notifications-subscribe", {
        UserID,
        subscription: JSON.parse(JSON.stringify(sub)),
        vitol_enabled: false,
        vitol_reminder_day: 1,
        vitol_reminder_time: "10:00",
      });

      new Notification("Welcome to AmazeCC Alerts!", {
        body: "Push notifications are now enabled. Head to Profile > Push Notifications to set up your VITOL class reminder.",
        icon: "/favicon.ico",
      });
    } catch (error) {
      console.error("Push enrollment failed:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+14rem)] md:bottom-6 right-4 left-4 md:left-auto md:w-[350px] bg-white/95 border border-border-muted rounded-2xl p-5 shadow-2xl z-[120] pointer-events-auto"
        >
          <button
            onClick={handleClose}
            aria-label="Dismiss notification prompt"
            className="absolute top-4 right-4 p-1 text-text-muted bg-surface-secondary hover:bg-surface-hover rounded-full transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>

          <div className="flex gap-3.5 mt-1">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
              <Bell size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-text-heading mb-1">Never Miss a Class!</h3>
              <p className="text-xs text-text-muted leading-normal">
                AmazeCC can send you push notifications for your weekly VITOL classes directly to this device.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleEnable}
              className="flex-1 py-2 bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Enable Alerts
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-2 border-2 border-border-ink text-text-muted hover:bg-surface-hover text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
