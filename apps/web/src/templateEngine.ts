export type TemplateCategory = 'wedding' | 'khitan' | 'aqiqah' | 'general'

export type TemplateRegistryItem = {
  id: string
  code: string
  name: string
  category: TemplateCategory
  plan: 'free' | 'premium'
  publicPath: string
  sourcePath: string
  thumbnail: string
  notes: string
}

export type InvitationRenderData = {
  slug: string
  title: string
  eventType: string
  invitationNoun: string
  hostLabel: string
  groomName: string
  brideName: string
  coupleDisplayName: string
  childName: string
  parentsName: string
  hostName: string
  organizationName: string
  eventName: string
  eventDay: string
  eventDateText: string
  eventDateISO: string
  akadTime: string
  receptionTime: string
  venueName: string
  venueAddress: string
  openingGreeting: string
  openingText: string
  closingText: string
  backsoundUrl: string
  guestName?: string
  countdownTarget?: string
}

export const templateRegistry: TemplateRegistryItem[] = [
  {
    id: 'template-042',
    code: 'WEDDING-PREMIUM042',
    name: 'Premium 042 - Wayang Batik',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/wedding-premium042-wayang-batik',
    sourcePath: 'D:/UNDANGAN/template/wedding-premium042-wayang-batik',
    thumbnail: '/template-assets/wedding-premium042-wayang-batik/assets/images/background-cover-couple.jpg',
    notes: 'Template lokal bersih dengan asset rapi di folder assets.',
  },
  {
    id: 'template-074',
    code: 'WEDDING-PREMIUM074',
    name: 'Premium 074 - Indonesia Editorial',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/wedding-premium074-indonesia-editorial',
    sourcePath: 'D:/UNDANGAN/template/wedding-premium074-indonesia-editorial',
    thumbnail: '/template-assets/wedding-premium074-indonesia-editorial/assets/images/footages/indonesia-wedding-03.png',
    notes: 'Template hasil custom warna Indonesia dengan ornamen dan foto lokal.',
  },
  {
    id: 'template-adat-jawa',
    code: 'ADAT-JAWA',
    name: 'Adat Jawa - Alyssa Rayhan',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/adat-jawa-alyssa-rayhan-katsudoto',
    sourcePath: 'D:/UNDANGAN/template/adat-jawa-alyssa-rayhan-katsudoto',
    thumbnail: '/template-assets/adat-jawa-alyssa-rayhan-katsudoto/assets/images/thumbnail-alyssa-rayhan.jpg',
    notes: 'Template adat Jawa dengan asset, font, audio, ornamen, CSS, dan JS dilokalkan.',
  },
  {
    id: 'template-adat-jawa-lottie',
    code: 'ADAT-JAWA-KUPU',
    name: 'Adat Jawa Kupu - Alyssa Rayhan',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/adat-jawa-alyssa-rayhan-optimized',
    sourcePath: 'D:/UNDANGAN/template/adat-jawa-alyssa-rayhan-optimized',
    thumbnail: '/template-assets/adat-jawa-alyssa-rayhan-optimized/assets/images/thumbnail-alyssa-rayhan.jpg',
    notes: 'Varian adat Jawa cepat dengan poster ringan, lazy media, audio gending lokal, dan auto-scroll per section.',
  },
  {
    id: 'template-adat-sunda-050-style',
    code: 'ADAT-SUNDA-050',
    name: 'Adat Sunda - Gaya Premium 050',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/adat-sunda-050-style-adapted',
    sourcePath: 'D:/UNDANGAN/template/adat-sunda-050-style-adapted',
    thumbnail: '/template-assets/adat-sunda-050-style-adapted/assets/images/088-4-3f763d32.webp',
    notes: 'Varian adat Sunda berbasis visual 050 pixel-clean: struktur, frame, animasi, auto-scroll, audio, dan Maps dipertahankan dengan aset pasangan Sunda.',
  },
  {
    id: 'template-adat-sunda-050-pro',
    code: 'ADAT-SUNDA-050-PRO',
    name: 'Adat Sunda 050 Pro - Raras Danis',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/adat-sunda-050-pro-raras-danis',
    sourcePath: 'D:/UNDANGAN/template/adat-sunda-050-pro-raras-danis',
    thumbnail: '/template-assets/adat-sunda-050-pro-raras-danis/assets/images/hero-couple.webp',
    notes: 'Template adat Sunda baru dengan kode clean sendiri, ornamen 050, foto pengantin dan prewedding generated, animasi reveal, audio kacapi, auto-scroll, dan Google Maps aktif.',
  },
  {
    id: 'template-adat-jawa-050-klasik',
    code: 'ADAT-JAWA-050-KLASIK',
    name: 'Adat Jawa 050 Klasik - Alyssa Rayhan',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/adat-jawa-050-klasik-alyssa-rayhan',
    sourcePath: 'D:/UNDANGAN/template/adat-jawa-050-klasik-alyssa-rayhan',
    thumbnail: '/template-assets/adat-jawa-050-klasik-alyssa-rayhan/assets/images/hero-couple.webp',
    notes: 'Style-adapted variant dari DNA template 050 original: adat Jawa klasik, gebyok, melati, batik halus, foto pengantin Jawa, audio gending lokal, auto-scroll, tombol Top/Read/Musik, dan Google Maps aktif.',
  },
  {
    id: 'template-adat-minang-050-klasik',
    code: 'ADAT-MINANG-050-KLASIK',
    name: 'Minang 050 Klasik - Zahra Fadli',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/adat-minang-050-klasik-zahra-fadli',
    sourcePath: 'D:/UNDANGAN/template/adat-minang-050-klasik-zahra-fadli',
    thumbnail: '/template-assets/adat-minang-050-klasik-zahra-fadli/assets/images/hero-couple.webp',
    notes: 'Style-adapted variant dari DNA template 050 original: identitas Minang klasik, songket, suntiang, rumah gadang, merah marun-hitam-emas, motion-rich reveal, audio placeholder Minang, auto-scroll, tombol Top/Read/Musik, dan Google Maps aktif.',
  },
  {
    id: 'template-floral-elegant',
    code: 'WEDDING-FLORAL-050',
    name: 'Premium 050 - Floral Elegant',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/wedding-premium050-floral-elegant',
    sourcePath: '/home/ubuntu24/undangansaas/template/wedding-premium050-floral-elegant',
    thumbnail: '/template-assets/wedding-premium050-floral-elegant/assets/images/002-4.webp',
    notes: 'Template wedding floral elegant dengan warna pink dan ornamen bunga.',
  },
  {
    id: 'template-pixel-clean',
    code: 'WEDDING-PREMIUM050',
    name: 'Premium 050 - Pixel Clean',
    category: 'wedding',
    plan: 'premium',
    publicPath: '/template-assets/wedding-premium050-pixel-clean',
    sourcePath: 'D:/UNDANGAN/template/wedding-premium050-pixel-clean',
    thumbnail: '/template-assets/wedding-premium050-pixel-clean/assets/images/002-4.webp',
    notes: 'Template wedding premium 050 pixel clean, dasar visual untuk varian adat.',
  },
]

