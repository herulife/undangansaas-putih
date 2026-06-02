const fs = require('fs/promises');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const explicitNames = new Map([
  ['audio/241-teman-hidup-tulus-saxophone-cover-by-arie-suaka.mp3', null],
  ['audio/gending-jawa-soft-wedding-loop.wav', null],
  ['audio/campursari-ngebit-wedding-loop.wav', 'audio/campursari-ngebit-wedding-loop.wav'],

  ['css/004-css2-3f66616d.css', 'css/font-roboto-display-block.css'],
  ['css/005-selectize-default.css', 'css/vendor-selectize.css'],
  ['css/006-flexbin.css', 'css/vendor-flexbin.css'],
  ['css/007-aos.css', 'css/vendor-aos.css'],
  ['css/008-lightgallery.css', 'css/vendor-lightgallery.css'],
  ['css/010-slick.css', 'css/vendor-slick.css'],
  ['css/014-universal-3f313737.css', 'css/katsudoto-universal.css'],
  ['css/015-global-3f313737.css', 'css/katsudoto-global.css'],
  ['css/016-kado-template-1759120915.css', 'css/gift-template.css'],
  ['css/017-rundown-template-1762934182.css', 'css/rundown-template.css'],
  ['css/018-note-template-1756182997.css', 'css/note-template.css'],
  ['css/019-bank-template-1759120915.css', 'css/bank-template.css'],
  ['css/020-css2-3f66616d.css', 'css/font-cormorant-ovo.css'],
  ['css/021-swiper-bundle-min.css', 'css/vendor-swiper.css'],
  ['css/022-exclusive-alsa-3f313737.css', 'css/template-alsa.css'],
  ['css/027-css2-3f66616d.css', 'css/font-roboto-display-swap.css'],
  ['css/028-css2-3f66616d.css', 'css/font-montserrat-display-swap.css'],
  ['css/085-css2-3f66616d.css', 'css/font-montserrat-extra.css'],
  ['css/126-css2-3f66616d.css', 'css/font-imperial-script.css'],

  ['js/002-jquery.js', 'js/vendor-jquery.js'],
  ['js/012-web.js', 'js/phosphor-icons-stub.js'],
  ['js/127-aos.js', 'js/vendor-aos.js'],
  ['js/128-slick-min.js', 'js/vendor-slick.js'],
  ['js/129-selectize-min.js', 'js/vendor-selectize.js'],
  ['js/131-lightgallery-min.js', 'js/vendor-lightgallery.js'],
  ['js/132-html2canvas-1-4-1-1749130377.js', 'js/vendor-html2canvas.js'],
  ['js/133-universal-3f313737.js', 'js/katsudoto-universal.js'],
  ['js/134-template-3f313737.js', 'js/template-core.js'],
  ['js/135-exclusive-alsa-3f313737.js', 'js/template-alsa.js'],
  ['js/local-overrides.js', 'js/local-overrides.js'],
  ['js/local-stubs.js', 'js/local-stubs.js'],

  ['video/011-modal-video-min.css', 'video/vendor-modal-video.css'],
  ['video/013-video-js.css', 'video/vendor-video-js.css'],
  ['video/130-jquery-modal-video-min.js', 'video/vendor-modal-video.js'],

  ['images/001-890975-1200-630.jpg', 'images/thumbnail-alyssa-rayhan.jpg'],
  ['images/049-gif-890941.gif', 'images/couple-opening-animation.gif'],
  ['images/053-bg-wa-box-fix.jpg', 'images/background-whatsapp-box.jpg'],
  ['images/084-hqdefault-3f6e6f63.jpg', 'images/video-thumbnail-youtube.jpg'],
  ['images/102-ic-dress-man-formal.png', 'images/icon-dress-code-man.png'],
  ['images/103-ic-dress-woman-formal.png', 'images/icon-dress-code-woman.png'],
  ['images/105-maxresdefault-3f6e6f63.jpg', 'images/video-cover-youtube.jpg'],
  ['images/106-bg-cover.png', 'images/background-cover-desktop.png'],
  ['images/107-bg-cover-mobile.png', 'images/background-cover-mobile.png'],
  ['images/108-bg-countdown.png', 'images/background-countdown.png'],
  ['images/109-bg-groom.png', 'images/background-groom.png'],
  ['images/110-bg-bride.png', 'images/background-bride.png'],
  ['images/111-palace.png', 'images/illustration-palace.png'],
  ['images/112-music.png', 'images/icon-music-disc.png'],
  ['images/118-cloud-upload.png', 'images/icon-cloud-upload.png'],
  ['images/240-892541-400-400.png', 'images/logo-alyssa-rayhan.png'],

  ['ornaments/050-frame-cover.png', 'ornaments/frame-cover.png'],
  ['ornaments/051-frame-quote.png', 'ornaments/frame-quote.png'],
  ['ornaments/057-frame-couple.png', 'ornaments/frame-couple.png'],
  ['ornaments/088-frame-sd.png', 'ornaments/frame-save-date.png'],
  ['ornaments/103-orn-cover-desktop.png', 'ornaments/ornament-cover-desktop.png'],
  ['ornaments/104-orn-cover-tablet.png', 'ornaments/ornament-cover-tablet.png'],
  ['ornaments/105-orn-cover-mobile.png', 'ornaments/ornament-cover-mobile.png'],
  ['ornaments/236-texture-1.png', 'ornaments/background-texture.png'],
  ['ornaments/237-mask-cover.png', 'ornaments/mask-cover.png'],
  ['ornaments/238-orn-62.png', 'ornaments/ornament-62.png'],
  ['ornaments/239-bg-pp.png', 'ornaments/background-primary-pane.png'],
]);

