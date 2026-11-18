"use client";

import React, { useState, useEffect, useRef, useMemo, useDeferredValue, useCallback } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  Search,
  X,
  Sparkles,
  User,
  Calendar,
  BookOpen,
  CreditCard,
  Car,
  Home,
  Bus,
  Plus,
  BarChart3,
  FileText,
  GraduationCap,
  TrendingUp,
  Volume2,
  Users,
  School,
  RotateCcw,
  ClipboardList,
  Settings,
  Code,
  Star,
  Utensils,
  Shirt,
  Plane,
  Handshake,
  HelpCircle,
  PartyPopper,
  Landmark,
  Clock,
  MessageSquare,
  CheckCircle2,
  Sun,
  Moon,
  AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/sync-engine";
import { clickable } from "@/lib/a11y";

function renderCommandIcon(icon: React.ReactNode | string) {
  if (React.isValidElement(icon)) return icon;
  if (typeof icon !== "string") return <Sparkles size={15} />;

  switch (icon.trim()) {
    case "👤":
      return <User size={15} />;
    case "📋":
      return <ClipboardList size={15} />;
    case "📚":
      return <BookOpen size={15} />;
    case "💳":
      return <CreditCard size={15} />;
    case "🚕":
      return <Car size={15} />;
    case "📖":
      return <BookOpen size={15} />;
    case "🏠":
      return <Home size={15} />;
    case "🚏":
    case "🚍":
    case "🚌":
      return <Bus size={15} />;
    case "➕":
      return <Plus size={15} />;
    case "📊":
      return <BarChart3 size={15} />;
    case "📅":
    case "🗓️":
      return <Calendar size={15} />;
    case "📜":
      return <FileText size={15} />;
    case "🎓":
      return <GraduationCap size={15} />;
    case "📈":
      return <TrendingUp size={15} />;
    case "📘":
      return <BookOpen size={15} />;
    case "📢":
      return <Volume2 size={15} />;
    case "👨‍🏫":
      return <Users size={15} />;
    case "🏫":
      return <School size={15} />;
    case "🔄":
      return <RotateCcw size={15} />;
    case "⚙️":
      return <Settings size={15} />;
    case "💻":
      return <Code size={15} />;
    case "⭐":
      return <Star size={15} />;
    case "🍽️":
      return <Utensils size={15} />;
    case "👕":
      return <Shirt size={15} />;
    case "✈️":
      return <Plane size={15} />;
    case "🤝":
      return <Handshake size={15} />;
    case "📄":
      return <FileText size={15} />;
    case "❓":
      return <HelpCircle size={15} />;
    case "👥":
      return <Users size={15} />;
    case "🎉":
      return <PartyPopper size={15} />;
    case "🏛️":
      return <Landmark size={15} />;
    case "⏰":
      return <Clock size={15} />;
    case "🔮":
      return <Sparkles size={15} />;
    case "💬":
      return <MessageSquare size={15} />;
    case "📝":
      return <FileText size={15} />;
    case "🔢":
      return <BarChart3 size={15} />;
    case "🙈":
    case "🕵️":
      return <User size={15} />;
    case "☀️":
      return <Sun size={15} />;
    case "🌙":
      return <Moon size={15} />;
    case "📏":
      return <BarChart3 size={15} />;
    case "🚶":
      return <Users size={15} />;
    case "🟡":
      return <AlertTriangle size={15} />;
    case "🔴":
    case "⚠️":
      return <AlertTriangle size={15} />;
    case "🎪":
      return <PartyPopper size={15} />;
    case "✅":
      return <CheckCircle2 size={15} />;
    case "☐":
      return <CheckCircle2 size={15} />;
    default:
      if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(icon)) {
        return <Sparkles size={15} />;
      }
      return <span className="font-mono text-xs font-bold">{icon}</span>;
  }
}

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode | string;
  category?: string;
  rightSlot?: React.ReactNode;
  detail?: React.ReactNode;
  subpage?: React.ReactNode;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  demoMode?: boolean;
}