type TemplateTokens = {
  coupleDemo: string
  groomDemo: string
  brideDemo: string
  dateDemo?: string
  venueDemo?: string
}

const templateTokens: Record<string, TemplateTokens> = {
  'template-042': {
    coupleDemo: 'Hamzah & Anissa',
    groomDemo: 'Hamzah',
    brideDemo: 'Anissa',
    dateDemo: '31 Mei 2026',
    venueDemo: 'Masjid agung bogor',
  },
  'template-074': {
    coupleDemo: 'Alika & Herman',
    groomDemo: 'Herman',
    brideDemo: 'Alika',
    dateDemo: '31 Mei 2026',
    venueDemo: 'Masjid agung bogor',
  },
  'template-adat-jawa': {
    coupleDemo: 'Alyssa & Rayhan',
    groomDemo: 'Rayhan',
    brideDemo: 'Alyssa',
    venueDemo: 'Gedung Juang',
  },
  'template-adat-jawa-lottie': {
    coupleDemo: 'Alyssa & Rayhan',
    groomDemo: 'Rayhan',
    brideDemo: 'Alyssa',
    venueDemo: 'Gedung Juang',
  },
  'template-adat-jawa-050-klasik': {
    coupleDemo: 'Alyssa & Rayhan',
    groomDemo: 'Rayhan',
    brideDemo: 'Alyssa',
    dateDemo: '6 Juni 2026',
    venueDemo: 'Gedung Juang',
  },
  'template-adat-sunda-050-style': {
    coupleDemo: 'Raras & Danis',
    groomDemo: 'Danis',
    brideDemo: 'Raras',
    dateDemo: '16 Agustus 2026',
    venueDemo: 'Gedung Pusdai Jawa Barat',
  },
  'template-adat-sunda-050-pro': {
    coupleDemo: 'Raras & Danis',
    groomDemo: 'Danis',
    brideDemo: 'Raras',
    dateDemo: '16 Agustus 2026',
    venueDemo: 'Gedung Pusdai Jawa Barat',
  },
  'template-adat-minang-050-klasik': {
    coupleDemo: 'Zahra & Fadli',
    groomDemo: 'Fadli',
    brideDemo: 'Zahra',
    dateDemo: '20 Juni 2026',
    venueDemo: 'Masjid Raya Sumatera Barat',
  },
  'template-floral-elegant': {
    coupleDemo: 'Hamzah & Anissa',
    groomDemo: 'Hamzah',
    brideDemo: 'Anissa',
    dateDemo: '31 Mei 2026',
    venueDemo: 'Masjid agung bogor',
  },
  'template-pixel-clean': {
    coupleDemo: 'Hamzah & Anissa',
    groomDemo: 'Hamzah',
    brideDemo: 'Anissa',
    dateDemo: '31 Mei 2026',
    venueDemo: 'Masjid agung bogor',
  },
}

