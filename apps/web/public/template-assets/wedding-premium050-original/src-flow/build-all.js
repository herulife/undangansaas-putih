const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_URL = 'https://share.linkundangan.com/invcode/wedding-premium050?to=Tamu+Undangan';
const SOURCE_ORIGIN = 'https://share.linkundangan.com';
const ORIGINAL = path.join(ROOT, 'original.html');
const OUT = path.join(ROOT, 'index.html');
const ASSETS = path.join(ROOT, 'assets');

const skipHosts = new Set([
  'www.googletagmanager.com',
  'googletagmanager.com',
  'www.google-analytics.com',
  'google-analytics.com',
  'analytics.google.com',
  'connect.facebook.net',
  'static.hotjar.com',
  'script.hotjar.com',
  'speed.cloudflare.com',
]);

const disabledHosts = new Set([
  'calendar.google.com',
  'maps.google.com',
  'www.google.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'www.instagram.com',
  'instagram.com',
  'wa.me',
  'api.whatsapp.com',
]);

const contentTypeExt = [
  ['text/css', '.css'],
  ['javascript', '.js'],
  ['application/json', '.json'],
  ['image/svg+xml', '.svg'],
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/x-icon', '.ico'],
  ['audio/mpeg', '.mp3'],
  ['audio/mp3', '.mp3'],
  ['audio/wav', '.wav'],
  ['font/woff2', '.woff2'],
  ['font/woff', '.woff'],
  ['font/ttf', '.ttf'],
  ['font/otf', '.otf'],
  ['video/mp4', '.mp4'],
];

function toPosix(value) {
  return value.replaceAll(path.sep, '/');
}

