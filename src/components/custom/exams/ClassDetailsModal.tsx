"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BookOpen, DoorOpen, User, Clock, Copy, Check, Layers, Hash, ChevronRight } from "lucide-react";
import BottomSheet from "../shared/BottomSheet";
import type { MergedOccupant } from "@/lib/roomMerge";
import { useAtom } from "jotai";
import { activeTabAtom } from "@/store/uiAtoms";
import { setTypedStorageItem } from "@/lib/storage";
import { normalizeFaculty } from "@/lib/courseNormalizer";
import { cn } from "@amazecontinuityprojects/amazeui";

export interface ClassDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  occupant: MergedOccupant | null;
  occupants?: MergedOccupant[];
  roomCode?: string;
  dayLabel?: string;
  periodLabel?: string;
  onViewFacultySchedule?: (facultyNameOrErp: string) => void;
}

export default function ClassDetailsModal({
  isOpen,
  onClose,
  occupant,
  occupants,
  roomCode,
  dayLabel,
  periodLabel,
  onViewFacultySchedule,
}: ClassDetailsModalProps) {
  const [, setActiveTab] = useAtom(activeTabAtom);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // If multiple occupants share the slot/room (e.g. joint batch), allow switching
  const allOccupants = occupants && occupants.length > 0 ? occupants : occupant ? [occupant] : [];
  const [selectedIndex, setSelectedIndex] = useState(0);

  const active = allOccupants[selectedIndex] || occupant;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1800);
  };

  const handleOpenFaculty = () => {
    if (!active) return;
    const target = active.erpId ? `erp:${active.erpId}` : active.faculty;
    if (active.erpId) {
      setTypedStorageItem("faculty_schedule_target_erp", active.erpId);
    }
    if (active.faculty) {
      setTypedStorageItem("faculty_schedule_target_name", active.faculty);
    }
    if (onViewFacultySchedule) {
      onViewFacultySchedule(target);
    } else {
      setActiveTab("faculty-schedule");
    }
    onClose();
  };

  if (!active) return null;

  const facultyNorm = normalizeFaculty(active.faculty);
  const displayFaculty = active.faculty || facultyNorm.name || "Not Specified";
  const displayErp = active.erpId || facultyNorm.employeeId;

  const venue = active.code || roomCode || "Unknown Room";
  const block = venue.includes("-") ? `${venue.split("-")[0].trim()} Block` : "Campus Venue";

  const fullCopyText = [
    `Course: ${active.courseCode} - ${active.title || "Class"}`,
    active.type ? `Component: ${active.type}` : "",
    `Faculty: ${displayFaculty}${displayErp ? ` (ERP: ${displayErp})` : ""}`,
    `Room: ${venue} (${block})`,
    dayLabel ? `Day: ${dayLabel}` : "",
    periodLabel ? `Time: ${periodLabel}` : "",
    active.slot ? `Slot: ${active.slot}` : "",
    active.classId ? `Class ID: ${active.classId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <AnimatePresence>
      {isOpen && (
        <BottomSheet
          onClose={onClose}
          overlayId="class-details-inspector"
          maxWidth="max-w-lg"
          placement="bottom-center"
          panelZIndex={320}
          backdropZIndex={315}
          title={active.title || active.courseCode || "Class Details"}
          subtitle={`${active.courseCode}${active.type ? ` · ${active.type}` : ""} · ${venue}`}
          icon={<BookOpen className="w-5 h-5" />}
          accent="bg-secondary border-border-ink text-secondary-foreground"
          closeLabel="Close class details"
          trailing={
            <button
              type="button"
              onClick={() => handleCopy(fullCopyText, "all")}
              title="Copy class details"
              className="p-1.5 rounded-xl border-2 border-border-ink bg-surface text-text-muted hover:text-primary hover:border-primary dark:hover:border-border-ink transition-colors cursor-pointer"
            >
              {copiedKey === "all" ? (
                <Check className="w-3.5 h-3.5 text-success-foreground" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          }
        >
          <div className="space-y-4 text-left">
            {/* Multiple occupants tabs if more than one class is in this slot */}
            {allOccupants.length > 1 && (
              <div className="flex gap-1.5 p-1 bg-surface-secondary rounded-xl overflow-x-auto">
                {allOccupants.map((occ, idx) => (
                  <button
                    key={`${occ.courseCode}-${idx}`}
                    type="button"
                    onClick={() => setSelectedIndex(idx)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                      selectedIndex === idx
                        ? "bg-surface text-primary shadow-2xs"
                        : "text-text-muted hover:text-text-heading",
                    )}
                  >
                    {occ.courseCode || `Class ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Course & Title Header Tile */}
            <div className="p-3.5 rounded-2xl bg-surface-secondary border-2 border-border-ink space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-mono font-bold text-xs">
                  {active.courseCode || "COURSE"}
                </span>
                <div className="flex items-center gap-1.5">
                  {active.type && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-tertiary text-text-primary font-bold text-xs uppercase tracking-wider">
                      {active.type}
                    </span>
                  )}
                  {active.classId && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-success-foreground font-mono font-bold text-xs">
                      #{active.classId}
                    </span>
                  )}
                </div>
              </div>
              <h3 className="text-base font-bold text-text-heading leading-snug">{active.title || "Course"}</h3>
            </div>

            {/* Key Grid Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Room Tile */}
              <div className="p-3 rounded-2xl border-2 border-border-ink bg-surface flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-success-surface border border-border-ink text-success-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Classroom Venue</p>
                    <p className="text-sm font-bold text-text-heading truncate">{venue}</p>
                    <p className="text-xs text-text-muted font-medium">{block}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(venue, "room")}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                  title="Copy room"
                >
                  {copiedKey === "room" ? (
                    <Check className="w-3.5 h-3.5 text-success-foreground" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Faculty Tile */}
              <div className="p-3 rounded-2xl border-2 border-border-ink bg-surface flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-secondary border border-border-ink text-secondary-foreground flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Faculty / Teacher</p>
                    <p className="text-sm font-bold text-text-heading truncate">{displayFaculty}</p>
                    {displayErp && (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-primary">
                        <Hash className="w-3 h-3" />
                        {displayErp}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(displayFaculty, "faculty")}
                  className="p-1 rounded-lg text-text-muted hover:text-text-primary transition-colors"
                  title="Copy faculty name"
                >
                  {copiedKey === "faculty" ? (
                    <Check className="w-3.5 h-3.5 text-success-foreground" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Time & Period Tile */}
              <div className="p-3 rounded-2xl border-2 border-border-ink bg-surface flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-warning-surface border border-border-ink text-warning-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider font-bold text-text-muted">Time & Schedule</p>
                  <p className="text-sm font-bold text-text-heading truncate">{periodLabel || "Period"}</p>
                  {dayLabel && <p className="text-xs text-text-muted font-medium">{dayLabel}</p>}
                </div>
              </div>

              {/* Slot & Type Tile */}
              <div className="p-3 rounded-2xl border-2 border-border-ink bg-surface flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-secondary border border-border-ink text-secondary-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider font-bold text-text-muted">VTOP Slot</p>
                  <p className="text-sm font-bold text-text-heading truncate">{active.slot || "N/A"}</p>
                  <p className="text-xs text-text-muted font-medium">
                    Source: {active.source === "live" ? "Live Contribution" : "FFCS Allocation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions: View Faculty Schedule & Copy Details */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleOpenFaculty}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs shadow-brutal-sm border-2 border-border-ink transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>View Faculty Schedule</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={() => handleCopy(fullCopyText, "all")}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-border-ink bg-surface hover:bg-surface-hover font-bold text-xs text-text-primary transition-all cursor-pointer"
              >
                {copiedKey === "all" ? (
                  <>
                    <Check className="w-4 h-4 text-success-foreground" />
                    <span className="text-success-foreground">Copied Details</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Info</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  );
}
