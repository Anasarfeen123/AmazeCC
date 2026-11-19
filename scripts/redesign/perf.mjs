// node perf.mjs <url> <selectorOrText>...  -> per click: longest main-thread block and total long-task ms
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [, , url, ...targets] = process.argv;
const port = 9600 + Math.floor(Math.random() * 100);
const prof = mkdtempSync(join(tmpdir(), "p-"));
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
const pend = new Map();
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) {
    pend.get(d.id)(d);
    pend.delete(d.id);
  }
  if (d.method === "Runtime.exceptionThrown")
    console.log("EXC", (d.params.exceptionDetails.exception?.description || "").slice(0, 200));
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pend.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (e) =>
  (await send("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });
await sleep(14000);
await ev(
  `window.__lt=[]; new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lt.push(e.duration)}).observe({type:'longtask',buffered:false}); true`,
);
for (const t of targets) {
  await ev(`window.__lt=[]`);
  const t0 = Date.now();
  const ok = await ev(
    `(async()=>{ const want=${JSON.stringify(t)}; let el=null; try{ el=document.querySelector(want) }catch{}; if(!el) el=[...document.querySelectorAll('button,[role=button],a,td,div')].filter(e=>e.offsetParent && e.children.length<4).find(e=>e.textContent.trim()===want); if(!el) el=[...document.querySelectorAll('button,[role=button],a')].filter(e=>e.offsetParent).find(e=>e.textContent.trim().startsWith(want)); if(!el && want.startsWith('type:')){ const [_,sel,txt]=want.split('|'); const inp=document.querySelector(sel); if(!inp) return 'noinput'; const s=performance.now(); const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; for(const ch of txt){ set.call(inp, inp.value+ch); inp.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,0)); } await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0))); return Math.round(performance.now()-s); } if(!el) return 'missing'; const s=performance.now(); el.click(); await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0))); return Math.round(performance.now()-s); })()`,
  );
  await sleep(1500);
  const lt = await ev(`window.__lt`);
  console.log(`${t.padEnd(28)} click->frame ${ok}ms  longtasks ${JSON.stringify((lt || []).map(Math.round))}`);
}
ws.close();
ch.kill();
rmSync(prof, { recursive: true, force: true });
process.exit(0);
