#!/usr/bin/env node
// Demo smoke test: signs into the demo account in headless Chromium, opens
// every demo page and fails when one shows an empty or error state, throws a
// script error, or never renders a title. Catches the regressions that used to
// be found by clicking through by hand (stale demo dates, "No menu saved yet",
// Events hitting the live API in demo, ...).
//
//   node scripts/demo-check.mjs                    # against http://localhost:3017
//   BASE=https://amazecc-redesign.pages.dev node scripts/demo-check.mjs
//   CHROME=/usr/bin/google-chrome node scripts/demo-check.mjs
//
// Exit code 0 = every page passed, 1 = at least one failed (report printed).
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.env.BASE || "http://localhost:3017").replace(/\/$/, "");
const CHROME = process.env.CHROME || "chromium-browser";
const WAIT_MS = Number(process.env.WAIT_MS || 30000);

/** [name, route, empty states that are fine on this page]. */
const PAGES = [
  ["Home", "/", []],
  ["My Courses & Marks", "/?tab=academics-courses", []],
  ["Grade History", "/?tab=academics-grades", []],
  ["Degree Curriculum", "/?tab=academics-curriculum", []],
  ["Exam Schedule", "/?tab=academics-schedule", []],
  ["Calendar", "/?tab=attendance-calendar", []],
  ["Skip predictor", "/?tab=tools-attendance-predictor", []],
  ["Payments", "/?tab=payments", []],
  ["Libraries", "/?tab=libraries", []],
  ["Hostel Hub", "/?tab=hostel-overview", []],
  ["Event Hub", "/?tab=events", []],
  ["Clubs", "/?tab=clubs", []],
  ["Free classrooms", "/?tab=free-class", []],
  ["Faculty schedule", "/?tab=faculty-schedule", []],
  ["Tasks", "/?tab=tasks", []],
  ["Find classmates", "/?tab=friend-finder", []],
  // Your own content starts empty for everyone.
  ["Paper scanner", "/?tab=paper-scanner", [/No scans yet/i]],
  ["FFCS planner", "/?tab=ffcs", [/Start your plan/i]],
  ["Settings", "/?tab=profile", []],
];

/** Text that means a page has nothing to show or failed. */
const BAD = [
  /\bNo [a-z ]{2,40} (yet|found|available|recorded|scheduled)\b[^\n]{0,40}/i,
  /\bNothing (scheduled|to show|here)[^\n]{0,40}/i,
  /\bAll done\b[^\n]{0,30}/,
  /\bcouldn.t (load|reach)[^\n]{0,40}/i,
  /\bisn.t available yet\b[^\n]{0,40}/i,
  /\bSomething went wrong\b/i,
  /\bSession expired\b/i,
];

const prof = mkdtempSync(join(tmpdir(), "demo-check-"));
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${prof}`,
    "--no-first-run",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const cleanup = () => {
  try {
    chrome.kill();
  } catch {}
  try {
    rmSync(prof, { recursive: true, force: true });
  } catch {}
};
process.on("exit", cleanup);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ws;
for (let i = 0; i < 60 && !ws; i++) {
  try {
    const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch {}
  if (!ws) await sleep(250);
}
if (!ws) {
  console.error(`Could not start ${CHROME}. Set CHROME to a Chrome/Chromium binary.`);
  process.exit(2);
}
await new Promise((r) => (ws.onopen = r));

let seq = 0;
const pending = new Map();
let errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.method === "Runtime.exceptionThrown") {
    errors.push(d.params.exceptionDetails?.exception?.description?.split("\n")[0] || d.params.exceptionDetails?.text);
  }
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++seq;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const evaluate = async (expression) =>
  (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

// Enter the demo the way a visitor does.
await send("Page.navigate", { url: `${BASE}/` });
await sleep(4000);
await evaluate(
  `["has_selected_interface","introDone","hasSeenPushPrompt","push_prompt_dismissed","busPromptDismissed"].forEach(k=>localStorage.setItem(k,"true"))`,
);
let entered = false;
for (let i = 0; i < 20 && !entered; i++) {
  entered = await evaluate(
    `(() => { const b=[...document.querySelectorAll("button,a")].find(e=>/^\\s*try the demo\\s*$/i.test(e.textContent||"")); if(b){b.click(); return true} return false })()`,
  );
  if (!entered) await sleep(500);
}
if (!entered) {
  console.error(`No "Try the demo" button on ${BASE}/`);
  process.exit(1);
}
await sleep(6000);

const results = [];
for (const [name, route, allowed] of PAGES) {
  errors = [];
  await send("Page.navigate", { url: BASE + route });
  // Wait for a title and for loading placeholders to clear.
  const t0 = Date.now();
  let state = null;
  while (Date.now() - t0 < WAIT_MS) {
    await sleep(800);
    state = await evaluate(`(() => ({
      h1: ([...document.querySelectorAll("h1")].map(e => e.textContent.trim()).find(Boolean) || ""),
      busy: !!document.querySelector('[aria-busy="true"]'),
      text: document.body.innerText,
    }))()`);
    if (state?.h1 && !state.busy) break;
  }
  await sleep(1200);
  state = await evaluate(
    `({ h1: ([...document.querySelectorAll("h1")].map(e => e.textContent.trim()).find(Boolean) || ""), text: document.body.innerText })`,
  );
  const problems = [];
  if (!state?.h1) problems.push("no page title (h1) rendered");
  for (const re of BAD) {
    const m = state?.text?.match(re);
    if (m && !allowed.some((a) => a.test(m[0]))) problems.push(`empty/error state: "${m[0].trim()}"`);
  }
  for (const e of errors) problems.push(`script error: ${e}`);
  results.push({ name, route, problems });
  console.log(`${problems.length ? "FAIL" : "ok  "}  ${name.padEnd(20)} ${problems.join(" | ")}`);
}

const failed = results.filter((r) => r.problems.length);
console.log(`\n${results.length - failed.length}/${results.length} demo pages passed${failed.length ? "" : "."}`);
cleanup();
process.exit(failed.length ? 1 : 0);
