"use client";

import { useEffect, useState } from "react";
import { getTypedStorageItem } from "@/lib/storage";
import { ArrowRight, Info, ExternalLink, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@amazecontinuityprojects/amazeui";
import TabHelpFooter from "../shared/TabHelpFooter";

interface HostelOverviewProps {
  hostelData: any;
  setHostelActiveSubTab: (tab: string) => void;
}

export default function HostelOverview({ hostelData, setHostelActiveSubTab }: HostelOverviewProps) {
  const [activeMeal, setActiveMeal] = useState({ name: "Breakfast", icon: "🍳", time: "7:30 AM - 9:00 AM" });
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
      return { name: "Breakfast", icon: "🍳", time: "7:30 AM - 9:00 AM" };
    } else if (totalMinutes < 840) {
      const diff = 840 - totalMinutes;
      setNextMealCountdown(`Lunch ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Lunch", icon: "🍲", time: "12:30 PM - 2:00 PM" };
    } else if (totalMinutes < 1050) {
      const diff = 1050 - totalMinutes;
      setNextMealCountdown(`Snacks ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Snacks", icon: "☕", time: "4:30 PM - 5:30 PM" };
    } else if (totalMinutes < 1260) {
      const diff = 1260 - totalMinutes;
      setNextMealCountdown(`Dinner ends in ${Math.floor(diff / 60)}h ${diff % 60}m`);
      return { name: "Dinner", icon: "🍽️", time: "7:30 PM - 9:00 PM" };
    } else {
      setNextMealCountdown("Kitchen is closed. Reopens at 7:30 AM");
      return { name: "Breakfast", icon: "🍳", time: "Tomorrow 7:30 AM" };
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
      const cached = getTypedStorageItem(fileName) as { list?: any[] } | null;
      if (cached?.list) {
        const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });
        const todayMenu = cached.list.find((day: any) => day.Day === weekday);
        if (todayMenu) {
          setMenuItems(todayMenu[meal.name] || "");
        }
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

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <p className="inline-flex items-center rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 mb-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-secondary-foreground leading-none">
          Hostel
        </p>
        <h1 className="font-display text-[28px] sm:text-[36px] font-bold uppercase text-text-heading tracking-tight leading-[1.05] break-words">
          Hostel Hub
        </h1>
        <p className="text-xs text-text-muted mt-1">Mess menu, laundry slots, leave and room counselling.</p>
      </div>

      {/* Grid Dashboard layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Today's Mess */}
        <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-border-ink transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Mess Dining</span>
              <span className="text-xs text-text-muted font-semibold">{activeMeal.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-text-heading">Current Meal: {activeMeal.name}</h3>
                <p className="text-xs text-text-muted mt-0.5">{nextMealCountdown}</p>
              </div>
            </div>
            <div className="bg-surface-secondary border border-border-muted rounded-xl p-3 text-xs max-h-24 overflow-y-auto">
              {menuItems ? (
                <p className="whitespace-pre-line text-text-primary font-medium leading-relaxed">{menuItems}</p>
              ) : (
                <p className="text-text-muted italic">No menu saved yet. Open the full menu to load it.</p>
              )}
            </div>
          </div>
          <Button
            onClick={() => setHostelActiveSubTab("mess")}
            className="w-full bg-primary hover:brightness-110 text-primary-foreground text-xs mt-4 rounded-xl flex items-center justify-center gap-1.5 h-9"
          >
            <span>View Full Menu</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        {/* Card: Laundry */}
        <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-border-ink transition-all">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">Laundry Schedule</span>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-text-heading">Weekly Slots</h3>
                <p className="text-xs text-text-muted mt-0.5">Check when laundry is available for your room range</p>
              </div>
            </div>

            <div className="bg-surface-secondary border border-border-muted rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between items-center text-text-muted">
                <span>Active Slot today:</span>
                <span className="font-semibold text-primary">Available</span>
              </div>
              <div className="text-xs text-text-muted leading-relaxed">
                Matches current calendar dates. Standard slots allocate up to two washings per week.
              </div>
            </div>
          </div>
          <Button
            onClick={() => setHostelActiveSubTab("laundry")}
            className="w-full bg-primary hover:brightness-110 text-primary-foreground text-xs mt-4 rounded-xl flex items-center justify-center gap-1.5 h-9"
          >
            <span>Check Schedule</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        {/* Card: Leave Management */}
        <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-border-ink transition-all">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">Leaves & Outings</span>

            {activeLeave ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-success-foreground shrink-0" />
                  <span className="text-xs font-semibold text-text-primary truncate">Leave Request Found</span>
                </div>
                <div className="bg-surface-secondary border border-border-muted rounded-xl p-3 text-xs text-text-muted space-y-1">
                  <div className="truncate">
                    <strong>From:</strong> {activeLeave.from}
                  </div>
                  <div className="truncate">
                    <strong>To:</strong> {activeLeave.to}
                  </div>
                  <div className="truncate">
                    <strong>Place:</strong> {activeLeave.visitPlace}
                  </div>
                  <div className="mt-1 pt-1.5 border-t border-border-muted flex items-center justify-between text-xs">
                    <span>Status:</span>
                    <span className="font-semibold text-success-foreground uppercase">
                      {activeLeave.status || "Approved"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info size={16} className="text-text-muted shrink-0" />
                  <span className="text-xs font-semibold text-text-primary">No Active Leave</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  You do not currently have any active outings or leaves. Ensure to file on time via VTOP.
                </p>
              </div>
            )}
          </div>
          <Button
            onClick={() => setHostelActiveSubTab("leave")}
            className="w-full bg-primary hover:brightness-110 text-primary-foreground text-xs mt-4 rounded-xl flex items-center justify-center gap-1.5 h-9"
          >
            <span>Manage Leaves</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        {/* Card: Room Selection & Counselling */}
        <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-border-ink transition-all">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Room selection & counselling
            </span>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-text-heading">Booking Status</h3>
                <p className="text-xs text-text-muted mt-0.5">Check group requests and allocation status</p>
              </div>
            </div>

            <div className="bg-surface-secondary border border-border-muted rounded-xl p-3 text-xs space-y-1.5">
              <p className="text-text-primary font-semibold text-xs">Room Allocation:</p>
              <p className="text-xs text-text-muted italic">Verify your Leader OTP in the counselling status portal.</p>
            </div>
          </div>
          <Button
            onClick={() => setHostelActiveSubTab("counselling")}
            className="w-full bg-primary hover:brightness-110 text-primary-foreground text-xs mt-4 rounded-xl flex items-center justify-center gap-1.5 h-9"
          >
            <span>View Booking Status</span>
            <ArrowRight size={14} />
          </Button>
        </div>

        {/* Card: Hostel Information */}
        <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-border-ink transition-all md:col-span-2">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-primary block">
              Hostel Room Information
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-text-muted block mb-0.5 text-xs">Hostel Block</span>
                <span className="font-bold text-text-primary">{block}</span>
              </div>
              <div>
                <span className="text-text-muted block mb-0.5 text-xs">Room Number</span>
                <span className="font-bold text-text-primary">{room}</span>
              </div>
              <div>
                <span className="text-text-muted block mb-0.5 text-xs">Mess Selection</span>
                <span className="font-bold text-text-primary capitalize">{messType} Mess</span>
              </div>
              <div>
                <span className="text-text-muted block mb-0.5 text-xs">Chief Warden</span>
                <span className="font-bold text-text-primary">Dr. K. Srinivasan</span>
              </div>
            </div>

            <div className="h-px bg-surface-secondary" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-text-muted uppercase mb-2">Emergency Contacts</p>
                <div className="space-y-1.5 text-xs text-text-primary">
                  <div className="flex items-center justify-between">
                    <span>Hostel Office:</span>
                    <a href="tel:+914439931555" className="font-semibold text-primary hover:underline">
                      +91 44 3993 1555
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Warden Office:</span>
                    <a href="tel:+914439931666" className="font-semibold text-primary hover:underline">
                      +91 44 3993 1666
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medical / Ambulance:</span>
                    <a
                      href="tel:+914439931108"
                      className="font-semibold text-danger-foreground hover:underline font-bold"
                    >
                      +91 44 3993 1108
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-text-muted uppercase mb-2">Useful Links</p>
                <div className="space-y-1 text-xs text-text-primary">
                  <a
                    href="https://vtopcc.vit.ac.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-primary dark:hover:text-primary transition-colors"
                  >
                    <span>VTOP Portal</span>
                    <ExternalLink size={11} className="text-text-muted" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between text-primary dark:hover:text-primary transition-colors"
                  >
                    <span>Mess Change Request Form</span>
                    <ChevronRight size={11} className="text-text-muted" />
                  </a>
                  <a
                    href="#"
                    className="flex items-center justify-between text-primary dark:hover:text-primary transition-colors"
                  >
                    <span>Hostel Grievance Register</span>
                    <ChevronRight size={11} className="text-text-muted" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Help Footer */}
      <TabHelpFooter tabId="hostel" />
    </div>
  );
}
