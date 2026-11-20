import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import AppLoading, { LOADING_TIPS } from "@/components/custom/shared/AppLoading";

// Opening the app shows several loading screens in a row. They must share one
// tip and keep it for 9 s (user: tips were "changing so fast").
const shownTip = () => LOADING_TIPS.find((t) => screen.queryByText(t)) ?? null;

describe("loading screen tips", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps the same tip across loading screens, then advances after 9 s", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T10:00:00"));
    const first = render(<AppLoading />);
    act(() => {
      vi.advanceTimersByTime(10);
    });
    const tipA = shownTip();
    expect(tipA).not.toBeNull();
    first.unmount();

    // the next loading screen, 2 s later: same tip
    vi.setSystemTime(new Date("2026-11-21T10:00:02"));
    render(<AppLoading />);
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(shownTip()).toBe(tipA);

    // 9 s after the tip first appeared: the next one
    act(() => {
      vi.setSystemTime(new Date("2026-11-21T10:00:09.5"));
      vi.advanceTimersByTime(1000);
    });
    expect(shownTip()).not.toBe(tipA);
  });
});