export function CommandPalette({ isOpen, onClose, commands, demoMode = false }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSubpage, setActiveSubpage] = useState<React.ReactNode | null>(null);
  const [kohaBooks, setKohaBooks] = useState<any[]>([]);
  const [kohaLoading, setKohaLoading] = useState(false);
  const deferredQuery = useDeferredValue(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input & reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setActiveSubpage(null);
      setKohaBooks([]);
      setKohaLoading(false);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Handle Koha search internally when "koha" is typed
  useEffect(() => {
    if (!isOpen || !deferredQuery) {
      setKohaBooks([]);
      setKohaLoading(false);
      return;
    }

    const lower = deferredQuery.toLowerCase();
    const kohaIdx = lower.indexOf("koha");
    if (kohaIdx === -1) {
      setKohaBooks([]);
      setKohaLoading(false);
      return;
    }

    const searchTerm = deferredQuery
      .slice(kohaIdx + 4)
      .trim()
      .replace(/^[:;,\-\s]+/, "");
    if (!searchTerm) {
      setKohaBooks([]);
      setKohaLoading(true);
      return;
    }

    setKohaLoading(true);
    if (demoMode) {
      const timer = setTimeout(() => {
        const mockResults = [
          {
            title: "Introduction to Algorithms",
            author: "Cormen, Leiserson, Rivest, Stein",
            availability: "Available (4 copies)",
          },
          {
            title: "Computer Networking: A Top-Down Approach",
            author: "Kurose, Ross",
            availability: "Reference Only (1 copy)",
          },
          {
            title: "Design Patterns: Elements of Reusable Object-Oriented Software",
            author: "Gamma, Helm, Johnson, Vlissides",
            availability: "Checked Out (Due 2026-07-10)",
          },
        ].filter(
          (b) =>
            b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.author.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        setKohaBooks(mockResults);
        setKohaLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }

    const controller = new AbortController();
    api("koha/search", { query: { q: searchTerm, count: 10 }, signal: controller.signal })
      .then((data: any) => {
        setKohaBooks(data?.success && Array.isArray(data?.books) ? data.books : []);
        setKohaLoading(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setKohaBooks([]);
          setKohaLoading(false);
        }
      });

    return () => controller.abort();
  }, [deferredQuery, isOpen, demoMode]);

  // Dynamic Koha command items
  const dynamicKohaCommands = useMemo<CommandItem[]>(() => {
    return kohaBooks.map((b, i) => ({
      id: `koha-dynamic-${i}`,
      label: b.title || "Book Title",
      description: `${b.author || "Author"} · ${b.availability || "Status"}`,
      icon: "📖",
      category: "Koha Library Catalog",
      rightSlot: undefined,
      detail: undefined,
      subpage: undefined,
      onSelect: () => window.open("http://opac.vit.ac.in", "_blank"),
    }));
  }, [kohaBooks]);

  // Combined command list
  const allCommands = useMemo(() => {
    if (dynamicKohaCommands.length > 0) {
      return [...dynamicKohaCommands, ...commands];
    }
    return commands;
  }, [commands, dynamicKohaCommands]);

  // Filter commands efficiently using deferredQuery
  const filteredCommands = useMemo(() => {
    if (!deferredQuery.trim()) {
      return allCommands.slice(0, 30);
    }

    const q = deferredQuery.toLowerCase().trim();
    const queryWords = q.split(/\s+/);

    return allCommands
      .filter((cmd) => {
        const text = `${cmd.label} ${cmd.description || ""} ${cmd.category || ""}`.toLowerCase();
        return queryWords.every((word) => text.includes(word));
      })
      .slice(0, 40);
  }, [allCommands, deferredQuery]);

  // Reset selected index if filtered list length changes
  useEffect(() => {
    setSelectedIndex((prev) => (filteredCommands.length > 0 ? Math.min(prev, filteredCommands.length - 1) : 0));
  }, [filteredCommands.length]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (activeSubpage) {
          setActiveSubpage(null);
        } else {
          onClose();
        }
        return;
      }

      if (activeSubpage) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredCommands[selectedIndex];
        if (selected) {
          if (selected.subpage) {
            setActiveSubpage(selected.subpage);
          } else {
            selected.onSelect();
            onClose();
          }
        }
      }
    },
    [filteredCommands, selectedIndex, activeSubpage, onClose],
  );

  if (!isOpen) return null;

  const selectedCommand = filteredCommands[selectedIndex];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-[color-mix(in_oklab,var(--shadow-ink)_55%,transparent)]">
        {/* Backdrop Click */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <m.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Search AmazeCC"
          className="relative w-full max-w-2xl bg-surface border-[3px] border-border-ink rounded-[20px] shadow-brutal-lg overflow-hidden z-10 flex flex-col max-h-[80vh]"
          onKeyDown={handleKeyDown}
        >
          {/* Subpage View */}
          {activeSubpage ? (
            <div className="p-4 relative">
              <button
                onClick={() => setActiveSubpage(null)}
                className="mb-3 inline-flex min-h-10 items-center rounded-[10px] border-2 border-border-ink bg-highlight px-3 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-highlight-foreground shadow-brutal-sm cursor-pointer"
              >
                ← Search
              </button>
              {activeSubpage}
            </div>
          ) : (
            <>
              {/* Top Search Input Bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-border-ink shrink-0">
                <Search size={18} className="text-text-muted shrink-0" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, actions, books…"
                  aria-label="Search pages, actions and books"
                  className="w-full min-h-10 bg-transparent text-base font-medium text-text-primary placeholder:text-text-muted outline-none focus-visible:outline-none"
                />
                {kohaLoading && (
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-warning-foreground shrink-0">
                    Searching Koha...
                  </span>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close command palette"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border-2 border-border-ink bg-surface-secondary text-text-primary hover:bg-surface-hover cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body: Left Command List + Right Detail Preview */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y-2 md:divide-y-0 md:divide-x-2 divide-border-muted">
                {/* Command List */}
                <div ref={listRef} className="flex-1 overflow-y-auto p-2 pr-3 space-y-1 max-h-[55vh]">
                  {filteredCommands.length === 0 ? (
                    <div className="p-8 text-center text-sm text-text-muted">
                      Nothing matches that. Try a page name like “Attendance”.
                    </div>
                  ) : (
                    filteredCommands.map((cmd, idx) => {
                      const isSelected = idx === selectedIndex;
                      return (
                        <div
                          key={cmd.id || idx}
                          {...clickable(() => {
                            if (cmd.subpage) {
                              setActiveSubpage(cmd.subpage);
                            } else {
                              cmd.onSelect();
                              onClose();
                            }
                          })}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          aria-selected={isSelected}
                          className={`flex min-h-12 items-center justify-between gap-2 px-2.5 py-2 rounded-[10px] border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-highlight text-highlight-foreground border-border-ink shadow-brutal-sm"
                              : "border-transparent text-text-primary hover:bg-surface-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {cmd.icon && (
                              <span
                                aria-hidden
                                className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-[8px] border-2 border-border-ink ${
                                  isSelected
                                    ? "bg-highlight-foreground text-highlight"
                                    : "bg-secondary text-secondary-foreground"
                                }`}
                              >
                                {renderCommandIcon(cmd.icon)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{cmd.label}</p>
                              {cmd.description && (
                                <p
                                  className={`text-xs truncate mt-0.5 ${isSelected ? "opacity-80" : "text-text-muted"}`}
                                >
                                  {cmd.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {cmd.category && (
                              <span
                                className={`hidden sm:inline-flex rounded-[6px] border-2 border-border-ink px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] ${
                                  isSelected
                                    ? "bg-text-primary text-background"
                                    : "bg-surface-secondary text-text-muted"
                                }`}
                              >
                                {cmd.category}
                              </span>
                            )}
                            {cmd.rightSlot}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Detail Preview Pane */}
                {selectedCommand?.detail && (
                  <div className="hidden md:block w-72 p-4 bg-surface-secondary overflow-y-auto shrink-0">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.06em] text-text-muted mb-3">
                      Details
                    </p>
                    {selectedCommand.detail}
                  </div>
                )}
              </div>

              {/* Bottom Footer Shortcuts Bar */}
              <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-surface-secondary border-t-2 border-border-ink font-mono text-xs text-text-muted shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded-[6px] border-2 border-border-ink bg-surface px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary">
                      ↑↓
                    </kbd>{" "}
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded-[6px] border-2 border-border-ink bg-surface px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary">
                      ↵
                    </kbd>{" "}
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded-[6px] border-2 border-border-ink bg-surface px-1.5 py-0.5 font-mono text-xs font-semibold text-text-primary">
                      ESC
                    </kbd>{" "}
                    Close
                  </span>
                </div>
                <span className="font-semibold uppercase tracking-[0.06em] text-text-heading">Spotlight</span>
              </div>
            </>
          )}
        </m.div>
      </div>
    </AnimatePresence>
  );
}
