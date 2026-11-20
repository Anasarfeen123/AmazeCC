import { describe, expect, it } from "vitest";
import { courseAccent } from "@/lib/courseColors";

describe("courseAccent", () => {
  it("is stable for a course code, whatever the case or spacing", () => {
    expect(courseAccent("BCSE203E")).toBe(courseAccent(" bcse203e "));
  });
  it("spreads different courses over different colours", () => {
    const codes = ["BCSE203E", "BCSE205L", "BCSE304L", "BCSE306L", "BMAT201L", "BFRE101L", "BCHY102N", "BSTS202P"];
    expect(new Set(codes.map(courseAccent)).size).toBeGreaterThanOrEqual(4);
  });
  it("has a colour for an empty code", () => {
    expect(courseAccent("")).toMatch(/^#/);
  });
});
