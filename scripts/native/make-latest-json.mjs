#!/usr/bin/env node
// Write latest.json, the feed the desktop app's updater reads
// (native/tauri/src-tauri/tauri.conf.json → plugins.updater.endpoints).
//   node scripts/native/make-latest-json.mjs <dist-dir> <version> <repo> <tag>
// Pairs every updater bundle with its .sig: Windows NSIS setup, macOS
// .app.tar.gz (universal, so both Mac platforms), Linux AppImage.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const [dist, version, repo, tag] = process.argv.slice(2);
if (!dist || !version || !repo || !tag) {
  console.error("usage: make-latest-json.mjs <dist-dir> <version> <repo> <tag>");
  process.exit(1);
}
const files = [];
const walk = (d) =>
  readdirSync(d).forEach((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : files.push(join(d, f))));
walk(dist);

const url = (file) => `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(basename(file))}`;
const signed = (pred) => {
  const file = files.find((f) => pred(f) && files.includes(`${f}.sig`));
  return file ? { signature: readFileSync(`${file}.sig`, "utf8").trim(), url: url(file) } : null;
};

const platforms = {};
const win = signed((f) => /-setup\.exe$/.test(f));
const mac = signed((f) => /\.app\.tar\.gz$/.test(f));
const linux = signed((f) => /\.AppImage$/.test(f));
if (win) platforms["windows-x86_64"] = win;
if (mac) {
  platforms["darwin-aarch64"] = mac;
  platforms["darwin-x86_64"] = mac;
}
if (linux) platforms["linux-x86_64"] = linux;

if (Object.keys(platforms).length === 0) {
  console.error("No signed updater bundles found (is TAURI_SIGNING_PRIVATE_KEY set?). Skipping latest.json.");
  process.exit(0);
}
const out = join(dist, "latest.json");
writeFileSync(
  out,
  JSON.stringify({ version, notes: `AmazeCC ${version}`, pub_date: new Date().toISOString(), platforms }, null, 2) +
    "\n",
);
console.log(`Wrote ${out} for ${Object.keys(platforms).join(", ")}`);
