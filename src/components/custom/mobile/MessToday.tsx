"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Utensils } from "lucide-react";
import { getTypedStorageItem } from "@/lib/storage";
import { getAssetPath } from "@/lib/utils";
import { getCurrentWeekOfMonth, getSmartMenuText } from "../hostel/MessDisplay";

/**
 * One line on Home for hostellers: the next meal and its first items
 * (critique #13; user: only for hostellers). Reads the menu the Mess page
 * already caches on this device, falling back to the bundled copy; never
 * blocks Home and renders nothing if no menu is available.
 */
const MEALS: Array<{ name: string; until: number }> = [
  { name: "Breakfast", until: 10 },
  { name: "Lunch", until: 15 },
  { name: "Snacks", until: 18 },
  { name: "Dinner", until: 24 },
];

function menuFile(hostelInfo: any): string {
  const g = String(hostelInfo?.gender || "").toLowerCase() === "female" ? "W" : "M";
  const t = String(hostelInfo?.messInfo || "").toUpperCase();
  const k = t.startsWith("NON") ? "N" : t.startsWith("SPECIAL") ? "S" : "V";
  return `VITC-${g}-${k}.json`;
}

export default function MessToday({ hostelInfo, onOpen }: { hostelInfo: any; onOpen: () => void }) {
  const [line, setLine] = useState<{ meal: string; items: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const file = menuFile(hostelInfo);
    const pick = (list: any[]) => {
      const now = new Date();
      const day = now.toLocaleDateString("en-US", { weekday: "long" });
      const row = list.find((r) => String(r?.Day) === day);
      const meal = MEALS.find((m) => now.getHours() < m.until) ?? MEALS[3];
      const raw = row?.[meal.name];
      if (!raw) return;
      const text = getSmartMenuText(String(raw), getCurrentWeekOfMonth(now));
      const items = text
        .split("\n")
        .map((l) => l.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" · ");
      if (alive && items) setLine({ meal: meal.name, items });
    };
    try {
      const cached = getTypedStorageItem(file as any) as { list?: any[] } | null;
      if (cached?.list?.length) {
        pick(cached.list);
        return () => {
          alive = false;
        };
      }
    } catch {}
    fetch(getAssetPath(`/data/mess/${file}`))
      .then((r) => r.json())
      .then((d) => pick(d?.list ?? []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hostelInfo]);

  if (!line) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-12 w-full items-center gap-3 rounded-[12px] border-2 border-border-ink bg-surface px-3 py-2 text-left shadow-brutal-sm brutal-press cursor-pointer"
    >
      <span className="icon-tone icon-tone-apricot flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border-2">
        <Utensils className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs font-bold uppercase tracking-[0.06em] text-text-muted">
          Mess · {line.meal}
        </span>
        <span className="block truncate text-sm font-semibold text-text-heading">{line.items}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden />
    </button>
  );
}
