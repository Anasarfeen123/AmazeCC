// node full.mjs <url> <out.png> [width] [scale]
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [, , url, out, w = "1600", sc = "0.5"] = process.argv;
const port = 9800 + Math.floor(Math.random() * 100);
const ch = spawn(
  "chromium-browser",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "c-"))}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50; i++) {
  try {
    const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const p = l.find((t) => t.type === "page");
    if (p) {
      ws = new WebSocket(p.webSocketDebuggerUrl);
      break;
    }
  } catch {}
  await sleep(200);
}
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) {
    pend.get(d.id)(d);
    pend.delete(d.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pend.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: +w, height: 1000, deviceScaleFactor: 1, mobile: +w < 800 });
if (process.env.THEME)
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: process.env.THEME }] });
await send("Page.navigate", { url });
if (process.env.LS_THEME) {
  await sleep(6000);
  await send("Runtime.evaluate", {
    expression: `localStorage.setItem("theme", ${JSON.stringify(process.env.LS_THEME)})`,
  });
  await send("Page.navigate", { url });
}
await sleep(10000);
if (process.env.CLICK_SEL) {
  await send("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(process.env.CLICK_SEL)})?.click()`,
  });
  await sleep(800);
}
const m = await send("Page.getLayoutMetrics");
const cs = m.result.cssContentSize;
console.log("size", cs.width, cs.height);
for (let y = 0; y < cs.height; y += 1000) {
  await send("Runtime.evaluate", { expression: `window.scrollTo(0,${y})` });
  await sleep(1500);
  const q = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out.replace(".png", `-${String(y / 1000).padStart(2, "0")}.png`), Buffer.from(q.result.data, "base64"));
}
const r = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: true,
  clip: { x: 0, y: 0, width: cs.width, height: Math.min(cs.height, 30000), scale: +sc },
});
writeFileSync(out, Buffer.from(r.result.data, "base64"));
ws.close();
ch.kill();
process.exit(0);
