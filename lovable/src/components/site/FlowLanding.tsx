import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Crown,
  Gift,
  LayoutTemplate,
  MapPinned,
  MessageCircle,
  PenLine,
  Play,
  QrCode,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { invitationTemplates } from "@/lib/templates";

const templates = invitationTemplates.slice(0, 4);

const onboardingSteps = [
  {
    eyebrow: "1.1 Home",
    title: "Undangan Digital Modern & Eksklusif",
    body: "Mulai gratis, lihat harga, lalu pilih template premium tanpa instal aplikasi.",
    icon: Sparkles,
    tone: "violet",
  },
  {
    eyebrow: "1.2 Pilih aksi",
    title: "Buat sendiri atau dibantu admin",
    body: "User bebas membuat mandiri, atau mengirim bahan ke admin via WhatsApp.",
    icon: PenLine,
    tone: "blue",
  },
  {
    eyebrow: "1.3 Login WhatsApp",
    title: "Masuk cepat dengan OTP",
    body: "Nomor WhatsApp menjadi identitas akun supaya proses tamu dan support rapi.",
    icon: MessageCircle,
    tone: "green",
  },
  {
    eyebrow: "1.4 Dashboard",
    title: "Pilih metode pembuatan",
    body: "Setelah login, user langsung diarahkan ke metode A atau metode B.",
    icon: LayoutTemplate,
    tone: "amber",
  },
];

const selfSteps = [
  ["Isi Data Acara", "Nama pasangan, tanggal, waktu, lokasi, dan detail keluarga."],
  ["Pilih Template", "Filter semua, premium, favorit, dan kategori adat."],
  ["Kustomisasi", "Desain, konten, musik, galeri, RSVP, gift, dan maps."],
  ["Publikasi", "Preview final, publish, lalu dapatkan tautan unik dan QR."],
  ["Sebar ke Tamu", "Bagikan ke WhatsApp, Instagram, Facebook, email, atau salin link."],
];

const adminSteps = [
  ["Kirim Data", "User upload foto, teks acara, lokasi, dan catatan desain."],
  ["Admin Proses", "Admin memilih template, kustomisasi, susun konten, lalu review internal."],
  ["Preview & Revisi", "User cek hasil, minta revisi bila perlu, lalu menyetujui."],
  ["Pembayaran", "Bayar setelah cocok, via transfer, QRIS, e-wallet, atau kartu."],
  ["Terbit", "Undangan aktif dan siap disebarkan ke tamu."],
];

const guestSteps = [
  { title: "Lihat Undangan", body: "Tamu membuka link personal dan melihat cover premium.", icon: Smartphone },
  { title: "RSVP", body: "Konfirmasi hadir, jumlah tamu, dan catatan ke pengantin.", icon: Users },
  { title: "Buku Tamu", body: "Ucapan doa tampil rapi dan bisa dimoderasi.", icon: MessageCircle },
  { title: "Kado Digital", body: "Nominal cepat, rekening, dan instruksi transfer.", icon: Gift },
  { title: "Peta Lokasi", body: "Google Maps aktif untuk arah ke lokasi acara.", icon: MapPinned },
  { title: "Bagikan", body: "Sebar ulang melalui WhatsApp, sosial media, email, dan QR.", icon: Share2 },
];

const quickAccess = [
  ["Dari beranda", "Klik Lihat Harga lalu pilih paket."],
  ["Dari template", "Klik Pilih Template Ini untuk masuk ke form metode A."],
  ["Dari dashboard", "Pilih Buat Sendiri atau Minta Dibuatkan Admin."],
];

const benefits = [
  { title: "Tanpa Masa Aktif", body: "Undangan bisa diakses jangka panjang.", icon: Clock3 },
  { title: "Edit Kapan Saja", body: "Konten dapat diubah setelah publish.", icon: PenLine },
  { title: "Mobile Friendly", body: "Tampilan optimal di semua perangkat.", icon: Smartphone },
  { title: "QR & Tautan Unik", body: "Mudah dibagikan ke siapa saja.", icon: QrCode },
  { title: "Aman & Terpercaya", body: "Data dan akses akun terlindungi.", icon: ShieldCheck },
  { title: "Admin Responsif", body: "Support cepat melalui WhatsApp.", icon: MessageCircle },
];

const stats = [
  ["2 metode", "Mandiri atau dibantu admin"],
  ["6 fitur tamu", "RSVP, ucapan, gift, maps, QR, share"],
  ["50+ template", "Siap untuk katalog premium"],
  ["1 link", "Semua kebutuhan acara"],
];

