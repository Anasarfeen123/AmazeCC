import { describe, expect, it } from "vitest";
import { facultyDisplayName, greetingName } from "@/lib/displayNames";

describe("facultyDisplayName", () => {
  it("drops the leading employee id", () => {
    expect(facultyDisplayName("54828 RANJITH R SCOPE")).toBe("RANJITH R SCOPE");
    expect(facultyDisplayName("50772 - NATHIYA N SAS")).toBe("NATHIYA N SAS");
  });
  it("leaves names without an id alone", () => {
    expect(facultyDisplayName("PRIYA MENON")).toBe("PRIYA MENON");
    expect(facultyDisplayName("")).toBe("");
    expect(facultyDisplayName("12345")).toBe("12345");
  });
});

describe("greetingName", () => {
  it("uses the first name in title case", () => {
    expect(greetingName("ANAS SHAMSIL ARFEEN")).toBe("Anas");
    expect(greetingName("demo student")).toBe("Demo");
  });
  it("keeps reg numbers and empty values as they are", () => {
    expect(greetingName("22BCE1234")).toBe("22BCE1234");
    expect(greetingName("")).toBe("");
  });
});
