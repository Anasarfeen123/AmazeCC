// Usage: node shot.mjs <outPrefix> [navLabel] [theme=light|dark]
// Opens the app (demo account, or the user's own account with LOGIN=1),
// screenshots at phone/tablet/desktop widths. Options: see HANDOFF.md §6.3.
//
// LOGIN=1 reads AMAZECC_VTOP_USER / AMAZECC_VTOP_PASS from
// ~/.config/amazecc/vtop.env (created by the user, chmod 600). The values are
// never printed or written anywhere by this script, and the throwaway Chromium
// profile (which would hold the session) is deleted on exit.
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const [, , out = "shot", path = "/", theme = "light"] = process.argv;
const BASE = process.env.BASE || "http://localhost:3017";
const port = 9300 + Math.floor(Math.random() * 500);
const prof = mkdtempSync(join(tmpdir(), "chr-"));
const cleanup = () => {
  try {
    rmSync(prof, { recursive: true, force: true });
  } catch {}
};
process.on("exit", cleanup);

function readVtopCredentials() {
  const file = join(homedir(), ".config/amazecc/vtop.env");
  let st;
  try {
    st = statSync(file);
  } catch {
    console.error(`LOGIN=1 needs ${file} (see HANDOFF.md §6.3).`);
    process.exit(2);
  }
  if ((st.mode & 0o077) !== 0) {
    console.error(`${file} must not be readable by others: run  chmod 600 ${file}`);
    process.exit(2);
  }
  const env = Object.fromEntries(
    readFileSync(file, "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [
          l.slice(0, i).trim(),
          l
            .slice(i + 1)
            .trim()
            .replace(/^["']|["']$/g, ""),
        ];
      }),
  );
  if (!env.AMAZECC_VTOP_USER || !env.AMAZECC_VTOP_PASS) {
    console.error(`${file} needs AMAZECC_VTOP_USER and AMAZECC_VTOP_PASS.`);
    process.exit(2);
  }
  return { user: env.AMAZECC_VTOP_USER, pass: env.AMAZECC_VTOP_PASS };
}
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
if (process.env.PRE_W)
  await send("Emulation.setDeviceMetricsOverride", {
    width: Number(process.env.PRE_W),
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
await send("Runtime.enable");
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] });
await send("Page.navigate", { url: BASE + "/" });
await sleep(9000);
if (!process.env.ONBOARD)
  await evalJs(
    `["has_selected_interface","introDone","hasSeenPushPrompt","push_prompt_dismissed","busPromptDismissed"].forEach(k=>localStorage.setItem(k,"true"))`,
  );
if (process.env.LOGIN) {
  const { user, pass } = readVtopCredentials();
  // Open the sign-in form.
  await evalJs(
    `(() => { const b=[...document.querySelectorAll("button,a")].find(e=>/^\\s*get started\\s*$/i.test(e.textContent)); b&&b.click(); })()`,
  );
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    if (await evalJs(`!!document.querySelector('input[autocomplete="current-password"]')`)) break;
  }
  // React-controlled inputs: set through the native setter, then fire input.
  // The values travel only over the local DevTools socket; the result is not logged.
  await evalJs(`(() => {
    const set = (el, v) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const u = document.querySelector('input[autocomplete="username"]');
    const p = document.querySelector('input[autocomplete="current-password"]');
    if (!u || !p) return false;
    set(u, ${JSON.stringify(user)});
    set(p, ${JSON.stringify(pass)});
    p.form?.requestSubmit ? p.form.requestSubmit() : p.form?.submit();
    return true;
  })()`);
  console.log("login: submitted (credentials not shown)");
  // First sync can take a few minutes on VTOP.
  for (let i = 0; i < 150; i++) {
    await sleep(3000);
    const t = (await evalJs("document.body.innerText")) || "";
    if (/set up my home screen|good (morning|afternoon|evening)/i.test(t)) break;
    if (/invalid|incorrect|wrong password|locked/i.test(t) && i > 2) {
      console.error("login: VTOP rejected the sign-in (see the app's message).");
      break;
    }
  }
  await evalJs(
    `["has_selected_interface","introDone","hasSeenPushPrompt","push_prompt_dismissed","busPromptDismissed","fresherWelcomeDismissed"].forEach(k=>localStorage.setItem(k,"true"))`,
  );
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(15000);
} else {
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
}
await sleep(5000);
console.log("url:", await evalJs("location.href"), await evalJs("document.body.innerText.slice(0,200)"));
await evalJs(
  `['has_selected_interface','introDone','hasSeenPushPrompt','push_prompt_dismissed','busPromptDismissed'].forEach(k=>localStorage.setItem(k,'true'))`,
);
await evalJs(
  `localStorage.setItem('theme', ${JSON.stringify(theme)}); document.documentElement.classList.toggle('dark', ${theme === "dark"})`,
);
if (!process.env.NO_RELOAD) {
  await send("Page.navigate", { url: BASE + "/" });
  await sleep(15000);
}
if (!process.env.ONBOARD)
  await evalJs(
    `(() => { const b=[...document.querySelectorAll("button,a")].find(e=>/proceed to dashboard|go to home/i.test(e.textContent)); b&&b.click(); })()`,
  );
await sleep(6000);
if (path !== "/") {
  await evalJs(
    `(() => { const b=(() => { const want=${JSON.stringify(path.toLowerCase())}; const match=(e)=>e.offsetParent && (e.textContent.trim().toLowerCase()===want || (e.getAttribute("aria-label")||"").toLowerCase().startsWith(want)); return [...document.querySelectorAll("[data-sidebar-nav], .mobile-bottom-nav-bar button")].find(match) || [...document.querySelectorAll("button,a,[role=button]")].find(match); })(); b&&b.click(); return !!b })()`,
  );
  await sleep(Number(process.env.NAV_WAIT || 20000));
}
console.log(
  "after reload:",
  (await evalJs("document.body.innerText")).slice(0, Number(process.env.TEXT_LEN || 150)).replace(/\n/g, " | "),
);

if (process.env.CLICK_SEL) {
  await evalJs(
    `(() => { const el=[...document.querySelectorAll(${JSON.stringify(process.env.CLICK_SEL)})].find(e=>e.offsetParent); el&&el.click(); return !!el })()`,
  );
  await sleep(2500);
}
const SIZES = process.env.ONLY_TABLET
  ? [["tablet", 820, 1180, true]]
  : process.env.ONLY_DESKTOP
    ? [["desktop", 1440, 900, false]]
    : process.env.ONLY_PHONE
      ? [["phone", 390, 844, true]]
      : [
          ["phone", 390, 844, true],
          ["tablet", 820, 1180, true],
          ["desktop", 1440, 900, false],
        ];
for (const [name, w, h, mobile] of SIZES) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile });
  await sleep(2500);
  const full = process.env.FULL && name === "phone";
  const dims = full ? (await send("Page.getLayoutMetrics")).result.cssContentSize : null;
  const { result } = await send(
    "Page.captureScreenshot",
    full
      ? {
          format: "png",
          captureBeyondViewport: true,
          clip: { x: 0, y: 0, width: w, height: Math.min(dims.height, 6000), scale: 1 },
        }
      : { format: "png" },
  );
  writeFileSync(`${out}-${name}.png`, Buffer.from(result.data, "base64"));
}
const errs = await evalJs(`document.title`);
console.log("title:", errs);
ws.close();
chrome.kill();
cleanup();
process.exit(0);