const footerHighlights = [
  { title: "Mudah & Cepat", body: "Buat undangan dalam hitungan menit", icon: Zap },
  { title: "Tanpa Aplikasi", body: "Cukup lewat browser", icon: Smartphone },
  { title: "Aman", body: "Sistem dan data terlindungi", icon: ShieldCheck },
  { title: "Premium", body: "Template eksklusif Indonesia", icon: Crown },
  { title: "Fitur Lengkap", body: "RSVP, buku tamu, kado, maps", icon: Settings2 },
  { title: "Admin Responsif", body: "Bantuan cepat via WhatsApp", icon: MessageCircle },
];

function getToneClasses(tone: string) {
  switch (tone) {
    case "green":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-violet-200 bg-violet-50 text-violet-700";
  }
}

function PhonePreview() {
  const heroTemplate = templates[0];

  return (
    <div className="relative mx-auto w-full max-w-[310px]">
      <div className="rounded-[2.25rem] border-[10px] border-slate-950 bg-slate-950 shadow-2xl shadow-blue-900/20">
        <div className="relative overflow-hidden rounded-[1.55rem] bg-white">
          <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />
          <div className="relative h-[565px] overflow-hidden">
            <img
              src={heroTemplate?.img}
              alt="Preview template undangan premium"
              className="h-full w-full object-cover"
              width={420}
              height={780}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/60 to-white/95" />
            <div className="absolute inset-x-6 top-12 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-900">The Wedding Of</p>
              <div className="mt-16 rounded-full bg-white/85 p-4 shadow-lg ring-1 ring-blue-100">
                <div className="mx-auto grid size-24 place-items-center rounded-full bg-gradient-to-br from-emerald-100 to-violet-100 text-3xl font-semibold text-violet-700">
                  IA
                </div>
              </div>
              <h1 className="mt-8 font-serif text-4xl leading-none text-violet-800">Budi & Ani</h1>
              <p className="mt-3 text-xs text-slate-600">25 Mei 2026</p>
              <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-700/25">
                <Play className="size-4 fill-current" />
                Buka Undangan
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 grid grid-cols-5 border-t border-blue-100 bg-white/92 px-3 py-3 text-center text-[10px] font-medium text-slate-500">
              {["Cover", "Acara", "RSVP", "Gift", "Maps"].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute right-1 top-36 hidden space-y-3 sm:-right-5 sm:block">
        {["Top", "Musik", "Read"].map((item, index) => (
          <div key={item} className="grid size-12 place-items-center rounded-2xl border border-violet-100 bg-white text-[10px] font-semibold text-violet-700 shadow-lg">
            {index === 1 ? <Play className="size-4 fill-current" /> : item}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepCard({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <article className="relative rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-full bg-blue-700 text-sm font-bold text-white">{index}</span>
        {index < 5 && <ChevronRight className="hidden size-5 text-blue-500 md:block" />}
      </div>
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

export function FlowLanding() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7faff] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet-700 text-lg font-black text-white">I</span>
            <span>
              <span className="block text-lg font-black tracking-tight text-blue-950">IndoInvite</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-blue-500 max-[420px]:tracking-[0.18em]">Undangan Digital</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#alur" className="hover:text-blue-700">Alur</a>
            <a href="#metode" className="hover:text-blue-700">Metode</a>
            <a href="#template" className="hover:text-blue-700">Template</a>
            <a href="#harga" className="hover:text-blue-700">Harga</a>
            <Link to="/home-lama" className="hover:text-blue-700">Home Lama</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-full border border-blue-100 px-4 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 sm:inline-flex">
              Masuk
            </Link>
            <Link to="/dashboard/buat" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-violet-700 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-violet-700/20 hover:bg-violet-800 sm:px-4">
              Buat<span className="hidden min-[430px]:inline"> Gratis</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-blue-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                <Zap className="size-4" />
                Cepat, rapi, siap sebar
              </div>
              <h1 className="mt-6 max-w-3xl text-[2.2rem] font-black leading-[1.03] tracking-tight text-blue-950 min-[430px]:text-[2.65rem] sm:text-5xl md:text-7xl">
                Undangan digital modern dengan alur yang jelas.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Satu platform untuk membuat undangan sendiri, meminta bantuan admin, menerima RSVP, membagikan link, dan mengelola tamu dari dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/dashboard/buat" className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-700/20 hover:bg-violet-800">
                  Buat Undangan Gratis
                  <ChevronRight className="size-4" />
                </Link>
                <a href="#harga" className="inline-flex items-center rounded-full border border-blue-200 bg-white px-6 py-3 text-sm font-bold text-blue-950 hover:border-blue-400">
                  Lihat Harga
                </a>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-4">
                {stats.map(([value, label]) => (
                  <div key={value} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <strong className="block text-lg text-blue-950">{value}</strong>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <PhonePreview />
          </div>
        </section>

        <section id="alur" className="border-b border-blue-100 py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">1. Onboarding & Login</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-blue-950 md:text-5xl">Pengguna langsung tahu harus mulai dari mana.</h2>
              </div>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-950 hover:border-blue-400">
                Buka Dashboard
                <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.eyebrow} className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <div className={`mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${getToneClasses(step.tone)}`}>
                      <Icon className="size-4" />
                      {step.eyebrow}
                    </div>
                    <h3 className="text-lg font-black text-blue-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="metode" className="border-b border-blue-100 bg-white py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.34fr]">
              <div className="rounded-3xl border border-blue-100 bg-[#fbfdff] p-5 md:p-7">
                <div className="mb-6">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">2A. Metode A - Buat Sendiri</p>
                  <h2 className="mt-2 text-3xl font-black text-blue-950">Dari data acara sampai link siap sebar.</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-5">
                  {selfSteps.map(([title, body], index) => (
                    <StepCard key={title} index={index + 1} title={title} body={body} />
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-white p-4 text-sm text-slate-600">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  Bisa edit kapan saja tanpa batas waktu, lalu simpan perubahan dari dashboard.
                </div>
              </div>

              <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 md:p-7">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Akses Cepat</p>
                <div className="mt-5 space-y-3">
                  {quickAccess.map(([title, body], index) => (
                    <div key={title} className="rounded-2xl border border-amber-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-black text-amber-700">{index + 1}</span>
                        <div>
                          <h3 className="text-sm font-black text-blue-950">{title}</h3>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="border-b border-blue-100 py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="rounded-3xl border border-violet-100 bg-violet-50/70 p-5 md:p-7">
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-violet-700">2B. Metode B - Minta Dibuatkan Admin</p>
                <h2 className="mt-2 text-3xl font-black text-blue-950">Untuk user yang ingin hasil cepat tanpa mengedit sendiri.</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-5">
                {adminSteps.map(([title, body], index) => (
                  <StepCard key={title} index={index + 1} title={title} body={body} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="template" className="border-b border-blue-100 bg-white py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-700">Template Premium</p>
                <h2 className="mt-2 text-3xl font-black text-blue-950 md:text-5xl">Pilih template, lalu langsung isi form.</h2>
              </div>
              <Link to="/dashboard/template" className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-bold text-blue-950 hover:border-blue-400">
                Lihat Semua
                <ChevronRight className="size-4" />
              </Link>
            </div>
            <div className="grid gap-5 md:grid-cols-4">
              {templates.map((item) => (
                <article key={item.name} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
                  <div className="aspect-[3/4] overflow-hidden bg-blue-50">
                    <img src={item.img} alt={item.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-blue-950">{item.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{item.category}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a href={item.previewUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-blue-700 px-3 py-2 text-center text-sm font-bold text-white hover:bg-blue-800">
                        Lihat
                      </a>
                      <Link to="/dashboard/buat" className="rounded-xl bg-cyan-600 px-3 py-2 text-center text-sm font-bold text-white hover:bg-cyan-700">
                        Pilih
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-blue-100 py-16">
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">3. Pengalaman Tamu</p>
              <h2 className="mt-2 text-3xl font-black text-blue-950 md:text-5xl">Tamu bisa melakukan semua hal dari satu tautan.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {guestSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                    <Icon className="size-8 text-emerald-600" />
                    <h3 className="mt-4 text-base font-black text-blue-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="harga" className="bg-white py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Fitur Unggulan IndoInvite</p>
              <h2 className="mt-2 text-3xl font-black text-blue-950 md:text-5xl">Dirancang untuk konversi, bukan cuma cantik.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Alur dibuat pendek: pilih metode, isi data, preview, publish, lalu sebar. Fitur tamu tetap lengkap tanpa membuat user bingung.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/dashboard/buat" className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-6 py-3 text-sm font-bold text-white hover:bg-violet-800">
                  Mulai Buat
                  <Send className="size-4" />
                </Link>
                <Link to="/home-lama" className="inline-flex items-center rounded-full border border-blue-200 px-6 py-3 text-sm font-bold text-blue-950 hover:border-blue-400">
                  Lihat Home Lama
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.title} className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                    <Icon className="size-7 text-amber-600" />
                    <h3 className="mt-4 font-black text-blue-950">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-blue-100 bg-blue-950 py-8 text-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 md:grid-cols-6">
            {footerHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3 border-blue-800 py-3 md:border-r md:pr-4">
                  <Icon className="size-6 shrink-0 text-amber-300" />
                  <div>
                    <strong className="block text-sm">{item.title}</strong>
                    <span className="text-xs leading-5 text-blue-100">{item.body}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
