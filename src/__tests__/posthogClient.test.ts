import { describe, expect, it, vi } from "vitest";

const real = {
  __loaded: true,
  capture: vi.fn(),
  people: { set: vi.fn() },
  logger: { info: vi.fn() },
  get_distinct_id: vi.fn(() => "abc"),
};
vi.mock("posthog-js", () => ({ default: real }));

describe("posthogClient stand-in", () => {
  it("queues calls before load and replays them in order", async () => {
    const { default: posthog, loadPostHog } = await import("../lib/posthogClient");
    const early = (posthog as any).logger;
    expect((posthog as any).__loaded).toBe(false);
    expect((posthog as any).get_distinct_id?.()).toBeUndefined();
    posthog.capture("first", { a: 1 });
    (posthog as any).people.set({ year: 2 });
    expect(real.capture).not.toHaveBeenCalled();

    await loadPostHog();
    expect(real.capture).toHaveBeenCalledWith("first", { a: 1 });
    expect(real.people.set).toHaveBeenCalledWith({ year: 2 });

    // After load it forwards directly, including references taken early.
    posthog.capture("second");
    expect(real.capture).toHaveBeenLastCalledWith("second");
    early.info("hi");
    expect(real.logger.info).toHaveBeenCalledWith("hi");
    expect((posthog as any).get_distinct_id()).toBe("abc");
    expect((posthog as any).__loaded).toBe(true);
  });
});
