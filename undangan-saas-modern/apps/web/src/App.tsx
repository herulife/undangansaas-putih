import { ArrowUpRight, CalendarDays, Globe2, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';
import { MetricCard } from './components/MetricCard';

const features = [
  { icon: LayoutDashboard, title: 'Studio dashboard', body: 'Kelola template, klien, RSVP, dan publikasi dari satu workspace.' },
  { icon: Globe2, title: 'Public page SEO', body: 'Slug bersih, metadata siap index, dan struktur halaman cepat untuk tamu.' },
  { icon: ShieldCheck, title: 'SaaS foundation', body: 'JWT auth, PostgreSQL, Redis, Docker, dan modular backend architecture.' },
];

const invitations = [
  { couple: 'Ayla & Raka', theme: 'Ivory Editorial', date: '24 Aug 2026' },
  { couple: 'Nara & Dimas', theme: 'Botanical Luxe', date: '12 Sep 2026' },
  { couple: 'Keira & Jovan', theme: 'Modern Heritage', date: '03 Oct 2026' },
];

export function App() {
  return (
    <main className="min-h-screen bg-ivory text-ink">
      <section className="border-b border-ink/10 bg-[radial-gradient(circle_at_top_left,rgba(140,47,57,0.13),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(90,107,87,0.16),transparent_34%),linear-gradient(135deg,#f7f2ea,#ffffff_58%,#edf2ec)]">
        <div className="mx-auto grid min-h-[88vh] max-w-7xl gap-10 px-5 py-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div className="flex flex-col justify-between">
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-ink text-ivory">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="font-semibold">Undangan Studio</p>
                  <p className="text-xs text-ink/55">Modern invitation SaaS</p>
                </div>
              </div>
              <button className="inline-flex size-10 items-center justify-center rounded-lg border border-ink/15 bg-white/70 text-ink transition hover:bg-white" aria-label="Open dashboard">
                <ArrowUpRight size={18} />
              </button>
            </nav>

            <div className="max-w-2xl py-16 sm:py-24 lg:py-12">
              <p className="text-sm font-semibold uppercase text-ruby">Premium SaaS Blueprint</p>
              <h1 className="mt-5 font-display text-5xl leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
                Platform undangan online yang terasa mahal, cepat, dan siap tumbuh.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-ink/66 sm:text-lg">
                Dibangun untuk wedding vendor, kreator template, dan bisnis undangan digital yang butuh produk rapi dari hari pertama.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-ivory transition hover:bg-ruby">Mulai workspace</button>
                <button className="rounded-lg border border-ink/15 bg-white/70 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-white">Lihat arsitektur</button>
              </div>
            </div>
          </div>

          <div className="flex items-end pb-8">
            <div className="w-full rounded-lg border border-white/70 bg-white/72 p-4 shadow-luxury backdrop-blur">
              <div className="rounded-lg bg-ink p-4 text-ivory">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase text-champagne">Live workspace</p>
                    <h2 className="mt-2 text-xl font-semibold">CintaBuku Studio</h2>
                  </div>
                  <CalendarDays className="text-champagne" size={24} />
                </div>
                <div className="mt-4 space-y-3">
                  {invitations.map((item) => (
                    <div key={item.couple} className="grid grid-cols-[1fr_auto] gap-4 rounded-lg bg-white/7 p-4">
                      <div>
                        <p className="font-medium">{item.couple}</p>
                        <p className="mt-1 text-sm text-white/55">{item.theme}</p>
                      </div>
                      <p className="text-sm text-champagne">{item.date}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricCard label="Publish" value="128" caption="Invitation live" />
                <MetricCard label="RSVP" value="8.4k" caption="Guest responses" />
                <MetricCard label="Speed" value="96" caption="Lighthouse score" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 py-14 sm:px-8 lg:grid-cols-3 lg:px-10">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title} className="rounded-lg border border-ink/10 bg-white p-6">
              <div className="grid size-11 place-items-center rounded-lg bg-champagne/30 text-ruby">
                <Icon size={20} />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-ink/62">{feature.body}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