type CountdownConfig = {
  scripts: string[]
  patterns: RegExp[]
}

const isoDatePattern = /new Date\("20\d\d-\d\d-\d\dT[^"]+"\)/g

const templateCountdown: Record<string, CountdownConfig> = {
  'template-042': {
    scripts: [],
    patterns: [/new Date\('May 31, 2026 08:00:00'\)/g],
  },
  'template-074': {
    scripts: [],
    patterns: [/new Date\('May 31 , 2026 03:31:26'\)/g],
  },
  'template-adat-jawa-050-klasik': {
    scripts: ['./assets/js/main.js'],
    patterns: [isoDatePattern],
  },
  'template-adat-minang-050-klasik': {
    scripts: ['./assets/js/main.js'],
    patterns: [isoDatePattern],
  },
  'template-adat-sunda-050-pro': {
    scripts: ['./assets/js/main.js'],
    patterns: [isoDatePattern],
  },
  'template-adat-sunda-050-style': {
    scripts: ['./assets/js/clean-runtime.js'],
    patterns: [isoDatePattern],
  },
  'template-floral-elegant': {
    scripts: ['./assets/js/clean-runtime.js'],
    patterns: [isoDatePattern],
  },
  'template-pixel-clean': {
    scripts: ['./assets/js/clean-runtime.js'],
    patterns: [isoDatePattern],
  },
}

const dbSlugToTemplateId: Record<string, string> = {
  'adat-jawa': 'template-adat-jawa',
  'adat-jawa-lottie': 'template-adat-jawa-lottie',
  'premium-042': 'template-042',
  'premium-074': 'template-074',
  'wedding-premium050-pixel-clean': 'template-pixel-clean',
  'adat-jawa-050-klasik': 'template-adat-jawa-050-klasik',
  'adat-sunda-050-pro': 'template-adat-sunda-050-pro',
  'adat-sunda-050-style': 'template-adat-sunda-050-style',
  'adat-minang-050-klasik': 'template-adat-minang-050-klasik',
  'wedding-premium050-floral-elegant': 'template-floral-elegant',
}

