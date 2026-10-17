import { invitationTemplates } from "@/lib/templates";

const items = invitationTemplates.slice(0, 6);
const categories = ["Semua", "Wedding", "Premium 050"];

export function Templates() {
  return (
    <section id="template" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <p className="text-sm text-gold tracking-widest uppercase mb-3">Katalog</p>
            <h2 className="font-serif text-4xl md:text-5xl">Template yang siap memukau tamu</h2>
          </div>
          <a href="/dashboard/template" className="text-sm text-muted-foreground hover:text-foreground">Lihat semua template -&gt;</a>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((c, i) => (
            <button
              key={c}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition ${
                i === 0 ? "bg-gold-gradient text-primary-foreground" : "hairline text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
          {items.map((it) => (
            <article key={it.name} className="group relative overflow-hidden rounded-2xl bg-card hairline">
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={it.img}
                  alt={`Template undangan ${it.name}`}
                  width={768}
                  height={1024}
                  loading="lazy"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute top-3 left-3">
                <span className="rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-[11px] text-gold-soft hairline">{it.tag}</span>
              </div>
              <div className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl leading-none">{it.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{it.category}</p>
                </div>
                <a href={it.previewUrl} target="_blank" rel="noreferrer" className="shrink-0 text-xs text-gold hover:underline">Preview -&gt;</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
