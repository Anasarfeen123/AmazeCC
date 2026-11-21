import { describe, expect, it } from "vitest";
import { valueFitClass } from "../lib/valueFit";

describe("valueFitClass", () => {
  it("keeps short values big", () => {
    expect(valueFitClass("79%")).toContain("text-[32px]");
  });
  it("never wraps a single word like a course code", () => {
    const c = valueFitClass("BCSE302L");
    expect(c).toContain("whitespace-nowrap");
    expect(c).toContain("text-[22px]");
  });
  it("lets phrases wrap at spaces, two lines at most", () => {
    const c = valueFitClass("Data Structures Lab");
    expect(c).toContain("line-clamp-2");
    expect(c).toContain("text-[18px]");
  });
});
