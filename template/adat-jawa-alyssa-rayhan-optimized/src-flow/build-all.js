const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://alyssarayhan.katsudoto.id/940751';
const ORIGIN = 'https://alyssarayhan.katsudoto.id';
const originalPath = path.join(ROOT, 'original.html');
const outPath = path.join(ROOT, 'index.html');
const assetsDir = path.join(ROOT, 'assets');

const skipHosts = new Set([
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'analytics.google.com',
]);

const externalKeepHosts = new Set([
  'www.instagram.com',
  'calendar.google.com',
  'maps.google.com',
  'www.google.com',
  'www.youtube.com',
  'youtu.be',
  'youtube.com',
  'www.w3.org',
  'w3.org',
]);

const contentTypeExt = [
  ['text/css', '.css'],
  ['javascript', '.js'],
  ['image/svg+xml', '.svg'],
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/x-icon', '.ico'],
  ['audio/mpeg', '.mp3'],
  ['audio/mp3', '.mp3'],
  ['font/woff2', '.woff2'],
  ['font/woff', '.woff'],
  ['video/mp4', '.mp4'],
];

function normalizeUrl(raw) {
  if (!raw) return null;
  let value = raw.trim().replaceAll('&amp;', '&');
  value = value.replaceAll('\\/', '/');
  if (
    !value ||
    value.startsWith('#') ||
    value.startsWith('data:') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('javascript:')
  ) {
    return null;
  }
  try {
    if (value.startsWith('//')) return new URL(`https:${value}`).toString();
    if (value.startsWith('/')) return new URL(value, ORIGIN).toString();
    if (/^https?:\/\//i.test(value)) {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      if (parsed.hostname === 'alyssarayhan.katsudoto.id' && (parsed.pathname === '/' || parsed.pathname === '/940751')) {
        return null;
      }
      if (parsed.hostname === 'www.w3.org' || parsed.hostname === 'w3.org') return null;
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
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
  if (lower.includes('font') || lower.includes('.woff')) return 'fonts';
  if (lower.includes('audio') || lower.includes('.mp3')) return 'audio';
  if (lower.includes('video') || lower.includes('.mp4')) return 'video';
  if (lower.includes('.css') || contentType.includes('text/css')) return 'css';
  if (lower.includes('.js') || contentType.includes('javascript')) return 'js';
  if (contentType.includes('image/') || /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(lower)) {
    if (lower.includes('/orn') || lower.includes('template/exclusive/alsa')) return 'ornaments';
    return 'images';
  }
  return 'vendor';
}

function slugName(url, contentType = '') {
  const parsed = new URL(url);
  const ext = extFrom(url, contentType);
  const rawBase = path.basename(parsed.pathname).replace(/\.[a-z0-9]+$/i, '') || parsed.hostname;
  const cleaned = rawBase
    .replace(/^thumb-(?:sm|md|lg)-/i, '')
    .replace(/-\d{8,}-[a-f0-9]{8,}$/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 72) || 'asset';
  const queryHash = parsed.search ? `-${Buffer.from(parsed.search).toString('hex').slice(0, 8)}` : '';
  return `${cleaned}${queryHash}${ext}`;
}

function collectUrls(text) {
  const found = new Set();
  const patterns = [
    /\b(?:src|href|poster|content)=["']([^"']+)["']/gi,
    /url\((["']?)([^"')]+)\1\)/gi,
    /https?:\\?\/\\?\/[^"' <>)]+/gi,
    /["'](\/(?:src|plugin|media|cf-fonts|assets|cdn-cgi)\/[^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const candidate = match[2] || match[1] || match[0];
      const url = normalizeUrl(candidate);
      if (!url) continue;
      const host = new URL(url).hostname;
      if (skipHosts.has(host) || externalKeepHosts.has(host)) continue;
      found.add(url);
    }
  }
  return found;
}

async function download(url, index, map) {
  if (map.has(url)) return;
  const parsed = new URL(url);
  if (skipHosts.has(parsed.hostname) || externalKeepHosts.has(parsed.hostname)) return;
  if (parsed.pathname === '/' || parsed.pathname === '/940751') return;
  if (parsed.hostname === 'fontawesome.com') return;

  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        referer: ORIGIN,
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const contentType = res.headers.get('content-type') || '';
    const buffer = Buffer.from(await res.arrayBuffer());
    const folder = folderFor(url, contentType);
    const base = slugName(url, contentType);
    const rel = `assets/${folder}/${String(index).padStart(3, '0')}-${base}`;
    const abs = path.join(ROOT, rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, buffer);
    map.set(url, `./${rel.replaceAll(path.sep, '/')}`);
    if (contentType.includes('text/css') || /\.css(?:$|\?)/i.test(url)) {
      let css = buffer.toString('utf8');
      for (const nested of collectUrls(css)) {
        if (!map.has(nested)) {
          await download(nested, map.size + 1, map);
        }
      }
    }
  } catch (error) {
    console.warn(`skip ${url}: ${error.message}`);
  }
}

function stripRemoteServices(html) {
  return html
    .replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/gi, '')
    .replace(/<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/gi, '')
    .replace(/<script>\(function\(\)\{function c\(\)[\s\S]*?<\/script><\/body>/i, '</body>')
    .replace(/<script[^>]+googletagmanager[^>]*><\/script>/gi, '')
    .replace(/<script[^>]+cdn-cgi\/challenge-platform[^>]*><\/script>/gi, '')
    .replace(/<script[^>]+tsparticles[^>]*><\/script>/gi, '<!-- tsparticles disabled for local lightweight preview -->')
    .replace(/<script[^>]+zencdn\.net\/8\.16\.1\/video\.min\.js[^>]*><\/script>/gi, '<!-- video.js remote disabled -->')
    .replace(/<script[^>]+videojs-youtube[^>]*><\/script>/gi, '<!-- youtube plugin remote disabled -->')
    .replace(/(<body[^>]*>)\s*<\/body>/i, '$1');
}

function replaceAllUrls(html, map) {
  let output = html;
  const entries = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [remote, local] of entries) {
    const escapedRemote = remote.replaceAll('/', '\\/');
    output = output.split(remote).join(local);
    output = output.split(escapedRemote).join(local.replaceAll('/', '\\/'));
    const parsed = new URL(remote);
    if (parsed.origin === ORIGIN) {
      const localRef = parsed.pathname + parsed.search;
      if (localRef !== '/' && localRef !== '/940751') {
        output = output.split(`"${localRef}`).join(`"${local}`);
        output = output.split(`'${localRef}`).join(`'${local}`);
        output = output.split(`(${localRef}`).join(`(${local}`);
        output = output.split(`\\"${localRef}`).join(`\\"${local}`);
        output = output.split(`\\'${localRef}`).join(`\\'${local}`);
      }
    }
  }
  output = output
    .replace(/https:\/\/www\.googletagmanager\.com[^"') <]+/g, '#')
    .replace(/https:\/\/www\.google-analytics\.com[^"') <]+/g, '#');
  return output;
}

function localForFile(local, fileRel) {
  const targetRel = local.replace(/^\.\//, '');
  const fromDir = path.posix.dirname(fileRel.replaceAll(path.sep, '/'));
  let rel = path.posix.relative(fromDir, targetRel);
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel;
}

function replaceUrlsForFile(text, map, fileRel) {
  let output = text;
  const entries = [...map.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [remote, local] of entries) {
    const fileLocal = localForFile(local, fileRel);
    const escapedRemote = remote.replaceAll('/', '\\/');
    output = output.split(remote).join(fileLocal);
    output = output.split(escapedRemote).join(fileLocal.replaceAll('/', '\\/'));
    const parsed = new URL(remote);
    if (parsed.origin === ORIGIN) {
      const localRef = parsed.pathname + parsed.search;
      if (localRef !== '/' && localRef !== '/940751') {
        output = output.split(`"${localRef}`).join(`"${fileLocal}`);
        output = output.split(`'${localRef}`).join(`'${fileLocal}`);
        output = output.split(`(${localRef}`).join(`(${fileLocal}`);
      }
    }
  }
  return output;
}

async function rewriteDownloadedTextAssets(map) {
  for (const local of map.values()) {
    if (!/\.(css|js)$/i.test(local)) continue;
    const rel = local.replace(/^\.\//, '');
    const abs = path.join(ROOT, rel);
    let text;
    try {
      text = await fs.readFile(abs, 'utf8');
    } catch {
      continue;
    }
    await fs.writeFile(abs, replaceUrlsForFile(text, map, rel));
  }
}

async function applyLocalRuntimePatches() {
  const cssGlobal = path.join(ROOT, 'assets/css/015-global-3f313737.css');
  try {
    let css = await fs.readFile(cssGlobal, 'utf8');
    css = css.replace(/url\('https:\/\/katsudoto\.id\/media\/template\/icon\/[^']+'\)/g, 'none');
    await fs.writeFile(cssGlobal, css);
  } catch {}

  const phosphor = path.join(ROOT, 'assets/js/012-web.js');
  try {
    await fs.writeFile(phosphor, `window.PhosphorIcons = window.PhosphorIcons || {};`);
  } catch {}

  const jsFiles = await fs.readdir(path.join(ROOT, 'assets/js')).catch(() => []);
  for (const file of jsFiles) {
    if (!file.endsWith('.js')) continue;
    const abs = path.join(ROOT, 'assets/js', file);
    let text = await fs.readFile(abs, 'utf8');
    text = text
      .replace(/https:\/\/speed\.cloudflare\.com\/__down\?bytes=100000/g, 'about:blank')
      .replace(/https:\/\/www\.google\.com\/generate_204/g, 'about:blank')
      .replace(/https:\/\/katsudoto\.id\/html2canvasproxy\.php/g, '')
      .replace(/https:\/\/katsudoto\.id\/media\/assets\/dashboard\/fall-effect/g, './assets/ornaments')
      .replace(/https:\/\/katsudoto\.id\/media\/kat\/Indonesia-flag\.png/g, '')
      .replace(/https:\/\/katsudoto\.id\/media\/kat\/English-flag\.png/g, '');
    await fs.writeFile(abs, text);
  }
}

function patchHtmlForLocalMode(html) {
  return html
    .replace(/<!-- Loading Page -->[\s\S]*?<script type="text\/javascript" src="\.\/assets\/js\/003-loading-page-1762337592\.js"><\/script>\s*/g, '')
    .replace(/\s*<!-- FOOTER -->\s*<section class=" footer" data-section-footer>[\s\S]*?<\/section>\s*(?=\s*<\/section>\s*<\/section>\s*<!-- MUSIC -->)/g, '\n')
    .replace(/\s*<div class="couple-link-wrap"[\s\S]*?@katsudoto[\s\S]*?<\/div>/gi, '')
    .replace(/\s*<p[^>]*>\s*Hai&nbsp;Katsudoto\s*<\/p>/g, '')
    .replace(/Alyssa &amp; Rayhan \| Katsudoto/g, 'Alyssa &amp; Rayhan')
    .replace(/Alyssa &amp; Rayhan - Katsudoto\.id/g, 'Alyssa &amp; Rayhan')
    .replace(/Katsudoto\.id/g, 'Link Undangan')
    .replace(/Katsudoto/g, 'Tamu Undangan')
    .replace(/\.\\\/assets\\\/audio\\\/241-teman-hidup-tulus-saxophone-cover-by-arie-suaka\.mp3/g, '.\\/assets\\/audio\\/gending.mp3')
    .replace(/\.\/assets\/audio\/241-teman-hidup-tulus-saxophone-cover-by-arie-suaka\.mp3/g, './assets/audio/gending.mp3')
    .replace(/content="https:\/\/alyssarayhan\.katsudoto\.id"/g, 'content="./"')
    .replace(/data-url="https:\/\/www\.youtube\.com\/watch\?[^"]+"/g, 'data-url="" data-local-disabled="youtube"')
    .replace(/href="https:\/\/www\.youtube\.com\/watch\?[^"]+"/g, 'href="#" data-local-disabled="youtube"')
    .replace(/href="https:\/\/www\.instagram\.com\/[^"]+"/g, 'href="#" data-local-disabled="instagram"')
    .replace(/href="https:\/\/www\.google\.com\/calendar\/render[^"]+"/g, 'href="#" data-local-disabled="calendar"')
    .replace(/href="https:\/\/maps\.google\.com\/[^"]+"/g, 'href="#" data-local-disabled="maps"')
    .replace(/href="\s*https:\/\/katsudoto\.id"/g, 'href="#" data-local-disabled="brand-link"');
}

function optimizeHtmlForFastPreview(html) {
  const poster = './assets/images/opening-poster-fast.jpg';
  let output = html
    .replace(/\.\\?\/assets\\?\/images\\?\/049-gif-890941\.gif/g, poster)
    .replace(/font-display:block/g, 'font-display:swap')
    .replace(/<script type="text\/javascript" src="\.\/assets\/js\/132-html2canvas-1-4-1-1749130377\.js"><\/script>/g, '<!-- html2canvas deferred for faster first load -->');

  if (!output.includes('href="./assets/images/opening-poster-fast.jpg"')) {
    output = output.replace(
      '</title>',
      '</title>\n<link rel="preload" as="image" href="./assets/images/opening-poster-fast.jpg" fetchpriority="high">',
    );
  }

  const nonCriticalCss = [
    './assets/css/005-selectize-default.css',
    './assets/css/006-flexbin.css',
    './assets/css/008-lightgallery.css',
    './assets/css/010-slick.css',
    './assets/video/011-modal-video-min.css',
    './assets/video/013-video-js.css',
    './assets/css/016-kado-template-1759120915.css',
    './assets/css/017-rundown-template-1762934182.css',
    './assets/css/018-note-template-1756182997.css',
    './assets/css/019-bank-template-1759120915.css',
    './assets/css/021-swiper-bundle-min.css',
  ];

  for (const href of nonCriticalCss) {
    const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    output = output.replace(new RegExp(`<link\\b(?=[^>]*href=["']${escapedHref}["'])[^>]*>`, 'g'), (tag) => {
      const cleaned = tag.replace(/\smedia=["'][^"']*["']/i, '').replace(/\sonload=["'][^"']*["']/i, '');
      return cleaned.replace(/\s*\/?>$/, " media=\"print\" onload=\"this.media='all'\">");
    });
  }

  const quoteIndex = output.indexOf('<!-- Quote -->');
  output = output.replace(/<img\b([^>]*?)>/g, (tag, attrs, offset) => {
    let next = tag;
    const isPoster = next.includes('opening-poster-fast.jpg');

    if (!/\sdecoding=/.test(next)) next = next.replace(/>$/, ' decoding="async">');
    if (!/\sloading=/.test(next)) {
      next = next.replace(/>$/, isPoster ? ' loading="eager">' : ' loading="lazy">');
    }
    if (isPoster && !/\sfetchpriority=/.test(next)) {
      next = next.replace(/>$/, ' fetchpriority="high">');
    } else if (!/\sfetchpriority=/.test(next)) {
      next = next.replace(/>$/, ' fetchpriority="low">');
    }
    return next;
  });

  output = output
    .replace(/src=\\"\.\/assets\/images\/opening-poster-fast\.jpg\\" alt=\\"\\" decoding="async" loading="lazy" fetchpriority="low"/g, 'src=\\"./assets/images/opening-poster-fast.jpg\\" alt=\\"\\" decoding=\\"async\\" loading=\\"eager\\" fetchpriority=\\"high\\"')
    .replace(/src=\\"\.\/assets\/images\/opening-poster-fast\.jpg\\" alt=\\"\\" decoding="async" loading="eager" fetchpriority="high"/g, 'src=\\"./assets/images/opening-poster-fast.jpg\\" alt=\\"\\" decoding=\\"async\\" loading=\\"eager\\" fetchpriority=\\"high\\"');

  return output;
}

async function main() {
  await fs.mkdir(assetsDir, { recursive: true });
  let html = await fs.readFile(originalPath, 'utf8');
  html = stripRemoteServices(html);
  const urls = [...collectUrls(html)];
  const map = new Map();

  let i = 1;
  for (const url of urls) {
    await download(url, i++, map);
  }

  await rewriteDownloadedTextAssets(map);
  await applyLocalRuntimePatches();
  html = replaceAllUrls(html, map);
  html = patchHtmlForLocalMode(html);
  html = optimizeHtmlForFastPreview(html);
  if (!html.includes('assets/js/local-stubs.js')) {
    html = html.replace(
      /(<script src="\.\/assets\/js\/(?:vendor-jquery|002-jquery)\.js"><\/script>)/,
      '$1\n<script src="./assets/js/local-stubs.js"></script>',
    );
  }
  html = html.replace(
    '</body>',
    '    <script src="./assets/js/auto-scroll-controls.js"></script>\n    <script src="./assets/js/local-overrides.js"></script>\n    <script src="./assets/js/deferred-vendors.js"></script>\n</body>',
  );
  await fs.mkdir(path.join(ROOT, 'assets/js'), { recursive: true });
  await fs.writeFile(
    path.join(ROOT, 'assets/js/local-stubs.js'),
    `(() => {
  window.KAT_LOCAL_MODE = true;
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = (input, options) => {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (/katsudoto\\.id|googletagmanager|google-analytics|speed\\.cloudflare|generate_204|youtubei|google\\.com\\/calendar|maps\\.google/i.test(url)) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
    }
    return nativeFetch ? nativeFetch(input, options) : Promise.reject(new Error('fetch unavailable'));
  };
  const noop = () => {};
  window.dataLayer = window.dataLayer || [];
  window.gtag = noop;
  window.fbq = noop;
  const particleInstance = {
    destroy: noop,
    pause: noop,
    play: noop,
    refresh: noop,
    start: noop,
    stop: noop,
  };
  window.tsParticles = window.tsParticles || {
    domItem: () => particleInstance,
    load: () => Promise.resolve(particleInstance),
    loadSlim: () => Promise.resolve(particleInstance),
    addPreset: () => Promise.resolve(particleInstance),
  };
  window.loadFull = window.loadFull || (() => Promise.resolve());
  window.OutMode = window.OutMode || { out: 'out' };
})();`
  );
  await fs.writeFile(
    path.join(ROOT, 'assets/js/local-overrides.js'),
    `(() => {
  window.KAT_LOCAL_MODE = true;
  const noop = () => {};
  window.dataLayer = window.dataLayer || [];
  window.gtag = noop;
  window.fbq = noop;

  const preventRemoteSubmit = (selector, message) => {
    document.querySelectorAll(selector).forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const note = document.createElement('div');
        note.className = 'kat-local-note';
        note.textContent = message;
        form.appendChild(note);
        setTimeout(() => note.remove(), 2600);
      });
    });
  };

  const openInvitation = () => {
    document.body.classList.add('invitation-opened', 'loaded', 'unlocked');
    document.querySelectorAll('.cover, .opening-cover, .kat-cover, .loader, .loading-page').forEach((el) => {
      el.classList.add('hide');
    });
    if (window.AOS && typeof window.AOS.refreshHard === 'function') {
      window.AOS.refreshHard();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-section-footer]').forEach((el) => el.remove());
    preventRemoteSubmit('form', 'Mode lokal: pengiriman data dimatikan.');
    document.querySelectorAll('a[href^="https://www.google.com"], a[href^="https://maps.google.com"]').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noreferrer');
    });
    document.querySelectorAll('[data-local-disabled]').forEach((el) => {
      el.addEventListener('click', (event) => event.preventDefault());
    });
    document.querySelectorAll('.open-invitation, .btn-open, [data-open-invitation], .cover-button, .open').forEach((button) => {
      button.addEventListener('click', openInvitation);
    });
    setTimeout(() => {
      if (window.AOS && typeof window.AOS.init === 'function') {
        window.AOS.init({ once: false, mirror: true });
      }
    }, 500);
  });
})();`
  );
  await fs.writeFile(outPath, html);
  await fs.writeFile(path.join(ROOT, 'asset-map.json'), JSON.stringify(Object.fromEntries(map), null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(`Localized ${map.size} assets`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
