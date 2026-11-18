import { describe, expect, it } from "vitest";
import { isFresherRegNo } from "@/lib/fresher";

describe("isFresherRegNo", () => {
  const nov2026 = new Date(2026, 10, 19);
  const mar2027 = new Date(2027, 2, 1);
  const aug2027 = new Date(2027, 7, 1);

  it("is true for this academic year's admissions", () => {
    expect(isFresherRegNo("26BCE1234", nov2026)).toBe(true);
    expect(isFresherRegNo("26bce1234", mar2027)).toBe(true);
  });

  it("is false for seniors", () => {
    expect(isFresherRegNo("25BCE1234", nov2026)).toBe(false);
    expect(isFresherRegNo("22BCE1234", nov2026)).toBe(false);
    expect(isFresherRegNo("26BCE1234", aug2027)).toBe(false);
  });

  it("is false when the number is unknown or not a reg number", () => {
    expect(isFresherRegNo("", nov2026)).toBe(false);
    expect(isFresherRegNo(undefined, nov2026)).toBe(false);
    expect(isFresherRegNo("20626703", nov2026)).toBe(false);
  });
});
