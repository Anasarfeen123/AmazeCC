import { render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAppAppearance } from "../components/custom/app/useAppAppearance";
import { StatTile } from "../components/custom/shared/primitives/Surfaces";
import { privacyCategories, setHideAllPrivacy, togglePrivacyCategory } from "../lib/privacyMode";
import { defaultSettings } from "../store/settingsAtoms";

describe("privacy mode", () => {
  it("adds and removes the privacy-mode class on <html>", () => {
    const { rerender } = renderHook(
      // "Hide all" = every category chosen; plain privacyMode now means CGPA only.
      ({ on }) =>
        useAppAppearance(
          {
            privacyMode: on,
            privacyCategories: ["cgpa", "attendance", "marks", "fees", "credits", "id", "identity"],
            colorPalette: "default",
          },
          "dark",
        ),
      {
        initialProps: { on: true },
      },
    );
    expect(document.documentElement.classList.contains("privacy-mode")).toBe(true);
    rerender({ on: false });
    expect(document.documentElement.classList.contains("privacy-mode")).toBe(false);
  });

  it("marks stat tile values as private", () => {
    const { getByText } = render(<StatTile label="CGPA" value="8.91" privacyCategory="cgpa" />);
    expect(getByText("8.91").getAttribute("data-private")).toBe("cgpa");
  });

  it("adds just the selected category class on <html>", () => {
    const { unmount } = renderHook(() => useAppAppearance({ privacyMode: true, privacyCategories: ["fees"] }, "dark"));
    expect(document.documentElement.classList.contains("privacy-hide-fees")).toBe(true);
    expect(document.documentElement.classList.contains("privacy-hide-marks")).toBe(false);
    expect(document.documentElement.classList.contains("privacy-mode")).toBe(false);
    unmount();
  });

  it("migrates legacy privacy choices without exposing their values", () => {
    // User decision (2026-11-19): Privacy Mode hides CGPA unless more is chosen.
    expect(privacyCategories({ privacyMode: true })).toEqual(["cgpa"]);
    expect(privacyCategories({ CGPAHidden: true })).toEqual(["cgpa"]);
  });

  it("keeps Hide all and individual category changes in sync", () => {
    const hidden = setHideAllPrivacy(defaultSettings, true);
    expect(hidden.privacyCategories).toHaveLength(7);
    const feesOnly = togglePrivacyCategory(hidden, "cgpa", false);
    expect(feesOnly.privacyMode).toBe(true);
    expect(feesOnly.privacyCategories).not.toContain("cgpa");
  });
});
