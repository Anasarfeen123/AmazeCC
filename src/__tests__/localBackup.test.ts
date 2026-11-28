import { beforeEach, describe, expect, it } from "vitest";
import { createLocalBackup, parseLocalBackup, restoreLocalBackup } from "../lib/localBackup";
import { memoryScanStore } from "../lib/scanner/store";
import type { ScanRecord } from "../lib/scanner/types";

function scan(id: string, text = `pdf-${id}`): ScanRecord {
  return {
    meta: {
      id,
      createdAt: 1_700_000_000_000,
      title: `Paper ${id}`,
      subjectCode: "BCSE204L",
      kind: "exam",
      kindConfidence: 0.9,
      pageCount: 1,
      sizeBytes: text.length,
      quality: { score: 80, label: "clean" },
      ocr: { engine: "none", confidence: null, preview: "" },
      upload: { status: "local" },
    },
    pdf: new Blob([text], { type: "application/pdf" }),
    thumbnail: new Blob([`thumb-${id}`], { type: "image/jpeg" }),
    ocrText: `OCR ${id}`,
  };
}

describe("local data backup", () => {
  beforeEach(() => localStorage.clear());

  it("includes app data and scanner files, but never credentials or tokens", async () => {
    localStorage.setItem("tasks", JSON.stringify([{ title: "Study" }]));
    localStorage.setItem("theme", "dark");
    localStorage.setItem("password", "vtop-secret");
    localStorage.setItem("amaze_oidc_access_token", "access-secret");
    localStorage.setItem("social_grants_v1_12345678", "bearer-secret");
    const scanner = memoryScanStore();
    await scanner.put(scan("scan-1"));

    const backup = await createLocalBackup(localStorage, scanner);
    const parsed = parseLocalBackup(JSON.stringify(backup));

    expect(parsed.data.localStorage).toEqual({ tasks: '[{"title":"Study"}]', theme: "dark" });
    expect(parsed.data.excludedCredentialCount).toBe(3);
    expect(parsed.data.scans).toHaveLength(1);
    expect(await new Blob([atob(parsed.data.scans[0].pdf.base64)]).text()).toBe("pdf-scan-1");
  });

  it("merges without overwriting existing values or same-id scanner records", async () => {
    const sourceStore = memoryScanStore();
    await sourceStore.put(scan("shared", "backup version"));
    await sourceStore.put(scan("new"));
    localStorage.setItem("tasks", "backup tasks");
    localStorage.setItem("theme", "dark");
    const backup = parseLocalBackup(JSON.stringify(await createLocalBackup(localStorage, sourceStore)));

    const targetStore = memoryScanStore();
    await targetStore.put(scan("shared", "current version"));
    localStorage.clear();
    localStorage.setItem("tasks", "current tasks");
    localStorage.setItem("password", "keep-login");
    await restoreLocalBackup(backup, "merge", localStorage, targetStore);

    expect(localStorage.getItem("tasks")).toBe("current tasks");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("password")).toBe("keep-login");
    expect(await (await targetStore.get("shared"))?.pdf.text()).toBe("current version");
    expect(await (await targetStore.get("new"))?.pdf.text()).toBe("pdf-new");
  });

  it("replaces backed-up app data and scanner records, preserving login data", async () => {
    const sourceStore = memoryScanStore();
    await sourceStore.put(scan("restored"));
    localStorage.setItem("tasks", "backup tasks");
    const backup = parseLocalBackup(JSON.stringify(await createLocalBackup(localStorage, sourceStore)));

    const targetStore = memoryScanStore();
    await targetStore.put(scan("old"));
    localStorage.clear();
    localStorage.setItem("unbacked-app-state", "remove me");
    localStorage.setItem("password", "keep-login");
    await restoreLocalBackup(backup, "replace", localStorage, targetStore);

    expect(localStorage.getItem("tasks")).toBe("backup tasks");
    expect(localStorage.getItem("unbacked-app-state")).toBeNull();
    expect(localStorage.getItem("password")).toBe("keep-login");
    expect(await targetStore.get("old")).toBeUndefined();
    expect(await (await targetStore.get("restored"))?.pdf.text()).toBe("pdf-restored");
  });

  it("restores legacy settings files without removing unrelated data or scans", async () => {
    const scanner = memoryScanStore();
    await scanner.put(scan("keep"));
    localStorage.setItem("tasks", "keep");
    const backup = parseLocalBackup(JSON.stringify({ settings: '{"theme":"dark"}', appIcon: "default" }));

    await restoreLocalBackup(backup, "replace", localStorage, scanner);

    expect(localStorage.getItem("settings")).toBe('{"theme":"dark"}');
    expect(localStorage.getItem("app-icon")).toBe("default");
    expect(localStorage.getItem("tasks")).toBe("keep");
    expect(await scanner.get("keep")).toBeDefined();
  });

  it("rejects malformed or credential-bearing backup files", () => {
    expect(() => parseLocalBackup("{")).toThrow(/valid JSON/);
    expect(() =>
      parseLocalBackup(
        JSON.stringify({
          format: "amazecc-local-backup",
          version: 1,
          createdAt: new Date().toISOString(),
          localStorage: { password: "secret" },
          scans: [],
        }),
      ),
    ).toThrow(/secret key/);
  });
});
