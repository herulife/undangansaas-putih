import { invitationTemplates } from "@/lib/templates";

const items = invitationTemplates.slice(0, 8);
const categories = ["Semua", "Wedding", "Adat Jawa", "Adat Sunda", "Adat Minang"];

export function Templates() {
  return (
    <section id="template" className="py-24 bg-[#070604] border-y border-gold/20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <p className="text-sm text-gold tracking-widest uppercase mb-3">Katalog</p>
            <h2 className="font-serif text-4xl md:text-5xl text-gold-soft">Undanganku</h2>
          </div>
          <a
            href="/dashboard/buat"
            className="shrink-0 rounded-full bg-gold-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-gold hover:opacity-90"
          >
            Buat Undangan
          </a>
        </div>

        <div className="mb-9 flex gap-3 overflow-x-auto border-b border-gold/20 pb-1">
          {categories.map((c, i) => (
            <button
              key={c}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                i === 0
                  ? "bg-gold-gradient text-primary-foreground"
                  : "border border-gold/25 bg-transparent text-muted-foreground hover:border-gold/50 hover:text-gold-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((it) => (
            <article
              key={it.name}
              className="group overflow-hidden rounded-[1.35rem] border border-gold/25 bg-[#0c0906] shadow-[0_18px_45px_-30px_rgba(245,188,75,0.55)] transition duration-300 hover:-translate-y-1 hover:border-gold/55"
            >
              <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_10%,rgba(245,188,75,0.20),transparent_42%),linear-gradient(180deg,#21160b,#080604)] px-4 pb-4 pt-5">
                <div className="relative mx-auto w-[78%] max-w-[164px] rounded-[2rem] border-[7px] border-slate-950 bg-slate-950 shadow-2xl shadow-black/60 transition duration-700 group-hover:rotate-[-1deg] group-hover:scale-[1.03]">
                  <div className="absolute left-1/2 top-1.5 z-20 h-3 w-14 -translate-x-1/2 rounded-full bg-black" />
                  <div className="overflow-hidden rounded-[1.45rem] bg-[#f7f2ea]">
                    <div className="aspect-[9/17]">
                      <img
                        src={it.img}
                        alt={`Template undangan ${it.name}`}
                        width={768}
                        height={1024}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0906] to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-[#1c150b]/85 px-3 py-1 text-[11px] font-semibold text-gold-soft ring-1 ring-gold/25 backdrop-blur">
                  {it.tag}
                </span>
              </div>
              <div className="grid min-h-[10.5rem] gap-4 p-5">
                <div className="min-w-0">
                  <h3 className="font-serif text-2xl leading-[0.95] text-foreground md:text-3xl">
                    {it.name}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">{it.category}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-gold/75">{it.tier}</p>
                </div>
                <div className="grid gap-2">
                  <a
                    href={it.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-gold/35 px-3 py-2 text-sm font-semibold text-gold-soft hover:bg-gold/10"
                  >
                    Preview -&gt;
                  </a>
                  <a
                    href="/dashboard/buat"
                    className="inline-flex items-center justify-center rounded-xl bg-gold-gradient px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Gunakan Tema
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
