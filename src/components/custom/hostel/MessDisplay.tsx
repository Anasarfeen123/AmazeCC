"use client";

import { useEffect, useState, useMemo } from "react";
import { useAtomValue } from "jotai";
import { settingsAtom } from "@/store/settingsAtoms";
import { getTypedStorageItem, setTypedStorageItem } from "@/lib/storage";
import { RefreshCcw, Clock, Sparkles, Utensils, Sun, Coffee, Moon, CalendarCheck } from "lucide-react";
import { useIsMobile } from "../shared";
import { WORKER_BASE } from "@/lib/workerBase";

/**
 * Mess menus, served by the AmazeCC worker rather than fetched from unmessify's
 * GitHub Pages in the browser.
 *
 * The worker caches each file for six hours, so one upstream fetch covers the
 * whole campus instead of one per student per visit. The filename is also on an
 * allowlist in the worker, which is why this is a plain map of known files and
 * not something built from user input.
 */
const messLinks: Record<string, Record<string, string>> = {
  Male: {
    "Non Veg": `${WORKER_BASE}/unmessify/VITC-M-N.json`,
    Veg: `${WORKER_BASE}/unmessify/VITC-M-V.json`,
    Special: `${WORKER_BASE}/unmessify/VITC-M-S.json`,
  },
  Female: {
    "Non Veg": `${WORKER_BASE}/unmessify/VITC-W-N.json`,
    Veg: `${WORKER_BASE}/unmessify/VITC-W-V.json`,
    Special: `${WORKER_BASE}/unmessify/VITC-W-S.json`,
  },
};

const fullToShortDay: Record<string, string> = {
  Monday: "MON",
  Tuesday: "TUE",
  Wednesday: "WED",
  Thursday: "THU",
  Friday: "FRI",
  Saturday: "SAT",
  Sunday: "SUN",
};

const shortToFullDay: Record<string, string> = Object.fromEntries(
  Object.entries(fullToShortDay).map(([full, short]) => [short, full]),
);

// Helper to determine current week of month (Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22+)
export const getCurrentWeekOfMonth = (d: Date = new Date()): number => {
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
};

// Smart menu parser: filters items for current week & removes week qualifiers
export const getSmartMenuText = (rawText: string, weekNum: number): string => {
  if (!rawText || typeof rawText !== "string" || rawText.trim() === "" || rawText === "No items listed.") {
    return "No items listed.";
  }

  const lines = rawText.split("\n");
  const resultLines: string[] = [];

  lines.forEach((line) => {
    const l = line.trim();
    if (!l) return;

    if (l.includes("/") && /\bweek/i.test(l)) {
      const candidates = l.split("/");
      let activeCandidate = "";

      for (const cand of candidates) {
        const c = cand.trim();
        const weekMatch = c.match(/\b(?:weeks?|w)\s*[:\(\[]?\s*([\d\s&,and]+)[\)\]]?/i);
        if (weekMatch) {
          const numbers = weekMatch[1].match(/\d+/g)?.map(Number) || [];
          if (numbers.includes(weekNum)) {
            activeCandidate = c
              .replace(/\s*\([^)]*week[^)]*\)/gi, "")
              .replace(/\s*\[[^\]]*week[^\]]*\]/gi, "")
              .replace(/\s*weeks?\s*[\d\s&,and]+/gi, "")
              .trim();
            break;
          }
        } else {
          if (!activeCandidate) {
            activeCandidate = c;
          }
        }
      }

      if (activeCandidate) {
        const cleanCand = activeCandidate.replace(/\/+$/, "").trim();
        if (cleanCand) resultLines.push(cleanCand);
      }
    } else {
      const weekMatch = l.match(/\b(?:weeks?)\s*[:\(\[]?\s*([\d\s&,and]+)[\)\]]?/i);
      if (weekMatch) {
        const numbers = weekMatch[1].match(/\d+/g)?.map(Number) || [];
        if (numbers.length > 0 && !numbers.includes(weekNum)) {
          return;
        }
      }

      const clean = l
        .replace(/\s*\([^)]*week[^)]*\)/gi, "")
        .replace(/\s*\[[^\]]*week[^\]]*\]/gi, "")
        .replace(/\/+$/, "")
        .trim();
      if (clean) resultLines.push(clean);
    }
  });

  return resultLines.length > 0 ? resultLines.join("\n") : rawText.replace(/\s*\([^)]*week[^)]*\)/gi, "").trim();
};

