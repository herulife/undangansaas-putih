
import { Nav } from '../components/common'
import { getTemplateById, renderInvitationTemplateHtml, sampleInvitationData, templateRegistry } from '../templateEngine'
import type { TemplateRegistryItem } from '../templateEngine'
import { useEffect, useState } from 'react'

export function DirectTemplatePreviewPage({ templateId }: { templateId: string }) {
  const selectedTemplate = getTemplateById(templateId)

  return (
    <main className="direct-template-preview">
      <iframe
        src={`${selectedTemplate.publicPath}/index.html`}
        title={`${sampleInvitationData.coupleDisplayName} - ${selectedTemplate.code}`}
      />
    </main>
  )
}

export function BuilderPreviewPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateRegistry[0].id)
  const [previewState, setPreviewState] = useState({
    message: 'Memuat template...',
    srcDoc: '',
  })
  const selectedTemplate = getTemplateById(selectedTemplateId)

  useEffect(() => {
    let isMounted = true

    renderInvitationTemplateHtml(selectedTemplate, sampleInvitationData)
      .then((html) => {
        if (!isMounted) return
        setPreviewState({
          message: `Preview ${selectedTemplate.code} berhasil dirender dari sample JSON.`,
          srcDoc: html,
        })
      })
      .catch((error) => {
        if (!isMounted) return
        setPreviewState({
          message: error instanceof Error ? error.message : 'Gagal merender template',
          srcDoc: '',
        })
      })

    return () => {
      isMounted = false
    }
  }, [selectedTemplate])

  function selectPreviewTemplate(templateId: string) {
    setPreviewState({
      message: 'Memuat template...',
      srcDoc: '',
    })
    setSelectedTemplateId(templateId)
  }

  return (
    <main className="builder-preview-page min-screen">
      <Nav />
      <section className="page-shell builder-preview-shell">
        <div className="section-heading builder-preview-heading">
          <div>
            <p className="eyebrow">Builder undangan</p>
            <h1>Preview engine untuk template siap jual.</h1>
            <p>
              Pilih template dari registry, cek data sample, lalu lihat hasil
              render di frame preview. Halaman ini menjadi fondasi editor konten
              user sebelum publish.
            </p>
          </div>
          <a className="button primary" href="/mockup-dashboard">
            Dashboard
          </a>
        </div>

        <div className="builder-layout">
          <aside className="builder-panel">
            <div className="builder-panel-head">
              <div>
                <span>Registry</span>
                <h2>Template aktif</h2>
              </div>
              <strong>{templateRegistry.length}</strong>
            </div>
            <div className="builder-status-grid">
              <article>
                <span>Plan</span>
                <strong>{selectedTemplate.plan.toUpperCase()}</strong>
              </article>
              <article>
                <span>Kategori</span>
                <strong>{selectedTemplate.category}</strong>
              </article>
              <article>
                <span>Assets</span>
                <strong>Lokal</strong>
              </article>
            </div>
            <div className="template-registry-list">
              {templateRegistry.map((template) => (
                <TemplateRegistryButton
                  isActive={template.id === selectedTemplate.id}
                  key={template.id}
                  onSelect={() => selectPreviewTemplate(template.id)}
                  template={template}
                />
              ))}
            </div>

            <div className="json-card">
              <p className="eyebrow">Data sample</p>
              <pre>{JSON.stringify(sampleInvitationData, null, 2)}</pre>
            </div>
          </aside>

          <section className="builder-preview-stage">
            <div className="builder-preview-toolbar">
              <div>
                <strong>{selectedTemplate.name}</strong>
                <span>{previewState.message}</span>
              </div>
              <div className="builder-toolbar-actions">
                <a
                  className="button secondary"
                  href={`/preview/${selectedTemplate.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Route Preview
                </a>
                <a
                  className="button secondary"
                  href={`${selectedTemplate.publicPath}/index.html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Buka File
                </a>
              </div>
            </div>
            <div className="builder-frame-shell">
              <div className="builder-device-top" aria-hidden="true">
                <span>Mobile preview</span>
                <strong>{selectedTemplate.code}</strong>
              </div>
              <iframe
                className="template-render-frame"
                srcDoc={previewState.srcDoc}
                title={`Preview ${selectedTemplate.code}`}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export function TemplateRegistryButton({
  isActive,
  onSelect,
  template,
}: {
  isActive: boolean
  onSelect: () => void
  template: TemplateRegistryItem
}) {
  return (
    <button
      className={`template-registry-button${isActive ? ' is-active' : ''}`}
      onClick={onSelect}
      type="button"
    >
      <img alt="" src={template.thumbnail} />
      <span>
        <strong>{template.code}</strong>
        <small>{template.name}</small>
        <em>{template.notes}</em>
      </span>
    </button>
  )
}
