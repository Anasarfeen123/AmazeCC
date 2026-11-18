// Usage: node shot.mjs <outPrefix> [path] [theme=light|dark]
// Opens the app, enters demo mode, screenshots at phone/tablet/desktop widths.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , out = "shot", path = "/", theme = "light"] = process.argv;
const BASE = process.env.BASE || "http://localhost:3017";
const port = 9300 + Math.floor(Math.random() * 500);
const prof = mkdtempSync(join(tmpdir(), "chr-"));
const chrome = spawn(
  "chromium-browser",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${prof}`,
    "--no-first-run",
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
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = list.find((t) => t.type === "page");
    if (page) {
      ws = new WebSocket(page.webSocketDebuggerUrl);
      break;
    }
  } catch {}
  await sleep(200);
}
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.method === "Runtime.exceptionThrown")
    console.log("EXC", JSON.stringify(d.params.exceptionDetails).slice(0, 400));
  if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error")
    console.log("CERR", JSON.stringify(d.params.args).slice(0, 300));
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evalJs = async (expr) =>
  (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] });
await send("Page.navigate", { url: BASE + "/" });
await sleep(9000);
// enter demo
const clicked = await evalJs(
  `(() => { const b=[...document.querySelectorAll('button,a')].find(e=>/^\s*try the demo\s*$/i.test(e.textContent)); if(b){b.click(); return b.textContent.trim();} return null })()`,
);
console.log(
  "demo button:",
  clicked,
  await evalJs(
    `Object.keys([...document.querySelectorAll("button")].find(e=>/try the demo/i.test(e.textContent))).join(",")`,
  ),
);
for (let i = 0; i < 60; i++) {
  await sleep(2000);
  const t = await evalJs("document.body.innerText");
  if (i % 3 == 0)
    await evalJs(
      `(() => { const b=[...document.querySelectorAll("button")].find(e=>/^\\s*try the demo\\s*$/i.test(e.textContent)); b&&b.click(); })()`,
    );
  if (t && !/Your VIT life/.test(t) && t.length > 200) break;
}
await sleep(5000);
console.log("url:", await evalJs("location.href"), await evalJs("document.body.innerText.slice(0,200)"));
await evalJs(
  `['has_selected_interface','introDone','hasSeenPushPrompt','push_prompt_dismissed','busPromptDismissed'].forEach(k=>localStorage.setItem(k,'true'))`,
);
await evalJs(
  `localStorage.setItem('theme', ${JSON.stringify(theme)}); document.documentElement.classList.toggle('dark', ${theme === "dark"})`,
);
await send("Page.navigate", { url: BASE + "/" });
await sleep(15000);
await evalJs(
  `(() => { const b=[...document.querySelectorAll("button,a")].find(e=>/proceed to dashboard/i.test(e.textContent)); b&&b.click(); })()`,
);
await sleep(6000);
if (path !== "/") {
  await evalJs(
    `(() => { const b=[...document.querySelectorAll("button,a,[role=button]")].find(e=>e.textContent.trim().toLowerCase()===${JSON.stringify(path.toLowerCase())} && e.offsetParent); b&&b.click(); return !!b })()`,
  );
  await sleep(Number(process.env.NAV_WAIT || 20000));
}
console.log(
  "after reload:",
  (await evalJs("document.body.innerText")).slice(0, Number(process.env.TEXT_LEN || 150)).replace(/\n/g, " | "),
);

for (const [name, w, h, mobile] of [
  ["phone", 390, 844, true],
  ["tablet", 820, 1180, true],
  ["desktop", 1440, 900, false],
]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await sleep(2500);
  const { result } = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}-${name}.png`, Buffer.from(result.data, "base64"));
}
const errs = await evalJs(`document.title`);
console.log("title:", errs);
ws.close();
chrome.kill();
process.exit(0);
