import { existsSync, statSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const html = await readFile(path.join(root, "index.html"), "utf8");
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(full);
  }
}

await walk(root);

const refs = new Set();
const addRef = (value) => {
  value = String(value || "").trim();
  if (!value || value.startsWith("data:") || value.startsWith("#") || value.startsWith("[")) return;
  if (/^(https?:)?\/\//i.test(value)) {
    refs.add(value);
    return;
  }
  if (value.startsWith("/")) return;
  refs.add(value.split(/[?#]/)[0]);
};

for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) addRef(match[1]);
for (const match of html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) addRef(match[1]);

const scannedCss = new Set();
let changed = true;
while (changed) {
  changed = false;
  for (const ref of Array.from(refs)) {
    if (!ref.endsWith(".css") || scannedCss.has(ref)) continue;
    scannedCss.add(ref);
    const file = path.join(root, ref);
    if (!existsSync(file)) continue;
    const before = refs.size;
    const css = await readFile(file, "utf8");
    const relDir = path.posix.dirname(ref);
    for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
      const cssRef = String(match[1] || "").trim();
      if (!cssRef || cssRef.startsWith("data:")) continue;
      if (/^(https?:)?\/\//i.test(cssRef)) {
        refs.add(cssRef);
        continue;
      }
      const normalized = path.posix.normalize(`${relDir}/${cssRef}`.replaceAll("\\", "/"));
      addRef(normalized);
    }
    changed = changed || refs.size !== before;
  }
}

const missing = [];
const remote = [];
const allowedMaps = [];
let referencedBytes = 0;

for (const ref of refs) {
  if (/^(https?:)?\/\//i.test(ref)) {
    if (/^https:\/\/(?:www\.)?(?:maps|google)\.google\.com\/maps/i.test(ref)) {
      allowedMaps.push(ref);
      continue;
    }
    remote.push(ref);
    continue;
  }
  const full = path.join(root, ref);
  if (!existsSync(full)) missing.push(ref);
  else referencedBytes += statSync(full).size;
}

console.log(`Files: ${files.length}`);
console.log(`Refs: ${refs.size}`);
console.log(`Missing refs: ${missing.length}`);
console.log(`Remote refs: ${remote.length}`);
console.log(`Allowed maps embeds: ${allowedMaps.length}`);
console.log(`Referenced bytes: ${referencedBytes}`);
if (missing.length) console.log(missing.join("\n"));
if (remote.length) console.log(remote.join("\n"));