function normalizeRaw(raw) {
  if (!raw) return '';
  return raw
    .trim()
    .replaceAll('&amp;', '&')
    .replaceAll('\\/', '/')
    .replace(/^["']|["']$/g, '')
    .replace(/[),;]+$/g, '');
}

function resolveUrl(raw, baseUrl) {
  const value = normalizeRaw(raw);
  if (
    !value ||
    value.startsWith('#') ||
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('javascript:')
  ) {
    return null;
  }

  try {
    if (value.startsWith('//')) return new URL(`https:${value}`).toString();
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function shouldSkip(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return true;
  if (skipHosts.has(parsed.hostname)) return true;
  if (disabledHosts.has(parsed.hostname)) return true;
  if (parsed.hostname === 'share.linkundangan.com' && /^\/inv-preview\//.test(parsed.pathname)) return true;
  if (parsed.hostname === 'share.linkundangan.com' && /^\/invcode\//.test(parsed.pathname) && parsed.pathname !== '/invcode/wedding-premium050') return true;
  if (/\/(comment|wished|reservation|attendance|guestbook|rsvp|counter|viewer|payment|invoice|login|register)(\/|\?|$)/i.test(parsed.pathname)) return true;
  return false;
}

function extFrom(url, contentType = '') {
  const pathname = new URL(url).pathname;
  const existing = path.extname(pathname).toLowerCase();
  if (existing && existing.length <= 8) return existing;
  const match = contentTypeExt.find(([type]) => contentType.includes(type));
  return match ? match[1] : '.bin';
}

function folderFor(url, contentType = '') {
  const lower = `${new URL(url).pathname} ${contentType}`.toLowerCase();
  if (lower.includes('font') || /\.(woff2?|ttf|otf|eot|svg#)/i.test(lower)) return 'fonts';
  if (lower.includes('audio') || /\.(mp3|m4a|wav|ogg)$/i.test(lower)) return 'audio';
  if (lower.includes('video') || /\.(mp4|webm)$/i.test(lower)) return 'video';
  if (lower.includes('.css') || contentType.includes('text/css')) return 'css';
  if (lower.includes('.js') || contentType.includes('javascript')) return 'js';
  if (contentType.includes('image/') || /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(lower)) {
    if (/\/(ornaments?|png|flower|leaf|daun|frame|cover|assets\/images)\//i.test(lower)) return 'ornaments';
    return 'images';
  }
  return 'vendor';
}

function slugName(url, contentType = '') {
  const parsed = new URL(url);
  const ext = extFrom(url, contentType);
  const basename = path.basename(parsed.pathname).replace(/\.[a-z0-9]+$/i, '') || parsed.hostname;
  const clean = basename
    .replace(/^thumb-(?:sm|md|lg)-/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 70) || 'asset';
  const query = parsed.search ? `-${Buffer.from(parsed.search).toString('hex').slice(0, 8)}` : '';
  return `${clean}${query}${ext}`;
}

function collectCandidates(text, baseUrl) {
  const candidates = [];
  const patterns = [
    /\b(?:src|href|poster|content|data-src|data-original|data-background|data-bg|data-url|action)=["']([^"']+)["']/gi,
    /url\(\s*(["']?)([^"')]+)\1\s*\)/gi,
    /@import\s+(?:url\()?["']?([^"')\s;]+)["']?\)?/gi,
    /https?:\\?\/\\?\/[^"' <>)\\]+/gi,
    /["'](\/(?:AdminLTE|Templates|BgroundBsound|css|js|images|fonts|icon|svg|files|libraries|PhotoSwipe|manifest\.json)[^"']*)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const raw = match[2] || match[1] || match[0];
      const url = resolveUrl(raw, baseUrl);
      if (!url || shouldSkip(url)) continue;
      candidates.push({ raw: normalizeRaw(raw), url });
    }
  }

  return candidates;
}

function isTextAsset(local) {
  return /\.(css|js|json|svg|txt|html)$/i.test(local);
}

function localForFile(local, fileRel) {
  const target = local.replace(/^\.\//, '');
  const fromDir = path.posix.dirname(toPosix(fileRel));
  let rel = path.posix.relative(fromDir, target);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function replaceEverywhere(text, from, to) {
  if (!from) return text;
  let output = text.split(from).join(to);
  const escapedFrom = from.replaceAll('/', '\\/');
  const escapedTo = to.replaceAll('/', '\\/');
  output = output.split(escapedFrom).join(escapedTo);
  return output;
}

function rewriteText(text, baseUrl, fileRel, urlMap) {
  let output = text;

  for (const [remote, local] of [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length)) {
    output = replaceEverywhere(output, remote, localForFile(local, fileRel));
  }

  for (const { raw, url } of collectCandidates(text, baseUrl)) {
    const local = urlMap.get(url);
    if (!local) continue;
    output = replaceEverywhere(output, raw, localForFile(local, fileRel));
  }

  return output;
}

async function downloadAll(initialHtml) {
  const queue = collectCandidates(initialHtml, SOURCE_URL).map((item) => item.url);
  const seen = new Set();
  const urlMap = new Map();
  const sourceByRel = new Map();

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const url = queue[cursor];
    if (seen.has(url) || shouldSkip(url)) continue;
    seen.add(url);

    try {
      const response = await fetch(url, {
        headers: {
          accept: '*/*',
          referer: SOURCE_URL,
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('text/html') && !/\.(css|js|json|svg)$/i.test(new URL(url).pathname)) {
        console.warn(`skip html endpoint ${url}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length) continue;

      const folder = folderFor(url, contentType);
      const rel = `assets/${folder}/${String(urlMap.size + 1).padStart(3, '0')}-${slugName(url, contentType)}`;
      const abs = path.join(ROOT, rel);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, buffer);

      const local = `./${toPosix(rel)}`;
      urlMap.set(url, local);
      sourceByRel.set(toPosix(rel), url);

      if (isTextAsset(rel)) {
        const body = buffer.toString('utf8');
        for (const nested of collectCandidates(body, url)) {
          if (!seen.has(nested.url) && !shouldSkip(nested.url)) queue.push(nested.url);
        }
      }
    } catch (error) {
      console.warn(`skip ${url}: ${error.message}`);
    }
  }

  return { sourceByRel, urlMap };
}

async function rewriteDownloadedAssets(urlMap, sourceByRel) {
  for (const local of urlMap.values()) {
    const rel = local.replace(/^\.\//, '');
    if (!isTextAsset(rel)) continue;
    const abs = path.join(ROOT, rel);
    const sourceUrl = sourceByRel.get(rel) || SOURCE_URL;
    let text = await fs.readFile(abs, 'utf8');
    text = rewriteText(text, sourceUrl, rel, urlMap);
    text = patchRemoteRuntimeText(text);
    await fs.writeFile(abs, text);
  }
}

function patchRemoteRuntimeText(text) {
  return text
    .replace(/https:\/\/speed\.cloudflare\.com\/__down\?bytes=100000/g, 'about:blank')
    .replace(/https:\/\/www\.google\.com\/generate_204/g, 'about:blank')
    .replace(/https:\/\/share\.linkundangan\.com\/(comment|wished|reservation|attendance|guestbook|rsvp)[^"'`)]*/gi, './assets/js/local-empty.json')
    .replace(/https:\/\/www\.linkundangan\.com\/(comment|wished|reservation|attendance|guestbook|rsvp)[^"'`)]*/gi, './assets/js/local-empty.json');
}

function patchHtml(html) {
  return html
    .replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/gi, '')
    .replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/gi, '')
    .replace(/<script[^>]+googletagmanager[^>]*><\/script>/gi, '')
    .replace(/<script[^>]+google-analytics[^>]*><\/script>/gi, '')
    .replace(/<script[^>]+cdn-cgi\/challenge-platform[^>]*><\/script>/gi, '')
    .replace(/<iframe[^>]+(?:youtube|youtu\.be|instagram|facebook)[\s\S]*?<\/iframe>/gi, '<div class="local-disabled-embed">Embed eksternal dimatikan untuk mode lokal.</div>')
    .replace(/href=(["'])https:\/\/(?:www\.)?instagram\.com\/[^"']+\1/gi, 'href="#" data-local-disabled="instagram"')
    .replace(/href=(["'])https:\/\/(?:www\.)?youtube\.com\/[^"']+\1/gi, 'href="#" data-local-disabled="youtube"')
    .replace(/href=(["'])https:\/\/(?:www\.)?google\.com\/calendar[^"']+\1/gi, 'href="#" data-local-disabled="calendar"')
    .replace(/href=(["'])https:\/\/calendar\.google\.com\/[^"']+\1/gi, 'href="#" data-local-disabled="calendar"')
    .replace(/var dirSticker = ['"][^'"]+['"];/, "var dirSticker = './assets/images/';")
    .replace(/new Audio\(`https:\/\/cdn\.freesound\.org\/previews\/469\/469009_9518146-lq\.mp3`\)/g, "new Audio('./assets/audio/background-music.mp3')")
    .replace(/const linkGuestBook = ["'][^"']+["'];/, 'const linkGuestBook = "#";')
    .replace(/const linkReservation = ["'][^"']+["'];/, 'const linkReservation = "#";')
    .replace(/https:\/\/share\.linkundangan\.com\/invcode\/wedding-premium050/gi, './')
    .replace(/<head>/i, '<head>\n<script src="./assets/js/local-stubs.js"></script>')
    .replace(/<\/body>/i, '    <script src="./assets/js/local-overrides.js"></script>\n</body>');
}

async function copyFallbackAssets() {
  const fallbackAudio = path.resolve(ROOT, '..', '..', 'template', '074', 'assets', 'audio', 'background-music.mp3');
  const targetAudio = path.join(ASSETS, 'audio', 'background-music.mp3');
  try {
    await fs.mkdir(path.dirname(targetAudio), { recursive: true });
    await fs.copyFile(fallbackAudio, targetAudio);
  } catch {
    // Audio is optional for the local preview.
  }
}

async function writeLocalRuntime() {
  await fs.mkdir(path.join(ASSETS, 'js'), { recursive: true });
  await fs.writeFile(
    path.join(ASSETS, 'js', 'local-empty.json'),
    JSON.stringify({ status: 'success', data: [], contents: [], summary: [], message: 'Local mode' }, null, 2),
  );
  await fs.writeFile(
    path.join(ASSETS, 'js', 'local-stubs.js'),
    `(() => {
  window.LINKUNDANGAN_LOCAL_MODE = true;
  const localJson = { status: 'success', data: [], contents: [], summary: [], message: 'Mode lokal' };
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = (input, options) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/googletagmanager|google-analytics|speed\\.cloudflare|generate_204|share\\.linkundangan\\.com|www\\.linkundangan\\.com/i.test(url) && !/\\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|m4a|wav|mp4)(\\?|$)/i.test(url)) {
      return Promise.resolve(new Response(JSON.stringify(localJson), { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return nativeFetch ? nativeFetch(input, options) : Promise.reject(new Error('fetch unavailable'));
  };
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    const textUrl = String(url || '');
    if (/share\\.linkundangan\\.com|www\\.linkundangan\\.com/i.test(textUrl) && !/\\.(css|js|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|m4a|wav|mp4)(\\?|$)/i.test(textUrl)) {
      return nativeOpen.call(this, 'GET', './assets/js/local-empty.json', ...rest);
    }
    return nativeOpen.call(this, method, url, ...rest);
  };
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() {};
  window.fbq = window.fbq || function() {};
})();`,
  );
  await fs.writeFile(
    path.join(ASSETS, 'js', 'local-overrides.js'),
    `(() => {
  const showLocalNote = (form) => {
    const note = document.createElement('div');
    note.className = 'local-mode-note';
    note.textContent = 'Mode lokal: pengiriman data dimatikan.';
    form.appendChild(note);
    setTimeout(() => note.remove(), 2600);
  };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        showLocalNote(form);
      });
    });
    document.querySelectorAll('[data-local-disabled]').forEach((node) => {
      node.addEventListener('click', (event) => event.preventDefault());
    });
    if (window.AOS && typeof window.AOS.init === 'function') {
      window.AOS.init({ once: false, mirror: true });
    }
  });
})();`,
  );
  await fs.mkdir(path.join(ASSETS, 'css'), { recursive: true });
  await fs.writeFile(
    path.join(ASSETS, 'css', 'local-overrides.css'),
    `.local-disabled-embed,.local-mode-note{border:1px solid rgba(130,91,42,.25);border-radius:10px;background:rgba(255,255,255,.7);color:#725735;font:600 13px/1.5 system-ui,sans-serif;padding:12px;text-align:center}.local-mode-note{margin-top:10px}`,
  );
  await copyFallbackAssets();
}

async function main() {
  await fs.mkdir(ASSETS, { recursive: true });
  let html = await fs.readFile(ORIGINAL, 'utf8');
  const { sourceByRel, urlMap } = await downloadAll(html);
  await writeLocalRuntime();
  await rewriteDownloadedAssets(urlMap, sourceByRel);
  html = rewriteText(html, SOURCE_URL, 'index.html', urlMap);
  html = patchHtml(html);
  html = html.replace('</head>', '<link rel="stylesheet" href="./assets/css/local-overrides.css">\n</head>');
  await fs.writeFile(OUT, html);
  await fs.writeFile(path.join(ROOT, 'asset-map.json'), JSON.stringify(Object.fromEntries(urlMap), null, 2));
  console.log(`Wrote ${OUT}`);
  console.log(`Localized ${urlMap.size} assets`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
