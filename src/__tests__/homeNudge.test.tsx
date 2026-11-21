import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import HomeNudge from "@/components/custom/mobile/HomeNudge";

vi.mock("@/lib/pwaInstall", () => ({ usePwaInstall: () => ({ canInstall: false, promptInstall: vi.fn() }) }));

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("HomeNudge", () => {
  it("offers the current semester, switches, and stays dismissed for 3 days", () => {
    const onSwitch = vi.fn();
    const { unmount } = render(
      <HomeNudge currentSemesterId="CH20262701" viewingSemesterId="CH20252605" onSwitchSemester={onSwitch} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /switch to/i }));
    expect(onSwitch).toHaveBeenCalledWith("CH20262701");
    unmount();

    // Snoozed: does not come back on the next render…
    render(<HomeNudge currentSemesterId="CH20262701" viewingSemesterId="CH20252605" onSwitchSemester={onSwitch} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows nothing when already on the current semester", () => {
    render(<HomeNudge currentSemesterId="CH20262701" viewingSemesterId="CH20262701" onSwitchSemester={vi.fn()} />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("comes back after the snooze ends", () => {
    store.set("amazecc.nudge.semester", String(Date.now() - 1000));
    render(<HomeNudge currentSemesterId="CH20262701" viewingSemesterId="CH20252605" onSwitchSemester={vi.fn()} />);
    expect(screen.getByRole("status")).toBeDefined();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /dismiss for 3 days/i }));
    });
    expect(screen.queryByRole("status")).toBeNull();
    expect(Number(store.get("amazecc.nudge.semester"))).toBeGreaterThan(Date.now() + 2.9 * 86_400_000);
  });
});
