// node console.mjs <url>  -> prints console errors / exceptions after load
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const url = process.argv[2];
const port = 9700 + Math.floor(Math.random() * 100);
const prof = mkdtempSync(join(tmpdir(), "c-"));
const ch = spawn(
  "chromium-browser",
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "--disable-gpu", "about:blank"],
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
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.method === "Runtime.exceptionThrown")
    console.log(
      "EXC",
      (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text).slice(0, 400),
    );
  if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "error" || d.params.type === "warning"))
    console.log(
      d.params.type.toUpperCase(),
      d.params.args
        .map((a) => a.value ?? a.description ?? "")
        .join(" ")
        .slice(0, 400),
    );
};
const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }));
send("Runtime.enable");
send("Page.enable");
send("Page.navigate", { url });
await sleep(15000);
ws.close();
ch.kill();
rmSync(prof, { recursive: true, force: true });
process.exit(0);
