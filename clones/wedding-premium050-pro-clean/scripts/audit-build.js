import fs from "node:fs";
import path from "node:path";

const root = path.resolve("dist");
const htmlPath = path.join(root, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const files = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else files.push(fullPath);
  }
};

walk(root);

const textFiles = files.filter((file) => /\.(html|css|js)$/i.test(file));
const text = textFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
const remoteRefs = [...text.matchAll(/https?:\/\/[^"')\s]+/gi)].map((match) => match[0]);
const refs = [];

for (const file of textFiles) {
  const fileText = fs.readFileSync(file, "utf8");
  const baseDir = path.dirname(file);

  for (const match of fileText.matchAll(/(?:src|href)=["']\.\/([^"']+)["']/gi)) {
    if (match[1]) refs.push(path.join(root, match[1].split("?")[0]));
  }

  for (const match of fileText.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
    const rawRef = match[1];
    if (!rawRef || rawRef.startsWith("data:") || rawRef.startsWith("#") || rawRef.startsWith("http")) continue;
    const cleanRef = rawRef.split("?")[0];
    refs.push(cleanRef.startsWith("/") ? path.join(root, cleanRef) : path.resolve(baseDir, cleanRef));
  }
}

const missing = refs.filter((ref) => ref && !fs.existsSync(ref));

console.log(`Files: ${files.length}`);
console.log(`Asset refs: ${refs.length}`);
console.log(`Missing refs: ${missing.length}`);
console.log(`Remote refs: ${remoteRefs.length}`);
console.log(`HTML bytes: ${Buffer.byteLength(html)}`);

if (missing.length) {
  console.log("Missing:");
  missing.forEach((ref) => console.log(`- ${path.relative(root, ref)}`));
}

if (remoteRefs.length) {
  console.log("Remote refs:");
  remoteRefs.forEach((ref) => console.log(`- ${ref}`));
}

if (missing.length || remoteRefs.length) process.exit(1);
