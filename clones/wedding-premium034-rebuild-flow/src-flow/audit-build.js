const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const htmlPath = path.join(ROOT, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const assetRefs = [...html.matchAll(/(?:src|href|poster)=["'](\.\/assets\/[^"']+)["']/g)].map((match) => match[1]);
const missing = assetRefs.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
const remoteScripts = [...html.matchAll(/<script[^>]+src=["']https?:\/\//gi)].length;
const remoteCss = [...html.matchAll(/<link[^>]+href=["']https?:\/\/[^"']+\.css/gi)].length;
const remoteIframeMatches = [...html.matchAll(/<iframe[^>]+src=["'](https?:\/\/[^"']+)["']/gi)];
const allowedRemoteIframes = remoteIframeMatches.filter((match) => /https?:\/\/maps\.google\.com\//i.test(match[1]));
const remoteIframes = remoteIframeMatches.length - allowedRemoteIframes.length;
const heavyServices = [...html.matchAll(/googletagmanager|google-analytics|speed\.cloudflare|cdn-cgi\/challenge-platform/gi)].length;

console.log(`Asset refs: ${assetRefs.length}`);
console.log(`Missing refs: ${missing.length}`);
console.log(`Remote scripts: ${remoteScripts}`);
console.log(`Remote css: ${remoteCss}`);
console.log(`Remote iframes: ${remoteIframes}`);
console.log(`Allowed maps iframes: ${allowedRemoteIframes.length}`);
console.log(`Heavy services: ${heavyServices}`);

if (missing.length) {
  console.log(missing.slice(0, 30).join('\n'));
  process.exitCode = 1;
}
if (remoteScripts || remoteCss || remoteIframes || heavyServices) {
  process.exitCode = 1;
}
