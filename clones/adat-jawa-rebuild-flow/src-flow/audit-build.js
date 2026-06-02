const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const assetRefs = [...html.matchAll(/(?:src|href|poster)=["'](\.\/assets\/[^"']+)["']/g)].map((m) => m[1]);
const missing = assetRefs.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
const remoteScripts = [...html.matchAll(/<script[^>]+src=["']https?:\/\//gi)].length;
const remoteCss = [...html.matchAll(/<link[^>]+href=["']https?:\/\/[^"']+\.css/gi)].length;

console.log(`Asset refs: ${assetRefs.length}`);
console.log(`Missing refs: ${missing.length}`);
console.log(`Remote scripts: ${remoteScripts}`);
console.log(`Remote css: ${remoteCss}`);

if (missing.length) {
  console.log(missing.slice(0, 30).join('\n'));
  process.exitCode = 1;
}