export function getTemplateForInvitationSlug(slug?: string | null) {
  if (!slug) {
    return null
  }
  const templateId = dbSlugToTemplateId[slug]
  if (!templateId) {
    return null
  }
  return templateRegistry.find((template) => template.id === templateId) ?? null
}

export const sampleInvitationData: InvitationRenderData = {
  slug: 'alika-herman',
  title: 'The Wedding Of Alika & Herman',
  eventType: 'wedding',
  invitationNoun: 'Pernikahan',
  hostLabel: 'Mempelai',
  groomName: 'Herman',
  brideName: 'Alika',
  coupleDisplayName: 'Alika & Herman',
  childName: '',
  parentsName: '',
  hostName: '',
  organizationName: '',
  eventName: '',
  eventDay: 'Minggu',
  eventDateText: '31 Mei 2026',
  eventDateISO: '2026-05-31',
  akadTime: '08:00 WIB',
  receptionTime: '10:00 WIB',
  venueName: 'Gedung Serbaguna Nusantara',
  venueAddress: 'Jl. Melati No. 12, Jakarta',
  openingGreeting: 'Assalamualaikum Wr. Wb.',
  openingText:
    'Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami.',
  closingText:
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
  backsoundUrl: '/template-assets/wedding-premium042-wayang-batik/assets/audio/islamic-wedding-backsound.m4a',
  countdownTarget: '2026-05-31T08:00:00+07:00',
}

export function getTemplateById(id: string) {
  return templateRegistry.find((template) => template.id === id) ?? templateRegistry[0]
}

export async function loadTemplateHtml(template: TemplateRegistryItem) {
  const response = await fetch(`${template.publicPath}/index.html`)
  if (!response.ok) {
    throw new Error(`Gagal memuat ${template.code}`)
  }
  return response.text()
}

