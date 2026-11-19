"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import BottomSheet from "../../shared/BottomSheet";
import { CustomCourseMock } from "@/lib/marksPredictorStorage";
import SelectField from "../../shared/primitives/SelectField";
import { GhostButton } from "../../shared/primitives";
import { FIELD_INPUT, TONE_ICON_TILE } from "@/lib/uiTokens";
interface AddCustomCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: CustomCourseMock) => void;
}

export default function AddCustomCourseModal({ isOpen, onClose, onAddCourse }: AddCustomCourseModalProps) {
  const [courseCode, setCourseCode] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseType, setCourseType] = useState<CustomCourseMock["courseType"]>("Theory Only");
  const [theoryCredits, setTheoryCredits] = useState<number>(3);
  const [labCredits, setLabCredits] = useState<number>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    const cleanedCode = courseCode.trim().toUpperCase();
    const cleanedTitle = courseTitle.trim() || `Course ${cleanedCode}`;

    onAddCourse({
      courseCode: cleanedCode,
      courseTitle: cleanedTitle,
      courseType,
      theoryCredits: courseType.includes("Lab") ? 0 : theoryCredits,
      labCredits: courseType.includes("Theory") && !courseType.includes("Embedded") ? 0 : labCredits,
      isCustom: true,
    });

    onClose();
  };

  return (
    <BottomSheet
      onClose={onClose}
      overlayId="predictor-custom-course"
      maxWidth="max-w-md"
      avoidKeyboard
      title="Add Custom Subject"
      icon={<Plus className="w-5 h-5" />}
      accent={TONE_ICON_TILE.indigo}
      closeLabel="Close add subject"
    >
      <div className="space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Course Code</label>
            <input
              type="text"
              required
              placeholder="e.g. BCSE302L"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className={`${FIELD_INPUT} mt-1 uppercase placeholder:normal-case`}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Course Title</label>
            <input
              type="text"
              placeholder="e.g. Database Systems"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className={`${FIELD_INPUT} mt-1`}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Course Structure</label>
            <SelectField
              value={courseType as string}
              onChange={(val) => setCourseType(val as any)}
              options={[
                { value: "Theory Only", label: "Theory Only" },
                { value: "Lab Only", label: "Lab Only" },
                { value: "Embedded Theory", label: "Embedded Theory + Lab" },
                { value: "Project", label: "Project / J-Component" },
                { value: "Soft Skill", label: "Soft Skill / STS" },
              ]}
              searchable={false}
              stacked
              role="group"
              aria-label="Course type"
            />
          </div>

          {courseType === "Embedded Theory" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-surface-secondary border-2 border-border-ink">
              <div>
                <label className="text-xs font-bold text-text-muted">Theory Credits</label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={theoryCredits}
                  onChange={(e) => setTheoryCredits(parseInt(e.target.value) || 3)}
                  className={`${FIELD_INPUT} mt-1 text-center`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted">Lab Credits</label>
                <input
                  type="number"
                  min="1"
                  max="3"
                  value={labCredits}
                  onChange={(e) => setLabCredits(parseInt(e.target.value) || 1)}
                  className={`${FIELD_INPUT} mt-1 text-center`}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <GhostButton onClick={onClose} title="Cancel without adding">
              Cancel
            </GhostButton>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-primary hover:brightness-110 text-primary-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Add Subject
            </button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}
