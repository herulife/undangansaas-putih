

export function LoadingPage({ title }: { title: string }) {
  return (
    <main className="auth-page">
      <section className="auth-card compact">
        <p className="eyebrow">Mohon tunggu</p>
        <h1>{title}</h1>
        <p>Data sedang disiapkan dari server.</p>
      </section>
    </main>
  )
}

export function NotFoundPage({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <main className="auth-page">
      <section className="auth-card compact">
        <p className="eyebrow">Tidak ditemukan</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <a className="button primary" href="/">Kembali ke Home</a>
      </section>
    </main>
  )
}

export function Nav() {
  return (
    <nav className="nav page-shell">
      <a className="brand" href="/">
        LinkUndang
      </a>
      <div className="nav-links">
        <a href="/templates">Template</a>
        <a href="/builder-preview">Builder Engine</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/u/joko-cikita">Demo Undangan</a>
      </div>
      <a className="button nav-button" href="/dashboard">
        Mulai SaaS
      </a>
    </nav>
  )
}
