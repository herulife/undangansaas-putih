
import { MockupPhoneFrame } from '../mockup/MockupPanels'
import { templateRegistry } from '../../templateEngine'

export function BuilderEnginePanel() {
  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Flow builder</p>
        <h2>Mesin template siap dipakai user</h2>
        <p>
          Registry memilih template, data undangan mengisi JSON, lalu preview
          tampil di iframe. Tahap berikutnya tinggal menyambungkan form section
          ke schema masing-masing template.
        </p>
        <div className="builder-flow-list">
          {['Pilih template', 'Isi konten', 'Preview mobile', 'Publish link'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="module-actions">
          <a className="button primary" href="/builder-preview">Buka Preview Engine</a>
          <a className="button secondary" href="/dashboard/template">Kelola Template</a>
        </div>
      </article>
      {templateRegistry.map((template) => (
        <article className="template-mini-card" key={template.id}>
          <MockupPhoneFrame alt={template.name} src={template.thumbnail} />
          <strong>{template.code}</strong>
          <span>{template.name}</span>
          <small>{template.plan.toUpperCase()}</small>
        </article>
      ))}
    </section>
  )
}
