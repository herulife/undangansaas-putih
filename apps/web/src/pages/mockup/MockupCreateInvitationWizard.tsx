
import { MockupPhoneFrame } from './MockupPanels'
import { mockupCategoryOptions, slugifyInvitation } from './mockupData'
import type { MockupCategoryId, MockupCreateInvitationInput, MockupTemplateFilter, MockupWizardStep } from './mockupData'
import { getTemplateById, templateRegistry } from '../../templateEngine'
import type { TemplateRegistryItem } from '../../templateEngine'
import { useState } from 'react'
import type { FormEvent } from 'react'

export function MockupCreateInvitationWizard({
  initialTemplateId,
  isOpen,
  onClose,
  onCreate,
}: {
  initialTemplateId: string
  isOpen: boolean
  onClose: () => void
  onCreate: (input: MockupCreateInvitationInput) => void
}) {
  const [categoryId, setCategoryId] = useState<MockupCategoryId>('wedding')
  const [draft, setDraft] = useState({
    eventDate: '',
    isAnnouncement: true,
    slug: '',
    title: '',
  })
  const [filter, setFilter] = useState<MockupTemplateFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId)
  const [step, setStep] = useState<MockupWizardStep>('intro')

  if (!isOpen) {
    return null
  }

  const selectedTemplate = getTemplateById(selectedTemplateId)
  const activeCategory = mockupCategoryOptions.find((category) => category.id === categoryId) ?? mockupCategoryOptions[0]
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTemplates = templateRegistry.filter((template) => {
    const categoryMatches = categoryId === 'syari'
      ? template.category === 'wedding'
      : template.category === categoryId
    const filterMatches = filter === 'all' || template.plan === filter
    const queryMatches = !normalizedQuery
      || template.code.toLowerCase().includes(normalizedQuery)
      || template.name.toLowerCase().includes(normalizedQuery)

    return categoryMatches && filterMatches && queryMatches
  })

  function updateTitle(title: string) {
    setDraft((current) => ({
      ...current,
      slug: current.slug ? current.slug : slugifyInvitation(title),
      title,
    }))
  }

  function selectTemplate(template: TemplateRegistryItem) {
    setSelectedTemplateId(template.id)
    setStep('details')
  }

  function submitWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft.title.trim()
    const slug = slugifyInvitation(draft.slug || title)

    if (!title || !slug) {
      return
    }

    onCreate({
      eventDate: draft.eventDate,
      isAnnouncement: draft.isAnnouncement,
      slug,
      template: selectedTemplate,
      title,
    })
    onClose()
  }

  return (
    <div className="lu-modal-backdrop" role="presentation">
      <section aria-label="Buat undangan baru" className="lu-create-modal" role="dialog">
        <header className="lu-modal-head">
          <div>
            <span>BUAT UNDANGAN</span>
            <h2>{step === 'intro' ? 'Mulai undangan baru' : step === 'template' ? 'Pilih kategori & template' : 'Isi judul & link'}</h2>
          </div>
          <button aria-label="Tutup" className="lu-close-icon" onClick={onClose} type="button">x</button>
        </header>

        <div className="lu-stepper" aria-label="Progress pembuatan undangan">
          {[
            ['intro', 'Onboarding'],
            ['template', 'Template'],
            ['details', 'Identitas'],
          ].map(([id, label]) => (
            <button
              className={step === id ? 'active' : ''}
              key={id}
              onClick={() => setStep(id as MockupWizardStep)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {step === 'intro' ? (
          <div className="lu-wizard-intro">
            <p>
              Flow pembuatan dibuat pendek: pilih tema, isi identitas publik,
              lalu lanjut edit konten acara.
            </p>
            <div className="lu-wizard-checklist">
              {[
                'Pilih tema gratis atau premium',
                'Atur judul dan slug undangan',
                'Isi data acara di editor konten',
                'Atur backsound, RSVP, auto scroll, dan privasi',
                'Preview lalu sebar undangan',
              ].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="lu-modal-actions">
              <button className="secondary" onClick={onClose} type="button">Batal</button>
              <button onClick={() => setStep('template')} type="button">Buat Undangan</button>
            </div>
          </div>
        ) : null}

        {step === 'template' ? (
          <div className="lu-wizard-template">
            <div className="lu-category-grid">
              {mockupCategoryOptions.map((category) => (
                <button
                  className={category.id === categoryId ? 'active' : ''}
                  key={category.id}
                  onClick={() => setCategoryId(category.id)}
                  type="button"
                >
                  <strong>{category.label}</strong>
                  <span>Type {category.typeId}</span>
                  <small>{category.description}</small>
                </button>
              ))}
            </div>

            <div className="lu-wizard-tools">
              <label>
                Cari Template
                <input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Contoh: PREMIUM042 atau adat"
                  value={query}
                />
              </label>
              <div className="lu-segmented" role="group" aria-label="Filter template">
                {[
                  ['all', 'Semua'],
                  ['premium', 'Premium'],
                  ['free', 'Gratis'],
                ].map(([id, label]) => (
                  <button
                    className={filter === id ? 'active' : ''}
                    key={id}
                    onClick={() => setFilter(id as MockupTemplateFilter)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {visibleTemplates.length > 0 ? (
              <div className="lu-picker-grid">
                {visibleTemplates.map((template) => (
                  <article
                    className={`lu-picker-card${selectedTemplateId === template.id ? ' is-selected' : ''}`}
                    key={template.id}
                  >
                    <MockupPhoneFrame alt={template.name} src={template.thumbnail} />
                    <div className="lu-picker-meta">
                      <strong>{template.code}</strong>
                      <span>{template.name}</span>
                      <small>{template.plan.toUpperCase()} - {activeCategory.label}</small>
                    </div>
                    <div className="lu-picker-actions">
                      <a href={`/preview/${template.id}`} target="_blank" rel="noreferrer">Contoh</a>
                      <button onClick={() => selectTemplate(template)} type="button">Gunakan</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="lu-empty-state">
                Belum ada template aktif untuk kategori ini. Katalog admin nanti bisa menambah template baru tanpa mengubah flow user.
              </div>
            )}
          </div>
        ) : null}

        {step === 'details' ? (
          <form className="lu-detail-form" onSubmit={submitWizard}>
            <div className="lu-selected-template">
              <img alt="" src={selectedTemplate.thumbnail} />
              <div>
                <span>Template dipilih</span>
                <strong>{selectedTemplate.code}</strong>
                <small>{selectedTemplate.name}</small>
              </div>
              <button onClick={() => setStep('template')} type="button">Ganti</button>
            </div>

            <label>
              Judul
              <input
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="The Wedding Of Alika & Herman"
                required
                value={draft.title}
              />
            </label>
            <label>
              URL Undangan
              <input
                aria-label="URL Undangan"
                onChange={(event) => setDraft({ ...draft, slug: slugifyInvitation(event.target.value) })}
                placeholder="alika-herman"
                required
                value={draft.slug}
              />
              <small className="lu-url-preview">https://linkundang.web.id/{draft.slug || 'nama-undangan'}</small>
            </label>
            <label>
              Tanggal Acara
              <input
                onChange={(event) => setDraft({ ...draft, eventDate: event.target.value })}
                required
                type="date"
                value={draft.eventDate}
              />
            </label>
            <label className="lu-check">
              <input
                checked={draft.isAnnouncement}
                onChange={(event) => setDraft({ ...draft, isAnnouncement: event.target.checked })}
                type="checkbox"
              />
              Umumkan di katalog saat acara berlangsung
            </label>
            <div className="lu-modal-actions">
              <button className="secondary" onClick={() => setStep('template')} type="button">Kembali</button>
              <button type="submit">Buat & Lanjut Edit</button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  )
}
