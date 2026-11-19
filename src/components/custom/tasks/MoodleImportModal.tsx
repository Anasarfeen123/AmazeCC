"use client";

import { useState, useMemo } from "react";
import { useAtom } from "jotai";
import { Download, Clock, BookOpen } from "lucide-react";
import BottomSheet from "../shared/BottomSheet";
import { moodleDataAtom, tasksAtom } from "@/store/dataAtoms";
import { previewMoodleImport, importMoodleTasks } from "@/lib/moodleImport";
import { clickable } from "@/lib/a11y";

interface MoodleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function MoodleImportModal({ isOpen, onClose, onImportComplete }: MoodleImportModalProps) {
  const [moodleData] = useAtom(moodleDataAtom);
  const [tasks, setTasks] = useAtom(tasksAtom);

  const previews = useMemo(() => {
    return previewMoodleImport(moodleData || [], tasks);
  }, [moodleData, tasks]);

  // Track selected URLs
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(() => {
    const set = new Set<string>();
    previews.forEach((p) => {
      if (!p.alreadyImported && !p.isPast) {
        set.add(p.url || p.title);
      }
    });
    return set;
  });

  const availableToImport = previews.filter((p) => !p.alreadyImported);

  const toggleSelectAll = () => {
    if (selectedUrls.size === availableToImport.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(availableToImport.map((p) => p.url || p.title)));
    }
  };

  const toggleItem = (key: string) => {
    const next = new Set(selectedUrls);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedUrls(next);
  };

  const handleImport = () => {
    const itemsToImport = previews.filter((p) => selectedUrls.has(p.url || p.title));
    const updated = importMoodleTasks(itemsToImport);
    setTasks(updated);
    onImportComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      onClose={onClose}
      overlayId="moodle-import-modal"
      maxWidth="max-w-lg"
      title="Import from Moodle LMS"
      subtitle="Sync pending digital assignments into your timetable tasks"
      icon={<Download className="w-5 h-5" />}
      accent="bg-warning-surface text-warning-foreground border-border-ink"
      closeLabel="Close Moodle import"
    >
      <div className="flex flex-col max-h-[80vh] text-left">
        {/* Assignment list */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto min-h-0 flex-1">
          {previews.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-text-muted mx-auto" />
              <p className="text-xs font-semibold text-text-muted">No LMS assignments found in Moodle data.</p>
              <p className="text-xs text-text-muted">Make sure you are logged in to LMS or have synced Moodle.</p>
            </div>
          ) : (
            <>
              {availableToImport.length > 0 && (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-text-muted">
                    {availableToImport.length} new assignment
                    {availableToImport.length === 1 ? "" : "s"} found
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    {selectedUrls.size === availableToImport.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {previews.map((item, idx) => {
                  const key = item.url || item.title || String(idx);
                  const isChecked = selectedUrls.has(key);

                  return (
                    <div
                      key={key}
                      {...clickable(() => !item.alreadyImported && toggleItem(key))}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        item.alreadyImported
                          ? "bg-surface-secondary border-border-ink opacity-60 cursor-default"
                          : isChecked
                            ? "bg-secondary border-border-ink cursor-pointer shadow-2xs"
                            : "bg-surface border-border-ink cursor-pointer hover:border-border-ink"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked || item.alreadyImported}
                        disabled={item.alreadyImported}
                        onChange={() => toggleItem(key)}
                        className="mt-0.5 rounded text-primary focus:ring-border-ink"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {item.courseCode && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-surface-secondary text-text-primary">
                              {item.courseCode}
                            </span>
                          )}
                          {item.alreadyImported && (
                            <span className="text-xs font-bold text-success-foreground bg-success-surface px-1.5 py-0.2 rounded">
                              Already Imported
                            </span>
                          )}
                          {item.isPast && !item.alreadyImported && (
                            <span className="text-xs font-bold text-danger-foreground bg-danger-surface px-1.5 py-0.2 rounded">
                              Past Due
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-text-heading font-outfit leading-snug">{item.title}</h4>

                        {item.dueDate && (
                          <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-text-muted" />
                            Due:{" "}
                            {new Date(item.dueDate).toLocaleString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border-ink flex items-center justify-between gap-3 bg-surface-secondary">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-text-muted hover:bg-surface-hover cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={selectedUrls.size === 0}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-primary hover:brightness-110 disabled:opacity-50 text-primary-foreground shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import ({selectedUrls.size})</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
