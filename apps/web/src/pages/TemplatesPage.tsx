import { titleCase } from '../app/format'
import type { Template } from '../app/types'
import { Nav } from '../components/common'
import { templateRegistry } from '../templateEngine'

export function TemplatesPage({ templates }: { templates: Template[] }) {
  const catalogItems = templateRegistry.map((template) => ({
    category: template.category,
    code: template.code,
    id: template.id,
    image: template.thumbnail,
    name: template.name,
    plan: template.plan,
    url: `${template.publicPath}/index.html?to=Tamu+Undangan`,
  }))

  return (
    <main className="paper-grain min-screen">
      <Nav />
      <section className="page-shell page-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Katalog template</p>
            <h1>Pilih desain undangan digital.</h1>
            <p>
              {catalogItems.length} template lokal siap preview. Data katalog API:
              {' '}{templates.length} item.
            </p>
          </div>
          <a className="button primary" href="/dashboard">
            Kelola Template
          </a>
        </div>

        <div className="template-grid">
          {catalogItems.map((template) => (
            <article className="template-card" key={template.id}>
              <a className="template-art" href={template.url}>
                <img alt={`Preview ${template.name}`} src={template.image} />
              </a>
              <div className="template-body">
                <p>{template.plan}</p>
                <h2>{template.name}</h2>
                <span>{titleCase(template.category)} - {template.code}</span>
                <a className="button secondary" href={template.url}>
                  Preview
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
