const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");

const required = [
  "id=\"coverModal\"",
  "id=\"nav-cover\"",
  "id=\"nav-perihal\"",
  "id=\"nav-acara\"",
  "id=\"nav-cerita\"",
  "id=\"nav-galeri\"",
  "id=\"nav-tamu\"",
  "id=\"nav-lainnya\"",
  "do-animate",
  "animate-start",
  "PhotoSwipe",
  "islamic-wedding-backsound.m4a"
];

const requiredFiles = [
  "assets/css/animation-scroll.css",
  "assets/css/animation-idle.css",
  "assets/css/fonts.css",
  "assets/fonts/abril.ttf",
  "assets/fonts/ltcomical.ttf",
  "assets/vendor/fontawesome/webfonts/fa-solid-900.woff2",
  "assets/js/animation-scroll.js"
];

const missing = required.filter((needle) => !html.includes(needle));
const missingFiles = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
const remotePatterns = [
  /share\.linkundangan\.com\/(reservation|guestbook|counterviewer|attendance|inv-json)/i,
  /wss:\/\/invity\.link/i,
  /www\.youtube\.com\/embed/i,
  /maps\.google\.com\/maps/i
];
const activeRemote = remotePatterns.filter((pattern) => pattern.test(html));
const textFiles = [
  htmlPath,
  ...fs.readdirSync(path.join(root, "assets", "css")).map((name) => path.join(root, "assets", "css", name)),
  ...fs.readdirSync(path.join(root, "assets", "js")).map((name) => path.join(root, "assets", "js", name))
];
const oldPathPatterns = [
  /files\/assets-builder/i,
  /Templates\/WEDDING/i,
  /AdminLTE/i,
  /BgroundBsound/i,
  /images\/gif/i,
  /(?:^|["'(=])(?:\.\/)?css\//i,
  /(?:^|["'(=])(?:\.\/)?js\//i,
  /libraries\//i
];
const activeOldPaths = [];
for (const file of textFiles) {
  const content = fs.readFileSync(file, "utf8");
  for (const pattern of oldPathPatterns) {
    if (pattern.test(content)) activeOldPaths.push(`${path.relative(root, file)} -> ${pattern}`);
  }
}

const assetRefs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
  .map((m) => m[1])
  .filter((ref) => ref && !ref.includes("${") && !ref.startsWith("#") && !ref.startsWith("mailto:") && !ref.startsWith("tel:") && !ref.startsWith("data:") && !/^https?:\/\//i.test(ref));

const broken = [];
for (const ref of assetRefs) {
  const clean = ref.split("?")[0].replace(/^\.\//, "");
  if (clean === "" || clean.startsWith("invcode/")) continue;
  const target = path.join(root, clean);
  if (!fs.existsSync(target)) broken.push(ref);
}

if (missing.length || missingFiles.length || activeRemote.length || activeOldPaths.length || broken.length) {
  console.error("Audit failed");
  if (missing.length) console.error("Missing:", missing.join(", "));
  if (missingFiles.length) console.error("Missing animation files:", missingFiles.join(", "));
  if (activeRemote.length) console.error("Active remote patterns:", activeRemote.map(String).join(", "));
  if (activeOldPaths.length) console.error("Old path patterns:", [...new Set(activeOldPaths)].slice(0, 40).join(", "));
  if (broken.length) console.error("Broken local refs:", [...new Set(broken)].slice(0, 40).join(", "));
  process.exit(1);
}

console.log("Audit passed: sections, core animation hooks, local media, and blocked remote services look good.");
