import type { Template, TemplateAdminInput } from '../../app/types'
import { MockupPhoneFrame } from '../mockup/MockupPanels'
import { templateRegistry } from '../../templateEngine'
import { useState } from 'react'
import type { FormEvent } from 'react'

export function TemplateManagerPanel({
  isSaving,
  onRegisterTemplate,
  templateMessage,
  templates,
}: {
  isSaving: boolean
  onRegisterTemplate: (input: TemplateAdminInput) => Promise<boolean>
  templateMessage: string
  templates: Template[]
}) {
  const [form, setForm] = useState<TemplateAdminInput>({
    assetsUrl: '/template-assets/',
    category: 'wedding',
    configSchema: {
      properties: {
        couple: { minLength: 1, type: 'string' },
        eventDate: { format: 'date', type: 'string' },
      },
      required: ['couple', 'eventDate'],
      type: 'object',
    },
    isActive: true,
    name: '',
    previewUrl: '/preview/',
    slug: '',
    tierAccess: ['creator', 'pro', 'business'],
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await onRegisterTemplate(form)
    if (ok) {
      setForm((current) => ({ ...current, name: '', slug: '' }))
    }
  }

  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Template catalog</p>
        <h2>Register template baru</h2>
        <p>
          Template masih memakai folder lokal di `public/template-assets`, lalu
          didaftarkan ke database agar builder bisa mengambil registry dari API.
        </p>
        <form className="invite-form template-admin-form" onSubmit={handleSubmit}>
          <label>
            Nama template
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Adat Jawa Klasik 050"
              required
              value={form.name}
            />
          </label>
          <label>
            Slug
            <input
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="adat-jawa-klasik-050"
              required
              value={form.slug}
            />
          </label>
          <label>
            Kategori
            <input
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              value={form.category}
            />
          </label>
          <label>
            Tier access
            <input
              onChange={(event) => setForm({ ...form, tierAccess: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
              value={form.tierAccess.join(', ')}
            />
          </label>
          <label>
            Assets URL
            <input
              onChange={(event) => setForm({ ...form, assetsUrl: event.target.value })}
              value={form.assetsUrl}
            />
          </label>
          <label>
            Preview URL
            <input
              onChange={(event) => setForm({ ...form, previewUrl: event.target.value })}
              value={form.previewUrl}
            />
          </label>
          <button className="button primary" disabled={isSaving} type="submit">
            {isSaving ? 'Menyimpan...' : 'Register Template'}
          </button>
          {templateMessage ? <p className="form-message">{templateMessage}</p> : null}
        </form>
      </article>
      {templates.map((template) => (
        <article className="template-mini-card" key={template.id}>
          <MockupPhoneFrame alt={template.name} src={templateRegistry.find((item) => item.publicPath === template.assetsUrl)?.thumbnail ?? templateRegistry[0].thumbnail} />
          <strong>{template.slug}</strong>
          <span>{template.category} - {(template.tierAccess ?? ['free']).join(', ')}</span>
          <a href={template.previewUrl || '/builder-preview'}>Preview</a>
        </article>
      ))}
    </section>
  )
}
