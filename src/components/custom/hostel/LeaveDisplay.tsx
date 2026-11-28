"use client";

import { useState } from "react";
import { RefreshCcw, Calendar, Info, PlusCircle, AlertCircle, Clock, FileText } from "lucide-react";
import { Button } from "@amazecontinuityprojects/amazeui";
import BottomSheet from "../shared/BottomSheet";
import { AnimatePresence } from "framer-motion";
import SelectField from "../shared/primitives/SelectField";

interface LeaveDisplayProps {
  leaveData: any[];
  handleHostelDetailsFetch: () => void;
}

export default function LeaveDisplay({ leaveData, handleHostelDetailsFetch }: LeaveDisplayProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    type: "Outing",
    from: "",
    to: "",
    place: "",
    reason: "",
  });

  if (!leaveData || leaveData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-text-muted">
        <p className="text-sm font-medium">No leave history available in VTOP database.</p>
        <button
          onClick={handleHostelDetailsFetch}
          className="mt-4 px-4 py-2 rounded-xl bg-primary hover:brightness-110 text-primary-foreground font-semibold transition-colors flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Reload Data
        </button>
      </div>
    );
  }

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

  // Active / Upcoming / Recent leaves (last 3 days)
  const activeLeaves = leaveData.filter((leave) => {
    const from = parseDate(leave.from);
    const to = parseDate(leave.to);
    const daysSinceEnd = (now.getTime() - to.getTime()) / (1000 * 60 * 60 * 24);
    return (from <= now && now <= to) || from > now || (daysSinceEnd > 0 && daysSinceEnd <= 3);
  });

  const pastLeaves = leaveData.filter((leave) => !activeLeaves.includes(leave));

  // Pending leaves
  const pendingLeaves = leaveData.filter((leave) => leave.status?.toUpperCase().includes("PENDING"));

  const getStatusColor = (status: string) => {
    if (!status) return "bg-surface-secondary text-text-muted border-border-muted";
    const norm = status.toUpperCase().trim();
    if (norm.includes("APPROVED") || norm.includes("CLOSED")) {
      return "bg-success-surface text-success-foreground border-border-ink";
    }
    if (norm.includes("PENDING")) {
      return "bg-warning-surface text-warning-foreground border-border-ink animate-pulse";
    }
    if (norm.includes("CANCELLED")) {
      return "bg-surface-secondary text-text-muted border-border-muted";
    }
    return "bg-danger-surface text-danger-foreground border-border-ink";
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      "Leave request simulation successful! Direct submission is restricted by VTOP session tokens; please complete registration via the VTOP Portal.",
    );
    setShowApplyModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header layout */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-border-muted">
        <div>
          <p className="inline-flex items-center rounded-[6px] border-2 border-border-ink bg-secondary px-2 py-0.5 mb-2 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-secondary-foreground leading-none">
            Hostel · Leave
          </p>
          <h1 className="font-title text-[28px] sm:text-[36px] font-extrabold text-text-heading tracking-tight leading-[1.05] break-words">
            Leave & outings
          </h1>
          <p className="text-xs text-text-muted mt-1">Apply for outings and leave, and see what is approved.</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Button
            onClick={() => setShowApplyModal(true)}
            className="flex-1 sm:flex-initial bg-primary hover:brightness-110 text-primary-foreground text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5"
          >
            <PlusCircle size={14} /> Apply Outing / Leave
          </Button>

          <button
            onClick={handleHostelDetailsFetch}
            className="p-2 border border-border-muted hover:bg-surface-hover rounded-xl transition-colors shrink-0"
            title="Reload data"
          >
            <RefreshCcw size={14} className="text-text-muted" />
          </button>
        </div>
      </div>

      {/* Leave Status & Overview dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane: Active Leave & Pending */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Leave details */}
          <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border-muted pb-2">
              Active / Upcoming Outing
            </h3>

            {activeLeaves.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-text-heading">{activeLeaves[0].leaveType}</span>
                  </div>
                  <span
                    className={`text-xs font-bold border px-2.5 py-0.5 rounded-[6px] uppercase ${getStatusColor(activeLeaves[0].status)}`}
                  >
                    {activeLeaves[0].status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-surface-secondary border border-border-muted p-4 rounded-xl">
                  <div>
                    <span className="text-text-muted block mb-0.5 text-xs">Leave ID</span>
                    <span className="font-semibold text-text-primary">{activeLeaves[0].leaveId}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-0.5 text-xs">Destination Place</span>
                    <span className="font-semibold text-text-primary">{activeLeaves[0].visitPlace}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-0.5 text-xs">Departure Date</span>
                    <span className="font-semibold text-text-primary">{activeLeaves[0].from}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-0.5 text-xs">Arrival Date</span>
                    <span className="font-semibold text-text-primary">{activeLeaves[0].to}</span>
                  </div>
                </div>

                <div className="text-xs text-text-primary">
                  <strong className="text-text-muted block mb-1 text-xs uppercase font-bold">Reason</strong>
                  <p className="bg-surface-secondary p-3 rounded-lg border-2 border-border-ink leading-relaxed">
                    {activeLeaves[0].reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-text-muted">
                <Info size={28} className="mb-2 text-text-muted" />
                <p className="text-xs">
                  No active leave or outing found. Access the apply button if you plan to leave campus.
                </p>
              </div>
            )}
          </div>

          {/* Pending requests list */}
          <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border-muted pb-2">
              Pending Approvals
            </h3>

            {pendingLeaves.length > 0 ? (
              <div className="divide-y divide-border-ink ">
                {pendingLeaves.map((leave, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3">
                    <div>
                      <p className="font-bold text-text-primary">{leave.leaveType}</p>
                      <p className="text-xs text-text-muted mt-0.5">Departure: {leave.from}</p>
                    </div>
                    <span className="text-xs font-bold border bg-warning-surface text-warning-foreground border-border-ink px-2 py-0.5 rounded-[6px] uppercase">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-2">
                No leave applications are currently pending warden approval.
              </p>
            )}
          </div>
        </div>

        {/* Right pane: Outing Guidelines & Emergency Outing Contacts */}
        <div className="space-y-6">
          {/* Outing Guidelines */}
          <div className="bg-surface border-2 border-border-ink rounded-2xl p-5 shadow-2xs space-y-3">
            <span className="font-label text-xs font-bold text-primary block">Outing Rules & Deadlines</span>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex gap-2">
                <Clock size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong>In-Time deadline:</strong> Outing return deadline is strictly 8:30 PM.
                </p>
              </div>
              <div className="flex gap-2">
                <FileText size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong>Prior application:</strong> Submit leave requests 24 hours prior to departure.
                </p>
              </div>
              <div className="flex gap-2">
                <AlertCircle size={14} className="text-primary shrink-0 mt-0.5" />
                <p>
                  <strong>Parent approval:</strong> Automated parent approval SMS/Email verification required for Home
                  leaves.
                </p>
              </div>
            </div>
          </div>

          {/* The "emergency contacts" block listed phone numbers that came from
              no source (owner review, 2026-11-28); removed until the hostel
              office publishes real ones. */}
        </div>
      </div>

      {/* Leave History Vertical Timeline */}
      {pastLeaves.length > 0 && (
        <div className="bg-surface border-2 border-border-ink rounded-2xl p-6 shadow-2xs space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted border-b border-border-muted pb-2">
            Past Leave History Timeline
          </h3>

          <div className="relative pl-6 border-l-2 border-border-ink space-y-6 ml-2.5">
            {pastLeaves.map((leave, idx) => {
              const statusColor = getStatusColor(leave.status);
              return (
                <div key={idx} className="relative">
                  {/* Timeline bullet indicator */}
                  <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface border-2 border-border-ink" />

                  <div className="bg-surface-secondary border border-border-muted p-4 rounded-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-text-heading block">{leave.leaveType}</span>
                        <span className="text-xs text-text-muted block mt-0.5">Leave ID: {leave.leaveId}</span>
                      </div>
                      <span className={`text-xs font-bold border px-2.5 py-0.5 rounded-[6px] uppercase ${statusColor}`}>
                        {leave.status || "Closed"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs border-t border-border-muted pt-3">
                      <div>
                        <span className="text-text-muted block text-xs uppercase font-bold">Departure</span>
                        <span className="font-semibold text-text-primary">{leave.from}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-xs uppercase font-bold">Arrival</span>
                        <span className="font-semibold text-text-primary">{leave.to}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block text-xs uppercase font-bold">Destination</span>
                        <span className="font-semibold text-text-primary truncate block">{leave.visitPlace}</span>
                      </div>
                    </div>

                    {leave.reason && (
                      <div className="text-xs text-text-muted pt-2 border-t border-border-muted">
                        <strong className="text-text-muted text-xs uppercase block mb-0.5">Reason</strong>
                        <p className="leading-relaxed">{leave.reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Apply Leave Sheet */}
      <AnimatePresence>
        {showApplyModal && (
          <BottomSheet
            onClose={() => setShowApplyModal(false)}
            overlayId="hostel-apply-leave"
            maxWidth="max-w-md"
            title="File Outing / Leave"
            closeLabel="Close leave form"
          >
            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs pt-1">
              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Leave / Outing Type</label>
                <SelectField
                  value={applyForm.type}
                  onChange={(val) => setApplyForm((prev) => ({ ...prev, type: val }))}
                  options={[
                    { value: "Outing", label: "Non-working Day Outing" },
                    { value: "Home", label: "Home Leave" },
                    { value: "Emergency", label: "Emergency Leave" },
                  ]}
                  searchable={false}
                  stacked
                  role="group"
                  aria-label="Leave type"
                  className="[&>button:first-child]:border-border-ink [&>button:first-child]:bg-surface [&>button:first-child]:text-text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="leave-from" className="font-semibold text-text-muted">
                    From Date / Time
                  </label>
                  <input
                    id="leave-from"
                    type="datetime-local"
                    value={applyForm.from}
                    onChange={(e) => setApplyForm((prev) => ({ ...prev, from: e.target.value }))}
                    className="w-full border border-border-ink bg-background rounded-lg p-2 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="leave-to" className="font-semibold text-text-muted">
                    To Date / Time
                  </label>
                  <input
                    id="leave-to"
                    type="datetime-local"
                    value={applyForm.to}
                    onChange={(e) => setApplyForm((prev) => ({ ...prev, to: e.target.value }))}
                    className="w-full border border-border-ink bg-background rounded-lg p-2 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Place of Visit</label>
                <input
                  type="text"
                  placeholder="Chennai, etc."
                  value={applyForm.place}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, place: e.target.value }))}
                  className="w-full border border-border-ink bg-background rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-text-muted">Reason</label>
                <textarea
                  rows={3}
                  placeholder="State your reason clearly..."
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full border border-border-ink bg-background rounded-lg p-2 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:brightness-110 text-primary-foreground font-bold text-xs py-3 rounded-xl"
              >
                Submit Request
              </Button>
            </form>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
