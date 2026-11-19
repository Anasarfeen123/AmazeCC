"use client";

import { LayoutDashboard, Layers, Sparkles } from "lucide-react";
import ExperienceModePickerModal, {
  type ExperienceModeOption,
} from "../../../../shared/primitives/ExperienceModePickerModal";

export type GeneratorViewMode = "modern" | "classic";

export interface FFCSGeneratorViewModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: GeneratorViewMode;
  onSelectMode: (mode: GeneratorViewMode, remember: boolean) => void;
}

const MODE_OPTIONS: readonly ExperienceModeOption<GeneratorViewMode>[] = [
  {
    value: "modern",
    title: "Modern dashboard",
    description: "Sectioned left menu, responsive KPI strip, and a readiness summary beside the form.",
    badge: "Dashboard",
    Icon: LayoutDashboard,
    iconClass: "bg-secondary text-secondary-foreground border-border-ink",
    selectedClass: "bg-secondary",
    activeColor: "bg-indigo-600 hover:bg-primary",
  },
  {
    value: "classic",
    title: "Classic full form",
    description: "The familiar two-column generator with every control visible on one long page.",
    badge: "Classic",
    Icon: Layers,
    iconClass: "bg-warning-surface text-warning-foreground border-border-ink",
    selectedClass: "bg-warning-surface",
    activeColor: "bg-amber-600 hover:bg-amber-500",
  },
];

export default function FFCSGeneratorViewModeModal({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}: FFCSGeneratorViewModeModalProps) {
  return (
    <ExperienceModePickerModal<GeneratorViewMode>
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Generator Experience"
      subtitle="Switch between the modern dashboard and the classic full form anytime."
      headerIcon={Sparkles}
      options={MODE_OPTIONS}
      currentMode={currentMode}
      onSelectMode={onSelectMode}
      overlayId="ffcs-generator-view-mode-modal"
      applyLabel={(_, opt) => `Switch to ${opt?.title ?? "View"}`}
    />
  );
}