function toPosix(rel) {
  return rel.replaceAll(path.sep, '/');
}

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(abs));
    else files.push(abs);
  }
  return files;
}

function stripNumberPrefix(name) {
  return name.replace(/^\d{3}-/, '');
}

function uniqueName(folder, desired, used) {
  const parsed = path.posix.parse(desired);
  let candidate = `${folder}/${desired}`;
  let i = 2;
  while (used.has(candidate)) {
    candidate = `${folder}/${parsed.name}-${i}${parsed.ext}`;
    i += 1;
  }
  used.add(candidate);
  return candidate;
}

function readableName(rel, counters, used) {
  if (explicitNames.has(rel)) return explicitNames.get(rel);

  const folder = rel.split('/')[0];
  const file = rel.split('/').slice(1).join('/');
  const ext = path.posix.extname(file);
  let base = stripNumberPrefix(path.posix.basename(file, ext))
    .replace(/-[a-f0-9]{8,}$/i, '')
    .replace(/-\d{8,}$/i, '')
    .toLowerCase();

  if (folder === 'ornaments') {
    base = base.replace(/^orn-/, 'ornament-');
    return uniqueName(folder, `${base}${ext}`, used);
  }

  if (folder === 'images') {
    if (/^ahr0chm6/i.test(base)) {
      counters.photo += 1;
      return uniqueName(folder, `photo-gallery-${String(counters.photo).padStart(2, '0')}${ext}`, used);
    }
    return uniqueName(folder, `${base}${ext}`, used);
  }

  if (folder === 'fonts') {
    if (/^(kfok|kfom)/.test(base)) {
      counters.roboto += 1;
      return uniqueName(folder, `font-roboto-google-${String(counters.roboto).padStart(2, '0')}${ext}`, used);
    }
    if (/^(jtuf|jtuh)/.test(base)) {
      counters.montserratGoogle += 1;
      return uniqueName(folder, `font-montserrat-google-${String(counters.montserratGoogle).padStart(2, '0')}${ext}`, used);
    }
    if (/^5dcp/.test(base)) {
      return uniqueName(folder, `font-imperial-script${ext}`, used);
    }
    return uniqueName(folder, `${base}${ext}`, used);
  }

  return uniqueName(folder, `${base}${ext}`, used);
}

function isTextFile(file) {
  return /\.(html|css|js|json|md|txt|svg)$/i.test(file);
}

async function rewriteTextFiles(replacements) {
  const files = await listFiles(ROOT);
  for (const file of files) {
    if (file.includes(`${path.sep}original.html`)) continue;
    if (!isTextFile(file)) continue;
    let text = await fs.readFile(file, 'utf8');
    let changed = false;
    for (const [from, to] of replacements) {
      const escapedFrom = from.replaceAll('/', '\\/');
      const escapedTo = to.replaceAll('/', '\\/');
      if (text.includes(from)) {
        text = text.split(from).join(to);
        changed = true;
      }
      if (text.includes(escapedFrom)) {
        text = text.split(escapedFrom).join(escapedTo);
        changed = true;
      }
    }
    if (changed) await fs.writeFile(file, text);
  }
}

async function main() {
  const files = await listFiles(ASSETS);
  const used = new Set();
  const counters = { photo: 0, roboto: 0, montserratGoogle: 0 };
  const moves = [];
  const replacements = [];

  for (const abs of files) {
    const rel = toPosix(path.relative(ASSETS, abs));
    const target = readableName(rel, counters, used);
    const oldRef = `./assets/${rel}`;
    if (target === null) {
      await fs.rm(abs, { force: true });
      replacements.push([oldRef, '']);
      continue;
    }
    const newRef = `./assets/${target}`;
    replacements.push([oldRef, newRef]);
    if (rel !== target) moves.push([abs, path.join(ASSETS, ...target.split('/'))]);
  }

  for (const [, target] of moves) {
    await fs.mkdir(path.dirname(target), { recursive: true });
  }
  for (const [from, to] of moves) {
    await fs.rename(from, to);
  }

  await rewriteTextFiles(replacements);

  console.log(`Renamed ${moves.length} assets`);
  console.log(`Removed ${replacements.filter(([, to]) => to === '').length} unused assets`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
