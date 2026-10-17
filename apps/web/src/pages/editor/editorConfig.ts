export type EditorField = {
  key: string
  label: string
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  target: 'config' | 'top'
  type: 'date' | 'select' | 'text' | 'textarea' | 'url'
  wide?: boolean
}

export type EditorSection = {
  description: string
  events?: boolean
  fields: EditorField[]
  id: string
  story?: boolean
  title: string
}

export const editorSections: EditorSection[] = [
  {
    description: 'Judul, nama pasangan, tanggal, dan status undangan.',
    fields: [
      { key: 'title', label: 'Judul undangan', target: 'top', type: 'text' },
      { key: 'couple', label: 'Nama pasangan', target: 'top', type: 'text' },
      { key: 'eventDate', label: 'Tanggal acara', target: 'top', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
        target: 'top',
        type: 'select',
      },
    ],
    id: 'dasar',
    title: 'Informasi Dasar',
  },
  {
    description: 'Nama kedua mempelai beserta nama orang tua.',
    fields: [
      { key: 'bride', label: 'Nama mempelai wanita', placeholder: 'Alyssa Kirana', target: 'config', type: 'text' },
      { key: 'groom', label: 'Nama mempelai pria', placeholder: 'Rayhan Pradipta', target: 'config', type: 'text' },
      { key: 'brideParents', label: 'Orang tua mempelai wanita', placeholder: 'Putri dari Bapak ... & Ibu ...', target: 'config', type: 'text' },
      { key: 'groomParents', label: 'Orang tua mempelai pria', placeholder: 'Putra dari Bapak ... & Ibu ...', target: 'config', type: 'text' },
    ],
    id: 'mempelai',
    title: 'Mempelai',
  },
  {
    description: 'Salam pembuka, kalimat pembuka, dan kutipan ayat.',
    fields: [
      { key: 'greeting', label: 'Salam pembuka', placeholder: "Assalamu'alaikum Warahmatullahi Wabarakatuh", target: 'config', type: 'text' },
      { key: 'openingText', label: 'Teks pembuka', placeholder: 'Dengan memohon rahmat Allah SWT...', target: 'config', type: 'textarea', wide: true },
      { key: 'quotes', label: 'Kutipan / ayat', placeholder: 'Dan di antara tanda-tanda kekuasaan-Nya...', target: 'config', type: 'textarea', wide: true },
    ],
    id: 'pembuka',
    title: 'Pembuka',
  },
  {
    description: 'Jam akad/resepsi serta rangkaian acara tambahan (multi-acara).',
    events: true,
    fields: [
      { key: 'akadTime', label: 'Jam akad', placeholder: '08.00 WIB', target: 'config', type: 'text' },
      { key: 'receptionTime', label: 'Jam resepsi', placeholder: '11.00 WIB', target: 'config', type: 'text' },
    ],
    id: 'acara',
    title: 'Acara',
  },
  {
    description: 'Venue, alamat lengkap, dan titik Google Maps.',
    fields: [
      { key: 'venue', label: 'Venue', placeholder: 'Pendopo Agung', target: 'config', type: 'text' },
      { key: 'mapsUrl', label: 'Link Google Maps', placeholder: 'https://maps.google.com/...', target: 'config', type: 'url' },
      { key: 'venueAddress', label: 'Alamat', placeholder: 'Alamat lengkap lokasi acara', target: 'config', type: 'textarea', wide: true },
    ],
    id: 'lokasi',
    title: 'Lokasi & Maps',
  },
  {
    description: 'Cover, musik latar, dan galeri foto.',
    fields: [
      { key: 'coverImage', label: 'Cover image URL', placeholder: '/api/uploads/images/...', target: 'config', type: 'text' },
      { key: 'audioUrl', label: 'Audio URL', placeholder: '/template-assets/.../gending.mp3', target: 'config', type: 'text' },
      { key: 'gallery', label: 'Gallery URLs', placeholder: 'Satu URL gambar per baris', target: 'config', type: 'textarea', wide: true },
    ],
    id: 'media',
    title: 'Cover & Galeri',
  },
  {
    description: 'Video prewedding dan tautan live streaming acara.',
    fields: [
      { key: 'videoUrl', label: 'Link video prewedding', placeholder: 'https://youtube.com/watch?v=...', target: 'config', type: 'url' },
      { key: 'liveStreamUrl', label: 'Link live streaming', placeholder: 'https://youtube.com/live/...', target: 'config', type: 'url' },
    ],
    id: 'video',
    title: 'Video & Live',
  },
  {
    description: 'Rangkaian kisah perjalanan menuju hari bahagia.',
    fields: [],
    id: 'cerita',
    story: true,
    title: 'Love Story',
  },
  {
    description: 'Tema pakaian tamu undangan.',
    fields: [
      { key: 'dresscode', label: 'Dresscode', placeholder: 'Batik / warna netral', target: 'config', type: 'text' },
      { key: 'dresscodeNote', label: 'Catatan dresscode', placeholder: 'Mohon kenakan nuansa warna sage.', target: 'config', type: 'text' },
    ],
    id: 'dresscode',
    title: 'Dresscode',
  },
  {
    description: 'Rekening kado digital dan QR kode.',
    fields: [
      { key: 'giftBank', label: 'Bank hadiah', placeholder: 'BCA', target: 'config', type: 'text' },
      { key: 'giftAccount', label: 'Nomor rekening', placeholder: '123456789', target: 'config', type: 'text' },
      { key: 'giftQrImage', label: 'QR kado URL', placeholder: '/api/uploads/images/...', target: 'config', type: 'text' },
    ],
    id: 'hadiah',
    title: 'Hadiah Digital',
  },
  {
    description: 'Tagar pernikahan dan kalimat penutup undangan.',
    fields: [
      { key: 'hashtag', label: 'Hashtag / tagar', placeholder: '#RayhanAlyssaForever', target: 'config', type: 'text' },
      { key: 'closingText', label: 'Kalimat penutup', placeholder: 'Merupakan kebahagiaan bagi kami apabila...', target: 'config', type: 'textarea', wide: true },
    ],
    id: 'penutup',
    title: 'Hashtag & Penutup',
  },
]
