"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/sync-engine";
import { getTypedStorageItem } from "@/lib/storage";
import { isFresherRegNo } from "@/lib/fresher";

interface DashboardWelcomeStateOptions {
  demoMode: boolean;
  interfaceChosen?: boolean;
  /** Registration number; only first-years (see `isFresherRegNo`) get the hub. */
  regNumber?: string;
}

export function useDashboardWelcomeState({ demoMode, interfaceChosen, regNumber }: DashboardWelcomeStateOptions) {
  const [showFresherWelcome, setShowFresherWelcome] = useState(false);
  const [fresherEptData, setFresherEptData] = useState<any>(null);
  const [fresherAckData, setFresherAckData] = useState<any>(null);
  const [fresherResources, setFresherResources] = useState<any[]>([]);
  const [showInterfaceOnboarding, setShowInterfaceOnboarding] = useState(false);

  useEffect(() => {
    try {
      const hasChosen = getTypedStorageItem("has_selected_interface") === "true" || interfaceChosen === true;
      if (!hasChosen) setShowInterfaceOnboarding(true);
    } catch {}
  }, [interfaceChosen]);

  useEffect(() => {
    const handleOpen = () => setShowInterfaceOnboarding(true);
    window.addEventListener("open-interface-selector", handleOpen);
    return () => window.removeEventListener("open-interface-selector", handleOpen);
  }, []);

  useEffect(() => {
    // Demo is a 22BCE senior, so it no longer opens on the fresher hub.
    if (demoMode || !isFresherRegNo(regNumber)) {
      setShowFresherWelcome(false);
      return;
    }

    try {
      const dismissed = getTypedStorageItem("fresherWelcomeDismissed");
      let eptData: any = null;
      let ackData: any = null;
      let hasFresherData = false;

      const w = getTypedStorageItem("cache_whoami") as any;
      if (w) {
        eptData = w?.eptSchedule ?? null;
        ackData = w?.acknowledgement ?? null;
      }

      // Backward compat with old caches
      if (!eptData) {
        eptData = getTypedStorageItem("cache_ept_schedule") as any;
      }
      if (!ackData) {
        ackData = getTypedStorageItem("cache_acknowledgement") as any;
      }

      if (eptData) {
        setFresherEptData(eptData);
        if (eptData.tables?.[0]?.rows?.length > 0 || eptData.message) hasFresherData = true;
      }
      if (ackData) {
        setFresherAckData(ackData);
        if (Array.isArray(ackData.documents) ? ackData.documents.length > 0 : ackData.tables?.[1]?.rows?.length > 0) {
          hasFresherData = true;
        }
      }

      if (hasFresherData && dismissed !== "true") setShowFresherWelcome(true);
    } catch (error) {
      console.error("Failed to load fresher data from typed storage", error);
    }
  }, [demoMode, regNumber]);

  useEffect(() => {
    api("fresher-resources")
      .then((data: any) => {
        if (data?.success && data.resources) setFresherResources(data.resources);
      })
      .catch(() => {});
  }, []);

  return {
    showFresherWelcome,
    setShowFresherWelcome,
    fresherEptData,
    fresherAckData,
    fresherResources,
    showInterfaceOnboarding,
    setShowInterfaceOnboarding,
  };
}
