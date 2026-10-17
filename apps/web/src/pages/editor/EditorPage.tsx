import { apiURL, authHeaders } from '../../app/api'
import { readableStatus } from '../../app/format'
import type { Invitation, InvitationConfig, InvitationEvent, InvitationStoryItem, PublishInvitationInput, RSVP, UpdateInvitationInput } from '../../app/types'
import { editorSections } from './editorConfig'
import type { EditorField } from './editorConfig'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

export function EditorPage({
  editorMessage,
  invitation,
  isPublishing,
  isUpdating,
  loadRSVPs,
  publishInvitation,
  publishMessage,
  rsvps,
  updateInvitation,
}: {
  editorMessage: string
  invitation: Invitation
  isPublishing: boolean
  isUpdating: boolean
  loadRSVPs: (slug: string) => Promise<void>
  publishInvitation: (slug: string, input: PublishInvitationInput) => Promise<boolean>
  publishMessage: string
  rsvps: RSVP[]
  updateInvitation: (slug: string, input: UpdateInvitationInput) => Promise<boolean>
}) {
  const [form, setForm] = useState<UpdateInvitationInput>({
    couple: invitation.couple,
    eventDate: invitation.eventDate,
    status: invitation.status.toLowerCase(),
    title: invitation.title || invitation.couple,
    config: {
      ...(invitation.config ?? {}),
      events: invitation.config?.events ?? [],
      gallery: invitation.config?.gallery ?? [],
      story: invitation.config?.story ?? [],
    },
  })
  const [publishForm, setPublishForm] = useState<PublishInvitationInput>({
    customDomain: '',
    dynamicOg: false,
    galleryCount: invitation.config?.gallery?.length ?? 0,
    removeWatermark: !(invitation.watermark ?? true),
  })
  const [activeSection, setActiveSection] = useState(editorSections[0]?.id ?? 'dasar')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await updateInvitation(invitation.slug, form)
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await publishInvitation(invitation.slug, {
      ...publishForm,
      galleryCount: form.config?.gallery?.length ?? publishForm.galleryCount,
    })
  }

  function updateConfig(key: keyof InvitationConfig, value: InvitationConfig[keyof InvitationConfig]) {
    setForm((current) => ({
      ...current,
      config: {
        ...(current.config ?? {}),
        [key]: value,
      },
    }))
  }

  function addEvent() {
    updateConfig('events', [
      ...(form.config?.events ?? []),
      { address: '', date: form.eventDate, mapsUrl: '', name: '', time: '', venue: '' },
    ])
  }

  function updateEvent(index: number, key: keyof InvitationEvent, value: string) {
    const events = [...(form.config?.events ?? [])]
    events[index] = { ...events[index], [key]: value }
    updateConfig('events', events)
  }

  function removeEvent(index: number) {
    updateConfig('events', (form.config?.events ?? []).filter((_, itemIndex) => itemIndex !== index))
  }

  function addStory() {
    updateConfig('story', [
      ...(form.config?.story ?? []),
      { text: '', title: '' },
    ])
  }

  function updateStory(index: number, key: keyof InvitationStoryItem, value: string) {
    const story = [...(form.config?.story ?? [])]
    story[index] = { ...story[index], [key]: value }
    updateConfig('story', story)
  }

  function removeStory(index: number) {
    updateConfig('story', (form.config?.story ?? []).filter((_, itemIndex) => itemIndex !== index))
  }

  async function deleteRSVP(rsvpId: string) {
    const token = window.localStorage.getItem('auth_token') ?? ''
    const response = await fetch(apiURL(`/api/invitations/${invitation.slug}/rsvps/${rsvpId}`), {
      headers: authHeaders(token),
      method: 'DELETE',
    })
    if (response.ok) {
      await loadRSVPs(invitation.slug)
    }
  }

  function exportRSVPs() {
    const token = window.localStorage.getItem('auth_token') ?? ''
    const url = apiURL(`/api/invitations/${invitation.slug}/rsvps/export`)
    const xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'blob'
    xhr.onload = () => {
      const objectUrl = URL.createObjectURL(xhr.response as Blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.setAttribute('download', `${invitation.slug}-rsvps.csv`)
      link.click()
      URL.revokeObjectURL(objectUrl)
    }
    xhr.send()
  }

  function fieldValue(field: EditorField) {
    if (field.key === 'gallery') {
      return (form.config?.gallery ?? []).join('\n')
    }
    if (field.target === 'top') {
      return (form[field.key as keyof UpdateInvitationInput] as string | undefined) ?? ''
    }
    return (form.config?.[field.key as keyof InvitationConfig] as string | undefined) ?? ''
  }

  function setField(field: EditorField, value: string) {
    if (field.key === 'gallery') {
      updateConfig('gallery', value.split('\n').map((item) => item.trim()).filter(Boolean))
      return
    }
    if (field.target === 'top') {
      setForm((current) => ({ ...current, [field.key]: value }) as UpdateInvitationInput)
      return
    }
    updateConfig(field.key as keyof InvitationConfig, value)
  }

  function renderField(field: EditorField) {
    const isWide = field.wide || field.type === 'textarea'
    if (field.type === 'select') {
      return (
        <label className={isWide ? 'wide-field' : undefined} key={field.key}>
          {field.label}
          <select onChange={(event) => setField(field, event.target.value)} value={fieldValue(field)}>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      )
    }
    if (field.type === 'textarea') {
      return (
        <label className={isWide ? 'wide-field' : undefined} key={field.key}>
          {field.label}
          <textarea
            onChange={(event) => setField(field, event.target.value)}
            placeholder={field.placeholder}
            rows={3}
            value={fieldValue(field)}
          />
        </label>
      )
    }
    return (
      <label className={isWide ? 'wide-field' : undefined} key={field.key}>
        {field.label}
        <input
          onChange={(event) => setField(field, event.target.value)}
          placeholder={field.placeholder}
          type={field.type}
          value={fieldValue(field)}
        />
      </label>
    )
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadRSVPs(invitation.slug)
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [invitation.slug, loadRSVPs])

  return (
    <main className="dashboard min-screen">
      <section className="page-shell">
        <header className="dashboard-hero">
          <div>
            <a href="/dashboard">LinkUndang.</a>
            <h1>Edit Undangan</h1>
            <p>Ubah data inti sebelum masuk ke builder section yang lebih lengkap.</p>
          </div>
          <a className="button gold" href={`/u/${invitation.slug}`}>
            Preview
          </a>
        </header>

        <section className="form-card editor-card">
          <div>
            <p className="eyebrow">/{invitation.slug}</p>
            <h2>{invitation.couple}</h2>
          </div>
          <form className="invite-form editor-form" onSubmit={handleSubmit}>
            <nav className="editor-sections-nav">
              {editorSections.map((section) => (
                <button
                  className={section.id === activeSection ? 'active' : undefined}
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  type="button"
                >
                  {section.title}
                </button>
              ))}
            </nav>
            {editorSections.map((section) => (
              section.id === activeSection ? (
                <div className="editor-section active" key={section.id}>
                  <div className="editor-section-head">
                    <p className="eyebrow">{section.title}</p>
                    <p className="editor-section-desc">{section.description}</p>
                  </div>
                  {section.fields.map((field) => renderField(field))}
                  {section.events ? (
                    <div className="editor-events wide-field">
                      <div className="editor-events-head">
                        <span>Susunan acara (multi-acara)</span>
                        <button className="button secondary" onClick={addEvent} type="button">Tambah acara</button>
                      </div>
                      {(form.config?.events ?? []).length === 0 ? (
                        <p className="empty-state">Belum ada acara tambahan. Undangan memakai data Akad &amp; Resepsi utama.</p>
                      ) : null}
                      {(form.config?.events ?? []).map((item, index) => (
                        <div className="editor-event-row" key={index}>
                          <label>
                            Nama acara
                            <input onChange={(event) => updateEvent(index, 'name', event.target.value)} placeholder="Ngunduh Mantu" type="text" value={item.name} />
                          </label>
                          <label>
                            Tanggal
                            <input onChange={(event) => updateEvent(index, 'date', event.target.value)} type="date" value={item.date} />
                          </label>
                          <label>
                            Waktu
                            <input onChange={(event) => updateEvent(index, 'time', event.target.value)} placeholder="10.00 WIB" type="text" value={item.time} />
                          </label>
                          <label>
                            Venue
                            <input onChange={(event) => updateEvent(index, 'venue', event.target.value)} placeholder="Pendopo" type="text" value={item.venue} />
                          </label>
                          <label>
                            Alamat
                            <input onChange={(event) => updateEvent(index, 'address', event.target.value)} placeholder="Alamat lokasi" type="text" value={item.address} />
                          </label>
                          <label>
                            Link maps
                            <input onChange={(event) => updateEvent(index, 'mapsUrl', event.target.value)} placeholder="https://maps..." type="text" value={item.mapsUrl} />
                          </label>
                          <button className="button secondary" onClick={() => removeEvent(index)} type="button">Hapus</button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {section.story ? (
                    <div className="editor-events wide-field">
                      <div className="editor-events-head">
                        <span>Love story (timeline)</span>
                        <button className="button secondary" onClick={addStory} type="button">Tambah cerita</button>
                      </div>
                      {(form.config?.story ?? []).length === 0 ? (
                        <p className="empty-state">Belum ada love story. Tambahkan momen penting perjalanan kalian.</p>
                      ) : null}
                      {(form.config?.story ?? []).map((item, index) => (
                        <div className="editor-event-row" key={index}>
                          <label>
                            Judul momen
                            <input onChange={(event) => updateStory(index, 'title', event.target.value)} placeholder="Awal Bertemu" type="text" value={item.title} />
                          </label>
                          <label className="wide-field">
                            Cerita
                            <textarea onChange={(event) => updateStory(index, 'text', event.target.value)} placeholder="Ceritakan momen ini" rows={2} value={item.text} />
                          </label>
                          <button className="button secondary" onClick={() => removeStory(index)} type="button">Hapus</button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null
            ))}
            <button className="button primary" disabled={isUpdating} type="submit">
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {editorMessage ? <p className="form-message">{editorMessage}</p> : null}
          </form>
        </section>

        <section className="form-card editor-card">
          <div>
            <p className="eyebrow">Publish</p>
            <h2>Validasi paket dan bagikan link</h2>
          </div>
          <form className="invite-form editor-form" onSubmit={handlePublish}>
            <label>
              Custom domain
              <input
                onChange={(event) => setPublishForm({ ...publishForm, customDomain: event.target.value })}
                placeholder="undangan.domainkamu.com"
                type="text"
                value={publishForm.customDomain}
              />
            </label>
            <label>
              Hapus watermark
              <select
                onChange={(event) => setPublishForm({ ...publishForm, removeWatermark: event.target.value === 'yes' })}
                value={publishForm.removeWatermark ? 'yes' : 'no'}
              >
                <option value="no">Tidak</option>
                <option value="yes">Ya</option>
              </select>
            </label>
            <label>
              Dynamic OG
              <select
                onChange={(event) => setPublishForm({ ...publishForm, dynamicOg: event.target.value === 'yes' })}
                value={publishForm.dynamicOg ? 'yes' : 'no'}
              >
                <option value="no">Tidak</option>
                <option value="yes">Ya</option>
              </select>
            </label>
            <button className="button primary" disabled={isPublishing} type="submit">
              {isPublishing ? 'Publish...' : 'Publish Undangan'}
            </button>
            {publishMessage ? <p className="form-message">{publishMessage}</p> : null}
          </form>
        </section>

        <section className="table-card">
          <div className="table-head">
            <h2>RSVP masuk</h2>
            <div className="table-tools">
              <span>{rsvps.length} respon</span>
              <button className="button secondary" onClick={exportRSVPs} type="button">Export CSV</button>
            </div>
          </div>
          <div className="rsvp-list">
            {rsvps.length === 0 ? (
              <p className="empty-state">Belum ada RSVP untuk undangan ini.</p>
            ) : (
              rsvps.map((item) => (
                <article className="rsvp-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{readableStatus(item.status)} - {item.guests} tamu</span>
                  </div>
                  <p>{item.message || 'Tanpa ucapan'}</p>
                  <button
                    className="button secondary"
                    onClick={() => void deleteRSVP(item.id)}
                    type="button"
                  >
                    Hapus
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}
