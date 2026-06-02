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
  groomName: string
  brideName: string
  coupleDisplayName: string
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
]

export const sampleInvitationData: InvitationRenderData = {
  slug: 'alika-herman',
  title: 'The Wedding Of Alika & Herman',
  groomName: 'Herman',
  brideName: 'Alika',
  coupleDisplayName: 'Alika & Herman',
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

export function renderTemplateHtml(
  html: string,
  template: TemplateRegistryItem,
  data: InvitationRenderData,
) {
  let rendered = html
  const replacements: Array<[RegExp, string]> = [
    [/The Wedding Of Alika &amp; Herman/g, escapeHtml(data.title)],
    [/The Wedding Of Alika & Herman/g, escapeHtml(data.title)],
    [/\(DEMO TEMPLATE WEDDING-PREMIUM042\) Hamzah &amp; Anissa/g, escapeHtml(data.title)],
    [/\(DEMO TEMPLATE WEDDING-PREMIUM042\) Hamzah & Anissa/g, escapeHtml(data.title)],
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

  for (const [pattern, value] of replacements) {
    rendered = rendered.replace(pattern, value)
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
    `<head><base href="${template.publicPath}/"><script>window.__INVITATION_DATA__=${JSON.stringify(data)};</script>`,
  )

  return rendered
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
