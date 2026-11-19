"use client";

import { useState } from "react";
import { navigateToFFCSPlanner } from "@/lib/ffcsNavigation";
import {
  Database,
  UserCheck,
  Users,
  Car,
  DoorOpen,
  Compass,
  ChevronRight,
  Search,
  CalendarCheck,
  Layers,
  Sparkles,
  CheckSquare,
} from "lucide-react";

interface ToolsHubProps {
  setActiveToolsSubTab: (subTab: string) => void;
  setActiveTab?: (tab: string) => void;
}

export default function ToolsHub({ setActiveToolsSubTab }: ToolsHubProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const tools = [
    {
      id: "tasks",
      title: "Tasks & Study Schedule",
      subtitle: "Homework, tests, week scheduling, pomodoro & LMS sync",
      category: "academic",
      icon: CheckSquare,
      iconColor: "text-success-foreground bg-success-surface border-border-ink",
    },
    {
      id: "attendance-predictor",
      title: "Attendance Predictor",

      subtitle: "Simulate attendance percentages and safe bunk margins",
      category: "academic",
      icon: CalendarCheck,
      iconColor: "text-secondary-foreground bg-secondary dark:bg-secondary border-border-ink",
    },
    {
      id: "qbank",
      title: "Question Bank",
      subtitle: "Previous years CAT & FAT question papers",
      category: "academic",
      icon: Database,
      iconColor: "text-danger-foreground bg-danger-surface border-border-ink",
    },
    {
      id: "faculty-info",
      title: "Faculty Explorer",
      subtitle: "Directory, cabins & direct contact details",
      category: "academic",
      icon: UserCheck,
      iconColor: "text-secondary-foreground bg-secondary dark:bg-secondary border-border-ink",
    },
    {
      id: "marks-predictor",
      title: "Marks Predictor",
      subtitle: "Simulate test marks, weightage lost & FAT targets",
      category: "academic",
      icon: Sparkles,
      iconColor: "text-secondary-foreground bg-secondary dark:bg-secondary border-border-ink",
    },
    {
      id: "social",
      title: "Social Timetable",
      subtitle: "Share schedules & find common free slots",
      category: "social",
      icon: Users,
      iconColor: "text-secondary-foreground bg-secondary dark:bg-secondary border-border-ink",
    },
    {
      id: "cabshare",
      title: "Cab Share",
      subtitle: "Find travel partners & split cab fares",
      category: "campus",
      icon: Car,
      iconColor: "text-success-foreground bg-success-surface border-border-ink",
    },
    {
      id: "free-class",
      title: "Free Classrooms",
      subtitle: "Find empty classrooms & quiet study spots",
      category: "campus",
      icon: DoorOpen,
      iconColor: "text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-500/20 border-teal-500/20",
    },
    {
      id: "ffcs",
      title: "FFCS Planner",
      subtitle: "Draft schedule & resolve slot clashes",
      category: "academic",
      icon: Compass,
      iconColor: "text-secondary-foreground bg-secondary dark:bg-secondary border-border-ink",
    },
  ];

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = categoryFilter === "all" || tool.category === categoryFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term || tool.title.toLowerCase().includes(term) || tool.subtitle.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 md:pb-8 animate-fadeIn text-left select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary border border-border-ink text-secondary-foreground flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-heading font-outfit tracking-tight">
              Tools & Utilities
            </h1>
            <p className="text-xs text-text-muted font-medium">
              Essential campus utilities, exam archives, and academic tools
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tools..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-surface dark:bg-surface-secondary border-2 border-border-ink text-xs sm:text-sm font-bold text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-ink shadow-2xs"
          />
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {[
          { id: "all", label: "All Utilities" },
          { id: "academic", label: "Academic & Exam Tools" },
          { id: "social", label: "Social & Friends" },
          { id: "campus", label: "Campus & Travel" },
        ].map((cat) => {
          const isActive = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface border-2 border-border-ink text-text-muted hover:text-text-heading "
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Compact Tools Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => (tool.id === "ffcs" ? navigateToFFCSPlanner() : setActiveToolsSubTab(tool.id))}
              className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 border-border-ink card-surface hover:border-border-ink dark:hover:border-border-ink transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-sm active:scale-[0.99] text-left"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tool.iconColor} transition-transform duration-150`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-text-heading font-outfit tracking-tight truncate group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs sm:text-xs text-text-muted font-medium truncate mt-0.5">{tool.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          );
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="p-12 rounded-[14px] border border-dashed border-border-ink text-center space-y-2">
          <Search className="w-8 h-8 text-text-muted mx-auto" />
          <p className="text-sm font-bold text-text-primary">No tools found matching &quot;{searchTerm}&quot;</p>
          <p className="text-xs text-text-muted">Try adjusting your search query or category filter.</p>
        </div>
      )}
    </div>
  );
}
