import { readFile, writeFile } from "node:fs/promises";

const source = await readFile(new URL("../original.html", import.meta.url), "utf8");

let html = source;

// Drop all legacy runtime scripts. The visual HTML and CSS stay intact; only
// interaction code is replaced by assets/js/clean-runtime.js.
html = html.replace(/<script\b[\s\S]*?<\/script>\s*/gi, "");
html = html.replace(/<link\s+rel=["']manifest["'][^>]*>\s*/gi, "");
html = html.replace(/<link[^>]+assets\/css\/014-zoomslider\.css[^>]*>\s*/gi, "");
html = html.replace(/<link[^>]+assets\/css\/016-photoswipe-3f763d32\.css[^>]*>\s*/gi, "");
html = html.replace(/<link[^>]+assets\/css\/017-default-skin-3f763d32\.css[^>]*>\s*/gi, "");
html = html.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "");
html = html.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "");

html = html.replace(
  /<div class="modal fade" id="coverModal"/,
  '<div class="modal fade show" id="coverModal"',
);
html = html.replace(
  /(<div class="modal fade show" id="coverModal"[^>]*?)aria-hidden="true"/,
  '$1aria-hidden="false"',
);

html = html.replace(
  /<\/head>/i,
  [
    '  <link rel="stylesheet" href="./assets/css/clean-runtime.css">',
    "  <style>",
    "    #loadingpage{display:none!important}",
    "    body.clean-ready #coverModal{display:block!important}",
    "    body.clean-open #coverModal{display:none!important}",
    "  </style>",
    "</head>",
  ].join("\n"),
);

html = html.replace(
  /<\/body>/i,
  '  <script src="./assets/js/clean-runtime.js" defer></script>\n</body>',
);

await writeFile(new URL("../index.html", import.meta.url), html, "utf8");
