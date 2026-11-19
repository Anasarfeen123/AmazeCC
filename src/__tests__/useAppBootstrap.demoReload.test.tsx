import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import type { ReactNode } from "react";
import { attendanceDataAtom, marksDataAtom } from "@/store";
import { useAppBootstrap } from "@/components/custom/app/useAppBootstrap";

// ROADMAP R5: the demo used to come back empty after a reload because its data
// was only ever set in memory. Bootstrap now reloads the demo file.
describe("useAppBootstrap — demo survives a reload", () => {
  const demo = {
    attendance: {
      semester: "CH20252605",
      attendance: [{ courseCode: "BCSE302L", attendedClasses: 7, totalClasses: 8 }],
    },
    marks: { cgpa: { cgpa: "8.1" } },
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("demoMode", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => demo }) as unknown as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("loads demo attendance and marks when nothing is stored", async () => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    renderHook(() => useAppBootstrap(), { wrapper });

    await waitFor(() => expect((store.get(attendanceDataAtom) as any)?.attendance?.length).toBe(1));
    expect(store.get(marksDataAtom)).toEqual(demo.marks);
    expect(fetch).toHaveBeenCalledWith("/data/demoData.json");
  });

  it("does not fetch the demo file when not in demo mode", async () => {
    localStorage.removeItem("demoMode");
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
    renderHook(() => useAppBootstrap(), { wrapper });
    await new Promise((r) => setTimeout(r, 20));
    expect(fetch).not.toHaveBeenCalled();
  });
});