export default function MessDisplay({ hostelData, handleHostelDetailsFetch }: any) {
  if (!hostelData?.hostelInfo?.isHosteller) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted card-surface border-2 border-border-ink rounded-[14px] space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center">
          <Utensils size={28} />
        </div>
        <div>
          <h3 className="text-base font-bold text-text-heading font-outfit">Hostel Mess Information</h3>
          <p className="text-xs text-text-muted mt-1 font-medium max-w-sm">
            You are currently not registered as a Hosteller in VTOP records.
          </p>
        </div>
        <button
          onClick={handleHostelDetailsFetch}
          className="px-4 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCcw className="w-4 h-4" /> Reload Hostel Data
        </button>
      </div>
    );
  }

  const normalizeGender = (g: string) => (g?.toLowerCase() === "female" ? "Female" : "Male");

  const normalizeType = (t: string) => {
    const map: Record<string, string> = {
      VEG: "Veg",
      NON: "Non Veg",
      SPECIAL: "Special",
    };
    return map[t?.toUpperCase()] || "Veg";
  };

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  const currentWeekNum = getCurrentWeekOfMonth();

  const [gender, setGender] = useState(normalizeGender(hostelData.hostelInfo?.gender) || "Male");
  const [type, setType] = useState(normalizeType(hostelData.hostelInfo?.messInfo) || "Veg");
  const settings = useAtomValue(settingsAtom);
  const smartMode = settings?.smartMessFilter ?? false;
  const [menu, setMenu] = useState<any[]>([]);
  const [activeDay, setActiveDay] = useState(today);
  const isMobile = useIsMobile();

  const getInitialMeal = () => {
    const hour = new Date().getHours();
    if (hour < 10) return "Breakfast";
    if (hour < 15) return "Lunch";
    if (hour < 18) return "Snacks";
    return "Dinner";
  };

  const [activeMealMobile, setActiveMealMobile] = useState(getInitialMeal());
  const shortDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  async function fetchMenuWithCache(g: string, t: string) {
    const fileName = `VITC-${g[0].toUpperCase()}-${t[0].toUpperCase()}.json`;
    const localUrl = `/data/mess/${fileName}`;
    const remoteUrl = messLinks[g]?.[t] || messLinks.Male.Veg;

    try {
      const cached = getTypedStorageItem(fileName) as { list?: any[] } | null;
      if (cached?.list) {
        setMenu(cached.list);
      }
    } catch (err) {
      console.warn("Storage read failed:", err);
    }

    if (!getTypedStorageItem(fileName)) {
      try {
        const res = await fetch(localUrl);
        const data = await res.json();
        setMenu(data.list || []);
        setTypedStorageItem(fileName, data);
      } catch (err) {
        console.error("Error loading local mess JSON:", err);
      }
    }

    fetch(remoteUrl, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.list) {
          setMenu(data.list);
          setTypedStorageItem(fileName, data);
        }
      })
      .catch((err) => {
        console.warn("Remote fetch failed, using cached menu:", err);
      });
  }

  useEffect(() => {
    fetchMenuWithCache(gender, type);
  }, [gender, type]);

  const todayMenu = menu.find((day) => day.Day === activeDay);

  const currentActiveMealName = useMemo(() => {
    const hour = new Date().getHours();
    const min = new Date().getMinutes();
    const timeVal = hour + min / 60;
    if (timeVal >= 7 && timeVal < 10.5) return "Breakfast";
    if (timeVal >= 12 && timeVal < 15) return "Lunch";
    if (timeVal >= 16.5 && timeVal < 18.5) return "Snacks";
    if (timeVal >= 19 && timeVal < 21.5) return "Dinner";
    return null;
  }, []);

  const mealsList = [
    {
      name: "Breakfast",
      Icon: Sun,
      time: "7:30 AM - 9:00 AM",
      key: "Breakfast",
      accentColor: "text-warning-foreground",
    },
    {
      name: "Lunch",
      Icon: Utensils,
      time: "12:30 PM - 2:00 PM",
      key: "Lunch",
      accentColor: "text-primary",
    },
    {
      name: "Snacks",
      Icon: Coffee,
      time: "4:30 PM - 5:30 PM",
      key: "Snacks",
      accentColor: "text-success-foreground",
    },
    {
      name: "Dinner",
      Icon: Moon,
      time: "7:30 PM - 9:00 PM",
      key: "Dinner",
      accentColor: "text-primary",
    },
  ];

  const renderMenuContent = (rawText: string) => {
    if (!rawText || rawText.trim() === "" || rawText === "No items listed.") {
      return <p className="text-xs text-text-muted font-medium py-3 text-center">No items listed.</p>;
    }

    // Clean leading line numbers like "1. ", "2) ", etc. from every line
    const cleanedLines = rawText
      .split("\n")
      .map((line) => line.trim().replace(/^(\d+)[\.\)]\s*/, ""))
      .filter(Boolean);

    return (
      <ul className="space-y-2">
        {cleanedLines.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-text-primary leading-relaxed">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-secondary mt-1.5" />
            <span className="flex-1">{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-border-ink">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[10px] text-xs font-bold uppercase tracking-wider bg-secondary text-secondary-foreground border border-border-ink mb-2 min-h-9">
            <Utensils size={11} /> Hostel · Mess
          </div>
          <h1 className="font-title text-[28px] sm:text-[36px] font-extrabold text-text-heading tracking-tight leading-[1.05] break-words">
            Mess menu
          </h1>
          <p className="text-xs text-text-muted mt-0.5 font-medium flex items-center gap-1.5">
            <span>{currentMonth} Schedule</span>
            <span>•</span>
            {smartMode ? (
              <span className="inline-flex items-center gap-1 text-success-foreground font-bold">
                <CalendarCheck size={11} /> Smart Week {currentWeekNum} Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-text-muted font-bold">
                <Sparkles size={11} className="text-primary" /> Standard Menu View
              </span>
            )}
          </p>
        </div>

        {/* Unified Controls Cluster */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Gender Segmented Control */}
          <div className="flex p-1 bg-surface-secondary rounded-xl border-2 border-border-ink">
            {["Male", "Female"].map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  gender === g ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text-heading "
                }`}
              >
                {g === "Male" ? "Men's" : "Women's"}
              </button>
            ))}
          </div>

          {/* Mess Type Control */}
          <div className="flex p-1 bg-surface-secondary rounded-xl border-2 border-border-ink">
            {[
              { id: "Veg", label: "Veg" },
              { id: "Non Veg", label: "Non-Veg" },
              { id: "Special", label: "Special" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  type === t.id ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text-heading "
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Days Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none w-full justify-start sm:justify-center">
        {shortDays.map((short) => {
          const fullDayName = shortToFullDay[short];
          const isSelected = fullDayName === activeDay;
          const isActualToday = fullDayName === today;
          return (
            <button
              key={short}
              onClick={() => setActiveDay(fullDayName)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface text-text-primary border-2 border-border-ink hover:bg-surface-hover"
              }`}
            >
              {isActualToday && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-surface" : "bg-emerald-500"}`} />
              )}
              <span>{short}</span>
            </button>
          );
        })}
      </div>

      {/* Meals Cards Display */}
      {todayMenu ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted font-outfit">
              {activeDay} Menu ({gender} • {type})
            </span>
            {activeDay === today && currentActiveMealName && (
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success-surface text-success-foreground border border-border-ink flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active: {currentActiveMealName}
              </span>
            )}
          </div>

          {isMobile ? (
            /* Mobile Tab Switcher & Single Active Meal View */
            <div className="space-y-4">
              <div className="flex bg-surface-secondary p-1 rounded-xl w-full border-2 border-border-ink">
                {mealsList.map((meal) => {
                  const isActive = activeMealMobile === meal.name;
                  const isCurrentNow = activeDay === today && currentActiveMealName === meal.name;
                  const MealIcon = meal.Icon;
                  return (
                    <button
                      key={meal.name}
                      onClick={() => setActiveMealMobile(meal.name)}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        isActive ? "bg-surface text-primary shadow-xs" : "text-text-muted hover:text-text-heading "
                      }`}
                    >
                      <MealIcon size={13} className={isActive ? meal.accentColor : "text-text-muted"} />
                      <span>{meal.name}</span>
                      {isCurrentNow && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Single Active Meal Card */}
              {(() => {
                const meal = mealsList.find((m) => m.name === activeMealMobile);
                if (!meal) return null;
                const rawText = todayMenu[meal.key] || "";
                const displayText = smartMode ? getSmartMenuText(rawText, currentWeekNum) : rawText;
                const isCurrentNow = activeDay === today && currentActiveMealName === meal.name;
                const MealIcon = meal.Icon;

                return (
                  <div
                    className={`card-surface border ${isCurrentNow ? "border-border-ink dark:border-border-ink" : "border-border-ink"} rounded-2xl p-5 shadow-xs space-y-4`}
                  >
                    <div className="flex items-center justify-between border-b border-border-ink pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                          <MealIcon size={18} className={meal.accentColor} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-heading text-sm font-outfit">{meal.name}</h3>
                            {isCurrentNow && (
                              <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-success-surface text-success-foreground border border-border-ink">
                                Serving Now
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-muted font-medium flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {meal.time}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">{renderMenuContent(displayText)}</div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Desktop 4-Grid Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mealsList.map((meal) => {
                const rawText = todayMenu[meal.key] || "";
                const displayText = smartMode ? getSmartMenuText(rawText, currentWeekNum) : rawText;
                const isCurrentNow = activeDay === today && currentActiveMealName === meal.name;
                const MealIcon = meal.Icon;

                return (
                  <div
                    key={meal.name}
                    className={`rounded-[14px] border-2 border-border-ink p-4.5 transition-all flex flex-col justify-between text-left ${
                      // The meal being served now is the loud card (sage).
                      isCurrentNow ? "bg-secondary shadow-brutal-md" : "card-surface shadow-brutal-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border-ink pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <MealIcon size={18} className="shrink-0 text-text-heading" aria-hidden />
                          <div>
                            <h3 className="font-display text-base font-bold text-text-heading">{meal.name}</h3>
                            <p className="mt-0.5 whitespace-nowrap font-mono text-xs text-text-muted">{meal.time}</p>
                          </div>
                        </div>
                        {isCurrentNow && (
                          <span className="shrink-0 rounded-[6px] border-2 border-obsidian bg-ochre px-1.5 py-0.5 font-mono text-xs font-bold uppercase text-obsidian">
                            Serving now
                          </span>
                        )}
                      </div>

                      <div className="pt-1 min-h-[140px]">{renderMenuContent(displayText)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center card-surface border-2 border-border-ink rounded-2xl">
          <p className="text-xs text-text-muted font-medium">
            No menu found for {activeDay}. Please click reload if data is outdated.
          </p>
        </div>
      )}
    </div>
  );
}
