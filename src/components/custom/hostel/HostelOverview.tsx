"use client";

import { useEffect, useState } from "react";
import { getTypedStorageItem } from "@/lib/storage";
import { getAssetPath } from "@/lib/utils";
import { getCurrentWeekOfMonth, getSmartMenuText } from "./MessDisplay";
import { BedDouble, CalendarDays, ChevronRight, DoorOpen, ExternalLink, Layers, Shirt, Utensils } from "lucide-react";
import { KeyValue, ListRowText, ListShell, SectionHeader, TitleBlock } from "../shared/primitives";
import { LIST_ROW, TONE_ICON_TILE } from "@/lib/uiTokens";
import TabHelpFooter from "../shared/TabHelpFooter";
import LastSynced from "../shared/LastSynced";

interface HostelOverviewProps {
  hostelData: any;
  setHostelActiveSubTab: (tab: string) => void;
}

export default function HostelOverview({ hostelData, setHostelActiveSubTab }: HostelOverviewProps) {
  const [activeMeal, setActiveMeal] = useState({ name: "Breakfast", time: "7:30 AM - 9:00 AM" });
  const [menuItems, setMenuItems] = useState<string>("");
  const [nextMealCountdown, setNextMealCountdown] = useState<string>("");

  const getActiveMealDetails = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Breakfast: 7:30 AM (450) - 9:00 AM (540)
    // Lunch: 12:30 PM (750) - 2:00 PM (840)
    // Snacks: 4:30 PM (990) - 5:30 PM (1050)
    // Dinner: 7:30 PM (1170) - 9:00 PM (1260)

    if (totalMinutes < 540) {
      const diff = 540 - totalMinutes;
      setNextMealCountdown(`Breakfast ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Breakfast", time: "7:30 AM - 9:00 AM" };
    } else if (totalMinutes < 840) {
      const diff = 840 - totalMinutes;
      setNextMealCountdown(`Lunch ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Lunch", time: "12:30 PM - 2:00 PM" };
    } else if (totalMinutes < 1050) {
      const diff = 1050 - totalMinutes;
      setNextMealCountdown(`Snacks ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Snacks", time: "4:30 PM - 5:30 PM" };
    } else if (totalMinutes < 1260) {
      const diff = 1260 - totalMinutes;
      setNextMealCountdown(`Dinner ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Dinner", time: "7:30 PM - 9:00 PM" };
    } else {
      setNextMealCountdown("Kitchen is closed. Reopens at 7:30 AM");
      return { name: "Breakfast", time: "Tomorrow 7:30 AM" };
    }
  };

  useEffect(() => {
    const meal = getActiveMealDetails();
    setActiveMeal(meal);

    try {
      const isFemale = hostelData.hostelInfo?.gender?.toLowerCase() === "female";
      const genderLetter = isFemale ? "W" : "M";
      const rawType = hostelData.hostelInfo?.messInfo?.toUpperCase() || "VEG";
      const typeLetter = rawType.includes("NON") ? "N" : rawType.includes("SPECIAL") ? "S" : "V";

      const fileName = `VITC-${genderLetter}-${typeLetter}.json`;
      const pick = (list: any[]) => {
        const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const todayMenu = list.find((day: any) => day.Day === weekday);
        const raw = todayMenu?.[meal.name];
        if (raw) setMenuItems(getSmartMenuText(String(raw), getCurrentWeekOfMonth(new Date())));
      };
      const cached = getTypedStorageItem(fileName) as { list?: any[] } | null;
      if (cached?.list?.length) {
        pick(cached.list);
      } else {
        // Nothing cached yet (first visit, demo): use the bundled copy, like Home.
        fetch(getAssetPath(`/data/mess/${fileName}`))
          .then((r) => r.json())
          .then((d) => pick(d?.list ?? []))
          .catch(() => {});
      }
    } catch (e) {
      console.warn("Failed to load cached mess data:", e);
    }
  }, [hostelData]);

  // Extract hostel profile info
  const info = hostelData?.hostelInfo || {};
  const block = info.blockName || "N/A";
  const room = info.roomNo || "N/A";
  const messType = info.messInfo || "N/A";

  // Parse active leaves
  const leaveHistory = hostelData?.leaveHistory || [];
  const parseDate = (dateStr: string) => {
    const parts = dateStr.split(/[-/ ]/);
    if (parts.length === 3) {
      const [day, monthStr, year] = parts;
      const month = new Date(`${monthStr} 1, 2000`).getMonth();
      return new Date(Number(year), month, parseInt(day));
    }
    return new Date(dateStr);
  };
  const now = new Date();
  const activeLeaves = leaveHistory.filter((leave: any) => {
    const from = parseDate(leave.from);
    const to = parseDate(leave.to);
    const daysSinceEnd = (now.getTime() - to.getTime()) / (1000 * 60 * 60 * 24);
    return (from <= now && now <= to) || from > now || (daysSinceEnd > 0 && daysSinceEnd <= 3);
  });
  const activeLeave = activeLeaves[0];

  const menuLines = menuItems
    .split("\n")
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  const sections = [
    {
      id: "mess",
      title: "Mess menu",
      desc: "The whole week, every meal",
      icon: Utensils,
      tone: "amber",
    },
    {
      id: "laundry",
      title: "Laundry",
      desc: "Your block's washing days",
      icon: Shirt,
      tone: "sky",
    },
    {
      id: "leave",
      title: "Leaves & outings",
      desc: activeLeave
        ? `${activeLeave.leaveType || "Leave"} · ${String(activeLeave.status || "Requested").toLowerCase()}`
        : "No active leave",
      icon: CalendarDays,
      tone: activeLeave ? "emerald" : "zinc",
    },
    {
      id: "counselling",
      title: "Room counselling",
      desc: "Group requests and allocation status",
      icon: BedDouble,
      tone: "violet",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <TitleBlock eyebrow="Hostel" title="Hostel Hub" subtitle="Mess menu, laundry, leave and room counselling" />
        <LastSynced ops={["hostel"]} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Today's meal: the one thing most people open this page for. */}
        <button
          type="button"
          onClick={() => setHostelActiveSubTab("mess")}
          className="flex w-full flex-col gap-3 rounded-[14px] border-2 border-border-ink bg-surface p-4 text-left shadow-brutal-sm brutal-press cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${TONE_ICON_TILE.amber}`}
            >
              <Utensils className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-label text-xs font-semibold text-text-muted">
                {activeMeal.name === "Breakfast" && activeMeal.time.startsWith("Tomorrow")
                  ? "Next meal"
                  : "Now serving"}
              </p>
              <p className="font-outfit text-lg font-bold leading-tight text-text-heading">{activeMeal.name}</p>
            </div>
            <span className="shrink-0 font-mono text-xs font-semibold text-text-muted">{activeMeal.time}</span>
          </div>
          {menuLines.length ? (
            <ul className="grid gap-1 rounded-[10px] border-2 border-border-ink bg-surface-secondary p-3 text-sm text-text-primary">
              {menuLines.slice(0, 5).map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
              {menuLines.length > 5 ? (
                <li className="pl-3.5 text-xs text-text-muted">+{menuLines.length - 5} more</li>
              ) : null}
            </ul>
          ) : (
            <p className="rounded-[10px] border-2 border-dashed border-border-ink p-3 text-sm text-text-muted">
              Open the full menu to load this week&apos;s menu.
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-muted">{nextMealCountdown}</p>
            <span className="inline-flex items-center gap-1 font-label text-sm font-semibold text-primary">
              Full menu <ChevronRight className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </button>

        <div className="space-y-6">
          {/* Room facts from VTOP. */}
          <div className="space-y-3">
            <SectionHeader icon={DoorOpen} title="Your room" />
            <div className="grid grid-cols-3 gap-2">
              <KeyValue label="Block" value={block} />
              <KeyValue label="Room" value={room} />
              <KeyValue label="Mess" value={<span className="capitalize">{String(messType).toLowerCase()}</span>} />
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader icon={Layers} title="Sections" count={sections.length} />
            <ListShell>
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setHostelActiveSubTab(s.id)}
                    className={`${LIST_ROW} cursor-pointer`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${TONE_ICON_TILE[s.tone]}`}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <ListRowText title={s.title} subtitle={s.desc} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
                  </button>
                );
              })}
            </ListShell>
          </div>
        </div>
      </div>

      <a
        href="https://vtopcc.vit.ac.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-1 text-xs font-semibold text-primary hover:underline"
      >
        Leave, outing and mess change requests are filed on VTOP
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>

      <TabHelpFooter tabId="hostel" />
    </div>
  );
}