async function inlineScripts(html: string, template: TemplateRegistryItem, scripts: string[]) {
  let out = html
  const inlined: string[] = []
  for (const script of scripts) {
    const path = script.replace(/^\.?\//, '')
    const response = await fetch(`${template.publicPath}/${path}`)
    if (!response.ok) {
      continue
    }
    const code = await response.text()
    const tag = new RegExp(
      `<script\\b[^>]*src=["']${escapeRegExp(script)}["'][^>]*>\\s*<\\/script>`,
      'i',
    )
    out = out.replace(tag, '')
    inlined.push(`<script>\n${code}\n</scr${'ipt>'}`)
  }
  if (inlined.length > 0) {
    out = out.replace(/<\/body>/i, `${inlined.join('\n')}\n</body>`)
  }
  return out
}

export async function renderInvitationTemplateHtml(
  template: TemplateRegistryItem,
  data: InvitationRenderData,
) {
  const html = await loadTemplateHtml(template)
  const countdown = templateCountdown[template.id]
  const prepared = countdown && countdown.scripts.length > 0
    ? await inlineScripts(html, template, countdown.scripts)
    : html
  return renderTemplateHtml(prepared, template, data)
}

export function renderTemplateHtml(
  html: string,
  template: TemplateRegistryItem,
  data: InvitationRenderData,
) {
  let rendered = html
  const replacements: Array<[RegExp, string]> = []
  const tokens = templateTokens[template.id]

  if (tokens) {
    const couple = escapeHtml(data.coupleDisplayName)
    replacements.push([new RegExp(escapeRegExp(escapeHtml(tokens.coupleDemo)), 'g'), couple])
    replacements.push([new RegExp(escapeRegExp(tokens.coupleDemo), 'g'), couple])
    if (data.groomName) {
      replacements.push([
        new RegExp(escapeRegExp(tokens.groomDemo), 'g'),
        escapeHtml(data.groomName),
      ])
    }
    if (data.brideName) {
      replacements.push([
        new RegExp(escapeRegExp(tokens.brideDemo), 'g'),
        escapeHtml(data.brideName),
      ])
    }
    if (tokens.dateDemo && data.eventDateText) {
      replacements.push([new RegExp(escapeRegExp(tokens.dateDemo), 'g'), escapeHtml(data.eventDateText)])
    }
    if (tokens.venueDemo && data.venueName) {
      replacements.push([new RegExp(escapeRegExp(tokens.venueDemo), 'g'), escapeHtml(data.venueName)])
    }
    rendered = rendered.replace(/\(DEMO TEMPLATE [^)]*\)\s*/g, '')
  }

  const legacyReplacements: Array<[RegExp, string]> = [
    [/The Wedding Of Alika &amp; Herman/g, escapeHtml(data.title)],
    [/The Wedding Of Alika & Herman/g, escapeHtml(data.title)],
    [/Hamzah &amp; Anissa/g, escapeHtml(data.coupleDisplayName)],
    [/Hamzah & Anissa/g, escapeHtml(data.coupleDisplayName)],
    [/Alika/g, escapeHtml(data.brideName)],
    [/Herman/g, escapeHtml(data.groomName)],
    [/Anissa/g, escapeHtml(data.brideName)],
    [/Hamzah/g, escapeHtml(data.groomName)],
    [/Minggu/g, escapeHtml(data.eventDay)],
    [/Selasa/g, escapeHtml(data.eventDay)],
    [/31 Mei 2026/g, escapeHtml(data.eventDateText)],
    [/2 Juni 2026/g, escapeHtml(data.eventDateText)],
    [/Pukul 08:00 WIB/g, `Pukul ${escapeHtml(data.akadTime)}`],
    [/Pukul 10:00 WIB/g, `Pukul ${escapeHtml(data.receptionTime)}`],
    [/Gedung Aula Insan Berdagi Acara/g, escapeHtml(data.venueName)],
    [/Alamat lengkap lokasi acara/g, escapeHtml(data.venueAddress)],
  ]

  const activeReplacements = tokens ? replacements : legacyReplacements

  for (const [pattern, value] of activeReplacements) {
    rendered = rendered.replace(pattern, value)
  }

  const countdown = templateCountdown[template.id]
  if (countdown && data.countdownTarget) {
    for (const pattern of countdown.patterns) {
      rendered = rendered.replace(pattern, `new Date("${data.countdownTarget}")`)
    }
  }

  rendered = rendered.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(data.title)}</title>`,
  )
  rendered = rendered.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${escapeHtml(data.eventDay)}, ${escapeHtml(data.eventDateText)}">`,
  )
  rendered = rendered.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapeHtml(data.title)}" />`,
  )
  rendered = rendered.replace(
    /<meta property="og:description" content="[^"]*">/i,
    `<meta property="og:description" content="${escapeHtml(data.eventDay)}, ${escapeHtml(data.eventDateText)}">`,
  )
  rendered = rendered.replace(
    /<head>/i,
    `<head><base href="${template.publicPath}/"><script>window.__INVITATION_DATA__=${safeJson(data)};</script>${guestShim(data.guestName)}`,
  )

  return rendered
}

function guestShim(guestName?: string) {
  const guest = guestName?.trim() || ''
  if (!guest) {
    return ''
  }
  const encoded = JSON.stringify(guest)
  return `<script>(function(){try{var g=${encoded};var N=window.URLSearchParams;window.URLSearchParams=function(i){if(i==null||i===''||(typeof i==='string'&&i.indexOf('to=')===-1)){var p=new N(i);if(!p.has('to')){p.append('to',g);}return p;}return new N(i);};window.URLSearchParams.prototype=N.prototype;}catch(e){}})();</scr${'ipt>'}`
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
