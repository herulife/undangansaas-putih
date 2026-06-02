const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const partialDir = path.join(__dirname, "partials");
const manifestPath = path.join(__dirname, "manifest.json");
const outputPath = path.join(root, "index.html");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const html = manifest.partials
  .map((file) => fs.readFileSync(path.join(partialDir, file), "utf8"))
  .join("\n");

fs.writeFileSync(outputPath, html, "utf8");
console.log(`Built ${path.relative(root, outputPath)} from ${manifest.partials.length} partials`);
