import type { Invitation } from '../app/types'
import { templateRegistry } from '../templateEngine'

export function HomePage({
  invitations,
}: {
  invitations: Invitation[]
}) {
  const heroTemplate = templateRegistry[6] ?? templateRegistry[0]
  const sideTemplate = templateRegistry[1] ?? templateRegistry[0]
  const thirdTemplate = templateRegistry[7] ?? templateRegistry[0]
  const categoryItems = [
    ['Wedding Modern', 'bg-blue'],
    ['Adat Jawa', 'bg-violet'],
    ['Adat Sunda', 'bg-rose'],
    ['Minang Klasik', 'bg-amber'],
    ['Muslim Elegan', 'bg-cyan'],
    ['Khitan & Aqiqah', 'bg-emerald'],
    ['Syukuran', 'bg-lime'],
    ['Event Custom', 'bg-slate'],
  ]
  const templateCards = [
    {
      name: 'Floral Elegant',
      price: 'Rp.79.000',
      image: '/templates/wedding-premium050-floral-elegant/assets/images/002-4.webp',
      url: '/templates/wedding-premium050-floral-elegant/index.html?to=Tamu+Undangan',
    },

    {
      name: 'Elegan-Grey',
      price: 'Rp.39.000',
      image: '/template-assets/wedding-premium050-original/assets/images/088-4-3f763d32.webp',
      url: '/template-assets/wedding-premium050-original/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Black-Java',
      price: 'Rp.39.000',
      image: '/template-assets/034/assets/images/074-pexels-nadi-lindsay-2789545.jpg',
      url: '/template-assets/034/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Jawa Klasik',
      price: 'Rp.59.000',
      image: '/template-assets/adat-jawa-050-klasik-alyssa-rayhan/assets/images/hero-couple.webp',
      url: '/template-assets/adat-jawa-050-klasik-alyssa-rayhan/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Minang Klasik',
      price: 'Rp.69.000',
      image: '/template-assets/adat-minang-050-klasik-zahra-fadli/assets/images/hero-couple.webp',
      url: '/template-assets/adat-minang-050-klasik-zahra-fadli/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Sunda Premium',
      price: 'Rp.69.000',
      image: '/template-assets/adat-sunda-050-pro-raras-danis/assets/images/hero-couple.webp',
      url: '/template-assets/adat-sunda-050-pro-raras-danis/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Indonesia Editorial',
      price: 'Rp.79.000',
      image: '/template-assets/wedding-premium074-indonesia-editorial/assets/images/footages/indonesia-wedding-03.png',
      url: '/template-assets/wedding-premium074-indonesia-editorial/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Wayang Batik',
      price: 'Rp.59.000',
      image: '/template-assets/wedding-premium042-wayang-batik/assets/images/background-cover-couple.jpg',
      url: '/template-assets/wedding-premium042-wayang-batik/index.html?to=Tamu+Undangan',
    },
    {
      name: 'Nature Soft',
      price: 'Rp.39.000',
      image: '/template-assets/adat-jawa-alyssa-rayhan-optimized/assets/images/photo-gallery-04.webp',
      url: '/template-assets/adat-jawa-alyssa-rayhan-optimized/index.html?to=Tamu+Undangan',
    },
  ]
  const featureItems = [
    ['Editor siap pakai', 'Ubah nama pasangan, tanggal, lokasi, foto, musik, dan rekening tanpa menyentuh kode.'],
    ['Link personal tamu', 'Bagikan undangan dengan nama penerima agar terasa lebih sopan dan rapi.'],
    ['RSVP terkumpul', 'Ucapan, jumlah hadir, dan daftar tamu masuk ke dashboard untuk dipantau.'],
    ['Preview seperti HP', 'Cek tampilan mobile, maps, audio, dan auto-scroll sebelum link disebarkan.'],
  ]
  const pricingItems = [
    ['Starter', 'Rp.0', 'Coba alur builder dan preview undangan sebelum memilih paket.'],
    ['Creator', 'Rp.39.000', 'Template premium, nama tamu, RSVP, maps, dan publish link.'],
    ['Signature', 'Rp.59.000', 'Musik, auto-scroll, galeri foto, gift, dan style adat pilihan.'],
    ['Studio', 'Rp.99.000', 'Dibantu admin, revisi prioritas, dan tampilan lebih personal.'],
  ]
  const heroBadges = ['Preview mobile', 'Nama tamu otomatis', 'Maps aktif']
  const processSteps = [
    ['01', 'Pilih tema', 'Mulai dari template premium yang sudah siap jual.'],
    ['02', 'Isi detail', 'Masukkan data acara, foto, rekening, RSVP, dan lokasi.'],
    ['03', 'Bagikan link', 'Preview dulu, lalu kirim link personal ke tamu.'],
  ]

  return (
    <main className="ii-home min-screen">
      <header className="ii-nav">
        <a className="ii-logo" href="/">
          <span aria-hidden="true" />
          <strong>LinkUndang</strong>
        </a>
        <nav aria-label="Navigasi utama">
          <a className="active" href="/">Home</a>
          <a href="#harga">Harga</a>
          <a href="#template-design">Contoh</a>
          <a href="#fitur">Tools</a>
          <a href="#tutorial">Tutorial</a>
          <a href="#faq">FAQ</a>
          <a href="/dashboard">Login</a>
        </nav>
        <a className="ii-cta" href="/mockup-dashboard">Mulai Gratis</a>
        <button className="ii-menu" aria-label="Buka menu" type="button">
          <span />
          <span />
          <span />
        </button>
      </header>

      <section className="ii-hero">
        <div className="ii-hero-copy">
          <small className="ii-hero-kicker">Platform undangan digital premium</small>
          <h1>
            Undangan
            <br />
            Digital Premium
            <br />
            Siap Dibagikan
            <br />
            <span>Hari Ini</span>
          </h1>
          <p>
            Buat link undangan yang terlihat rapi di HP tamu: template adat,
            nama penerima, musik, maps, RSVP, galeri, dan gift tersusun dalam
            satu alur yang mudah diedit.
          </p>
          <div className="ii-hero-badges" aria-label="Keunggulan utama">
            {heroBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className="ii-actions">
            <a href="/mockup-dashboard">Mulai Buat Undangan &gt;</a>
            <a href="/dashboard">
              <b>WA</b>
              Konsultasi Admin
            </a>
          </div>
          <p className="ii-admin-note">
            <strong>Bisa dibantu sampai jadi.</strong> Preview dulu, revisi tampilan, lalu publish saat sudah cocok.
          </p>
        </div>

        <div className="ii-hero-visual" aria-label="Preview undangan">
          <div className="ii-preview-stack">
            <div className="ii-side-card left">
              <img alt="Preview template undangan kiri" src={sideTemplate.thumbnail} />
            </div>
            <div className="ii-phone">
              <div className="ii-notch" />
              <img alt="Preview template utama" src={heroTemplate.thumbnail} />
              <div>
                <small>The Wedding Of</small>
                <strong>Alyssa & Rayhan</strong>
                <span>Buka Undangan</span>
              </div>
            </div>
            <div className="ii-side-card right">
              <img alt="Preview template undangan kanan" src={thirdTemplate.thumbnail} />
            </div>
          </div>
          <div className="ii-flow-card">
            <small>Flow pembuatan</small>
            <strong>Dari data acara sampai link siap share</strong>
            {processSteps.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <div>
                  <b>{title}</b>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ii-categories" aria-label="Kategori acara">
        {categoryItems.map(([label, tone]) => (
          <a className={`ii-category ${tone}`} href="#template-design" key={label}>
            <span aria-hidden="true" />
            <strong>{label}</strong>
          </a>
        ))}
      </section>

      <section className="ii-template-section" id="template-design">
        <div className="ii-heading">
          <small>Katalog premium</small>
          <h2>Mulai dari desain yang sudah terasa siap pakai</h2>
          <p>{templateRegistry.length} template lokal siap preview.</p>
        </div>
        <div className="ii-template-grid">
          {templateCards.map((template) => (
            <article className="ii-template-card" key={template.name}>
              <a href={template.url}>
                <img alt={`Preview ${template.name}`} src={template.image} />
              </a>
              <p>{template.price}</p>
              <h3>{template.name}</h3>
              <div aria-label="Rating bintang">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <a href={template.url}>Preview</a>
              <a href="/mockup-dashboard">Gunakan Tema</a>
            </article>
          ))}
        </div>
        <a className="ii-more" href="/templates">Tampilkan Tema Lainnya</a>
      </section>

      <section className="ii-proof">
        <article>
          <strong>800.000+</strong>
          <span>Link undangan dibuat</span>
        </article>
        <article>
          <strong>2.5 juta+</strong>
          <span>Tamu menerima undangan</span>
        </article>
        <article>
          <strong>{invitations.length}</strong>
          <span>Project aktif</span>
        </article>
        <article>
          <strong>{templateRegistry.length}</strong>
          <span>Template aktif</span>
        </article>
      </section>

      <section className="ii-feature-section" id="fitur">
        <div className="ii-heading">
          <small>Fitur operasional</small>
          <h2>Satu dashboard untuk edit, preview, dan publish</h2>
          <p>Dibuat untuk pemilik acara, reseller, dan admin yang perlu kerja cepat tanpa kehilangan rasa premium.</p>
        </div>
        <div className="ii-feature-grid">
          {featureItems.map(([title, body]) => (
            <article key={title}>
              <span aria-hidden="true" />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ii-pricing" id="harga">
        <div className="ii-heading">
          <small>Paket fleksibel</small>
          <h2>Pilih paket sesuai kebutuhan acara</h2>
        </div>
        <div className="ii-price-grid">
          {pricingItems.map(([name, price, body], index) => (
            <article className={index === 2 ? 'featured' : ''} key={name}>
              <small>{name}</small>
              <strong>{price}</strong>
              <p>{body}</p>
              <a href="/mockup-dashboard">Pilih Paket</a>
            </article>
          ))}
        </div>
      </section>

      <section className="ii-tutorial" id="tutorial">
        <div className="ii-heading">
          <small>Panduan cepat</small>
          <h2>Buat undangan dalam 3 langkah</h2>
          <p>Alur sederhana dari daftar sampai link siap dibagikan ke tamu.</p>
        </div>
        <div className="ii-steps">
          {processSteps.map(([number, title, body]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ii-payment" id="pembayaran">
        <div className="ii-heading">
          <small>Metode pembayaran</small>
          <h2>Pilih cara bayar yang paling nyaman</h2>
        </div>
        <div className="ii-pay-methods">
          {['Transfer Bank', 'QRIS', 'E-Wallet', 'Midtrans'].map((method) => (
            <article key={method}>
              <span aria-hidden="true" />
              <strong>{method}</strong>
              <p>Pembayaran otomatis diproses setelah transaksi berhasil.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ii-faq" id="faq">
        <div className="ii-heading">
          <small>Tanya jawab</small>
          <h2>Pertanyaan yang sering diajukan</h2>
        </div>
        <div className="ii-faq-list">
          {[
            ['Apakah undangan bisa dibuka di HP?', 'Ya, semua template dioptimalkan untuk tampilan mobile sehingga terlihat rapi di HP tamu.'],
            ['Berapa lama proses pembuatannya?', 'Kurang dari 5 menit: pilih tema, isi data acara, lalu bagikan link.'],
            ['Bisakah nama tamu dipersonalisasi?', 'Bisa. Setiap tamu menerima link dengan nama penerima otomatis agar terasa lebih sopan.'],
            ['Apakah mendukung RSVP?', 'Ya, ucapan, jumlah hadir, dan daftar tamu masuk otomatis ke dashboard Anda.'],
            ['Bisa dibantu sampai jadi?', 'Bisa. Kami membantu preview, revisi tampilan, sampai publish saat sudah cocok.'],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="ii-footer">
        <strong>LinkUndang</strong>
        <span>Undangan digital Indonesia yang rapi, hangat, dan siap dibagikan.</span>
      </footer>

      <a className="ii-wa" href="/dashboard" aria-label="Chat admin">
        <small>Butuh Bantuan?</small>
        <b>WA</b>
      </a>
      <nav className="ii-bottom-nav" aria-label="Navigasi mobile">
        <a href="/">Home</a>
        <a href="#harga">Harga</a>
        <a href="#template-design">Template</a>
        <a href="/dashboard">Login</a>
      </nav>
    </main>
  )
}
