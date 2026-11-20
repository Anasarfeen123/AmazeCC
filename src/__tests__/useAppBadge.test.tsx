import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAppBadge } from "@/lib/useAppBadge";

describe("useAppBadge", () => {
  const nav = navigator as Navigator & { setAppBadge?: unknown; clearAppBadge?: unknown };
  afterEach(() => {
    delete nav.setAppBadge;
    delete nav.clearAppBadge;
  });

  it("sets the count, and clears at zero", () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const clear = vi.fn().mockResolvedValue(undefined);
    nav.setAppBadge = set;
    nav.clearAppBadge = clear;
    const { rerender } = renderHook(({ n }) => useAppBadge(n), { initialProps: { n: 3 } });
    expect(set).toHaveBeenCalledWith(3);
    rerender({ n: 0 });
    expect(clear).toHaveBeenCalled();
  });

  it("does nothing where the API is missing", () => {
    expect(() => renderHook(() => useAppBadge(2))).not.toThrow();
  });
});
