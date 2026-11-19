import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FFCSPageView from "../app/ffcs/FFCSPageView";

// The planner tab calls `useRouter().replace(...)`; no app router is mounted in
// this environment, so supply one.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

function setLayoutMode(mode?: "guided" | "modern") {
  const values = new Map<string, string>();
  if (mode) values.set("ffcs_layout_mode", mode);
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  });
}

describe("FFCSPageView", () => {
  it("shows the brand top bar with a way into AmazeCC and no back button", async () => {
    // Brand redesign: the standalone planner always has a sticky teal top bar
    // that marks it as the separate FFCS planner (it opens in its own tab).
    setLayoutMode("guided");
    render(<FFCSPageView />);

    expect(screen.queryByText(/Back to AmazeCC Home/i)).toBeNull();
    expect(screen.queryByText(/VTOP Login/i)).toBeNull();
    expect(screen.queryByText("App")).toBeNull();

    const home = screen.getByRole("link", { name: "AmazeCC home" });
    expect(home.getAttribute("href")).toBe("/");
    expect(screen.getByText("FFCS planner")).toBeDefined();
    expect(screen.getByRole("link", { name: "Sign in to AmazeCC" })).toBeDefined();
  }, 30_000);

  it("does not offer a separate FFCS app install action", () => {
    setLayoutMode("guided");
    render(<FFCSPageView />);
    expect(screen.queryByRole("button", { name: /Install App/i })).toBeNull();
  }, 30_000);

  it("keeps the top bar on phones and the content inside page margins", () => {
    setLayoutMode();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = render(<FFCSPageView />);
      const header = container.querySelector("header");
      expect(header?.className).toContain("sticky");
      const main = container.querySelector("main");
      expect(main?.className).toContain("max-w-[1440px]");
      expect(main?.className).toContain("px-4");
      expect(main?.className).toContain("sm:px-8");
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: originalWidth,
      });
    }
  }, 30_000);
});
