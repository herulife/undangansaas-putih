import { apiURL } from '../../app/api'
import { buildGoogleCalendarUrl, buildMapsEmbed, combineEventDate, formatEventDate, resolveInvitationEvents, toInvitationRenderData, upsertMeta } from '../../app/format'
import type { Invitation, InvitationEvent, RSVPInput } from '../../app/types'
import { CountdownTimer } from '../../components/CountdownTimer'
import { trackEvent } from '../../analytics'
import { getTemplateForInvitationSlug, renderInvitationTemplateHtml } from '../../templateEngine'
import type { TemplateRegistryItem } from '../../templateEngine'
import { TierWatermark, useTierGate } from '../../tierGate'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'

export function PublicEventCard({
  anchorId,
  event,
  title,
}: {
  anchorId?: string
  event: InvitationEvent
  title: string
}) {
  const calendarUrl = buildGoogleCalendarUrl({
    address: event.address,
    date: event.date,
    time: event.time,
    title: `${title} - ${event.name || 'Akad & Resepsi'}`,
    venue: event.venue,
  })
  const detail = [event.time, event.venue, event.address].filter(Boolean).join(' • ')

  return (
    <div className="clone-frame" id={anchorId}>
      <span>{event.name || 'Akad & Resepsi'}</span>
      <h2>{formatEventDate(event.date)}</h2>
      {detail ? <p>{detail}</p> : null}
      {calendarUrl ? (
        <a className="button secondary" href={calendarUrl} rel="noreferrer" target="_blank">
          Simpan ke Kalender
        </a>
      ) : null}
    </div>
  )
}

export function TemplateInvitationPage({
  form,
  guestName,
  invitation,
  isSubmittingRSVP,
  onChangeForm,
  onFail,
  onSubmitRSVP,
  rsvpMessage,
  showWatermark,
  template,
}: {
  form: RSVPInput
  guestName: string
  invitation: Invitation
  isSubmittingRSVP: boolean
  onChangeForm: (form: RSVPInput) => void
  onFail: () => void
  onSubmitRSVP: (event: FormEvent<HTMLFormElement>) => void
  rsvpMessage: string
  showWatermark: boolean
  template: TemplateRegistryItem
}) {
  const [srcDoc, setSrcDoc] = useState('')
  const [rsvpOpen, setRsvpOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    renderInvitationTemplateHtml(template, toInvitationRenderData(invitation, guestName))
      .then((html) => {
        if (!isMounted) return
        setSrcDoc(html)
      })
      .catch(() => {
        if (isMounted) onFail()
      })
    return () => {
      isMounted = false
    }
  }, [guestName, invitation, onFail, template])

  return (
    <main className="template-invite-shell">
      <iframe
        className="template-invite-frame"
        srcDoc={srcDoc}
        title={`${invitation.couple} - ${template.code}`}
      />
      <button
        className="template-rsvp-fab"
        onClick={() => setRsvpOpen((open) => !open)}
        type="button"
      >
        {rsvpOpen ? 'Tutup' : 'RSVP'}
      </button>
      {rsvpOpen ? (
        <div className="template-rsvp-modal">
          <button
            aria-label="Tutup RSVP"
            className="template-rsvp-backdrop"
            onClick={() => setRsvpOpen(false)}
            type="button"
          />
          <div className="template-rsvp-dialog">
            <PublicRSVPForm
              form={form}
              isSubmittingRSVP={isSubmittingRSVP}
              onChange={onChangeForm}
              onSubmit={onSubmitRSVP}
              rsvpMessage={rsvpMessage}
            />
          </div>
        </div>
      ) : null}
      <TierWatermark className="credit" visible={showWatermark} />
    </main>
  )
}

export function PublicInvitationPage({
  invitation,
  isSubmittingRSVP,
  rsvpMessage,
  submitRSVP,
}: {
  invitation: Invitation
  isSubmittingRSVP: boolean
  rsvpMessage: string
  submitRSVP: (slug: string, input: RSVPInput) => Promise<boolean>
}) {
  const eventDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
  }).format(new Date(invitation.eventDate))
  const config = invitation.config ?? {}
  const searchParams = new URLSearchParams(window.location.search)
  const guestName = searchParams.get('to')?.trim() || 'Bapak/Ibu/Saudara/i'
  const guestId = searchParams.get('g')?.trim() || ''
  const brideName = config.bride || 'Cikita'
  const groomName = config.groom || 'Joko Suhanto'
  const venueName = config.venue || 'Gedung Serbaguna Darussunnah'
  const mapsUrl = config.mapsUrl || 'https://maps.google.com'
  const galleryImages = config.gallery && config.gallery.length > 0
    ? config.gallery
    : [1, 2, 3, 4, 5].map((item) => `/assets/templates/adat-jawa/generated/gallery-${item}.webp`)
  const storyItems = config.story && config.story.length > 0
    ? config.story
    : [
        { text: 'Pertemuan sederhana yang menjadi awal cerita panjang.', title: 'Awal Bertemu' },
        { text: 'Keluarga besar dipertemukan dalam suasana hangat dan penuh doa.', title: 'Lamaran' },
        { text: 'Dengan izin Allah, kami melangkah menuju ibadah pernikahan.', title: 'Hari Bahagia' },
      ]
  const events = resolveInvitationEvents(invitation)
  const sortedEvents = [...events].sort((a, b) => {
    const aMs = combineEventDate(a.date, a.time, 0).getTime() || 0
    const bMs = combineEventDate(b.date, b.time, 0).getTime() || 0
    return aMs - bMs
  })
  const nextEvent = sortedEvents[0]
  const primaryEvent = events[0]
  const mapsEmbed = buildMapsEmbed(
    primaryEvent?.mapsUrl || config.mapsUrl || '',
    primaryEvent?.address || config.venueAddress || '',
  )
  const [form, setForm] = useState<RSVPInput>({
    guests: 1,
    message: '',
    name: '',
    status: 'attending',
    website: '',
  })
  const [musicOn, setMusicOn] = useState(false)
  const [templateRenderFailed, setTemplateRenderFailed] = useState(false)
  const failTemplateRender = useCallback(() => setTemplateRenderFailed(true), [])
  const gate = useTierGate()
  const showWatermark = invitation.watermark ?? gate.shouldShowWatermark

  useEffect(() => {
    const title = `${invitation.title || invitation.couple} untuk ${guestName}`
    const description = `Undangan ${invitation.couple}, ${eventDate} di ${venueName}`
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:image', apiURL(`/api/v1/og/${invitation.slug}.svg`))
    trackEvent({
      eventName: 'page_view',
      invitationSlug: invitation.slug,
      properties: {
        guest: guestName,
        template: invitation.templateSlug ?? '',
      },
    })
  }, [eventDate, guestName, invitation.couple, invitation.slug, invitation.templateSlug, invitation.title, venueName])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await submitRSVP(invitation.slug, { ...form, guestId: guestId || undefined })
    if (ok) {
      setForm({
        guests: 1,
        message: '',
        name: '',
        status: 'attending',
      })
    }
  }

  useEffect(() => {
    if (!guestId) {
      return
    }
    void fetch(apiURL(`/api/v1/invitations/${invitation.slug}/guests/${guestId}/open`), {
      method: 'POST',
    }).catch(() => {
      /* tracking is best-effort */
    })
  }, [guestId, invitation.slug])

  const registryTemplate = getTemplateForInvitationSlug(invitation.templateSlug)

  if (invitation.templateSlug === 'klasik-hijau-emas') {
    return (
      <main className="classic-green-theme min-screen">
        <section className="classic-hero">
          <div className="classic-frame">
            <p className="eyebrow">Walimatul Urs</p>
            <h1>{invitation.couple}</h1>
            <span>{eventDate}</span>
            <div className="classic-divider" />
            <p>Dengan hormat kami mengundang Bapak/Ibu/Saudara/i untuk hadir.</p>
            <a className="button gold" href="#rsvp">
              Buka Undangan
            </a>
          </div>
        </section>

        <section className="classic-content">
          <article className="classic-card">
            <span>Menuju Hari Bahagia</span>
            <CountdownTimer
              className="countdown-row"
              targetDate={nextEvent?.date || invitation.eventDate}
              targetTime={nextEvent?.time || config.receptionTime || ''}
            />
          </article>
          <article className="classic-card">
            <span>Akad & Resepsi</span>
            <h2>Sabtu, {eventDate}</h2>
            <p>Detail venue, maps, dan susunan acara siap dihubungkan ke editor.</p>
          </article>
          <PublicRSVPForm
            form={form}
            isSubmittingRSVP={isSubmittingRSVP}
            onChange={setForm}
            onSubmit={handleSubmit}
            rsvpMessage={rsvpMessage}
          />
        </section>
        <TierWatermark visible={showWatermark} />
        <InviteBottomNav />
      </main>
    )
  }

  if (registryTemplate && !templateRenderFailed) {
    return (
      <TemplateInvitationPage
        form={form}
        guestName={guestName}
        invitation={invitation}
        isSubmittingRSVP={isSubmittingRSVP}
        onChangeForm={setForm}
        onFail={failTemplateRender}
        onSubmitRSVP={handleSubmit}
        rsvpMessage={rsvpMessage}
        showWatermark={showWatermark}
        template={registryTemplate}
      />
    )
  }

  return (
    <main className="clone-invite-shell">
      <button
        aria-label={musicOn ? 'Matikan musik' : 'Nyalakan musik'}
        className={`music-toggle ${musicOn ? 'is-playing' : ''}`}
        onClick={() => setMusicOn((current) => !current)}
        type="button"
      >
        {musicOn ? '||' : '♪'}
      </button>
      {config.audioUrl ? <audio autoPlay={musicOn} loop src={config.audioUrl} /> : null}

      <section className="clone-cover min-screen" id="cover">
        <div className="cover-panel cover-panel-left" />
        <div className="cover-panel cover-panel-right" />
        <div className="clone-cover-card">
          <img
            alt="Ornamen gunungan Jawa"
            className="gunungan-mark"
            src="/assets/templates/adat-jawa/generated/gunungan.webp"
          />
          <p className="clone-kicker">The Wedding Of</p>
          <h1>{invitation.couple}</h1>
          <span>Sabtu, {eventDate}</span>
          <div className="clone-recipient">
            <small>Kepada Yth.</small>
            <strong>{guestName}</strong>
          </div>
          <a className="clone-open-button" href="#detail-acara">
            Buka Undangan
          </a>
        </div>
      </section>

      <section className="clone-page">
        <div className="clone-photo-card">
          <img
            alt={`Ilustrasi mempelai ${invitation.couple}`}
            className="clone-photo"
            src="/assets/templates/adat-jawa/generated/couple-portrait.webp"
          />
          <p className="clone-kicker">{config.greeting || "Assalamu'alaikum Warahmatullahi Wabarakatuh"}</p>
          <h2>{invitation.couple}</h2>
          <p>{config.openingText || 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan putra-putri kami.'}</p>
        </div>

        {config.quotes ? (
          <div className="clone-frame" id="quotes">
            <span>Kutipan</span>
            <p>{config.quotes}</p>
          </div>
        ) : null}

        <div className="couple-grid" id="mempelai">
          <article>
            <span>Mempelai Pria</span>
            <h2>{groomName}</h2>
            <p>{config.groomParents || 'Putra dari Bapak dan Ibu keluarga besar mempelai pria.'}</p>
          </article>
          <article>
            <span>Mempelai Wanita</span>
            <h2>{brideName}</h2>
            <p>{config.brideParents || 'Putri dari Bapak dan Ibu keluarga besar mempelai wanita.'}</p>
          </article>
        </div>

        <CountdownTimer
          targetDate={nextEvent?.date || invitation.eventDate}
          targetTime={nextEvent?.time || config.receptionTime || ''}
        />

        {events.map((event, index) => (
          <PublicEventCard
            anchorId={index === 0 ? 'detail-acara' : undefined}
            event={event}
            key={`${event.name}-${index}`}
            title={invitation.title || invitation.couple}
          />
        ))}

        <div className="map-card" id="lokasi">
          <span>Lokasi</span>
          <h2>Petunjuk Arah</h2>
          {mapsEmbed ? (
            <iframe
              className="map-frame"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={mapsEmbed}
              title="Peta lokasi acara"
            />
          ) : (
            <div className="map-placeholder">
              <img alt="Ilustrasi peta lokasi acara" src="/assets/templates/adat-jawa/generated/map-illustration.webp" />
            </div>
          )}
          <a className="clone-open-button" href={mapsUrl} rel="noreferrer" target="_blank">
            Buka Google Maps
          </a>
        </div>

        {config.liveStreamUrl ? (
          <div className="clone-frame" id="live">
            <span>Live Streaming</span>
            <h2>Saksikan Momen Kami</h2>
            <p>Ikuti jalannya acara secara langsung melalui tautan berikut.</p>
            <a className="clone-open-button" href={config.liveStreamUrl} rel="noreferrer" target="_blank">
              Tonton Live Streaming
            </a>
          </div>
        ) : null}

        {config.videoUrl ? (
          <div className="clone-frame" id="video">
            <span>Video Prewedding</span>
            <h2>Cerita Kami</h2>
            <a className="clone-open-button" href={config.videoUrl} rel="noreferrer" target="_blank">
              Tonton Video
            </a>
          </div>
        ) : null}

        {config.dresscode ? (
          <div className="clone-frame" id="dresscode">
            <span>Dresscode</span>
            <h2>{config.dresscode}</h2>
            <p>{config.dresscodeNote || 'Terima kasih telah menyesuaikan pakaian dengan tema acara kami.'}</p>
          </div>
        ) : null}

        <div className="clone-gallery" id="galeri">
          {galleryImages.map((image, index) => (
            <div key={image}>
              <img
                alt={`Galeri pernikahan ${index + 1}`}
                loading="lazy"
                src={image}
              />
            </div>
          ))}
        </div>

        <div className="story-timeline" id="cerita">
          {storyItems.map((item) => (
            <article key={item.title}>
              <span>
                <img alt="" loading="lazy" src="/assets/templates/adat-jawa/story-icon.svg" />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>

        <PublicRSVPForm
          form={form}
          isSubmittingRSVP={isSubmittingRSVP}
          onChange={setForm}
          onSubmit={handleSubmit}
          rsvpMessage={rsvpMessage}
        />

        <div className="guestbook-card">
          <span>Ucapan & Doa</span>
          <h2>Buku Tamu</h2>
          <article>
            <strong>Keluarga Besar</strong>
            <p>Semoga menjadi keluarga sakinah, mawaddah, warahmah.</p>
          </article>
          <article>
            <strong>Sahabat</strong>
            <p>Selamat menempuh hidup baru, semoga bahagia selalu.</p>
          </article>
        </div>

        <div className="gift-card" id="gift">
          <span>Amplop Digital</span>
          <h2>Tanda Kasih</h2>
          <img
            alt="Ilustrasi amplop digital"
            className="gift-illustration"
            src="/assets/templates/adat-jawa/generated/gift-envelope.webp"
          />
          <p>{config.giftBank && config.giftAccount ? `${config.giftBank} - ${config.giftAccount}` : 'Fitur rekening, QR, dan kado fisik akan tersambung ke editor paket premium.'}</p>
          {config.giftQrImage ? (
            <img alt="QR kode kado digital" className="gift-qr" loading="lazy" src={config.giftQrImage} />
          ) : null}
          <button className="clone-open-button" type="button">Salin Rekening</button>
        </div>

        <div className="closing-card">
          <p>
            {config.closingText || 'Merupakan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.'}
          </p>
          <h2>{invitation.couple}</h2>
          {config.hashtag ? <span className="closing-hashtag">{config.hashtag}</span> : null}
        </div>

        <TierWatermark className="credit" visible={showWatermark} />
      </section>
      <InviteBottomNav />
    </main>
  )
}

export function PublicRSVPForm({
  form,
  isSubmittingRSVP,
  onChange,
  onSubmit,
  rsvpMessage,
}: {
  form: RSVPInput
  isSubmittingRSVP: boolean
  onChange: (form: RSVPInput) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  rsvpMessage: string
}) {
  return (
    <form className="rsvp-form" id="rsvp" onSubmit={onSubmit}>
      <h2>Konfirmasi Kehadiran</h2>
      <input
        aria-hidden="true"
        autoComplete="off"
        onChange={(event) => onChange({ ...form, website: event.target.value })}
        style={{ display: 'none' }}
        tabIndex={-1}
        type="text"
        value={form.website ?? ''}
      />
      <label>
        Nama
        <input
          onChange={(event) => onChange({ ...form, name: event.target.value })}
          placeholder="Nama Anda"
          required
          type="text"
          value={form.name}
        />
      </label>
      <label>
        Kehadiran
        <select
          onChange={(event) => onChange({ ...form, status: event.target.value })}
          value={form.status}
        >
          <option value="attending">Hadir</option>
          <option value="declined">Tidak hadir</option>
        </select>
      </label>
      <label>
        Jumlah tamu
        <input
          max="10"
          min="1"
          onChange={(event) => onChange({ ...form, guests: Number(event.target.value) })}
          type="number"
          value={form.guests}
        />
      </label>
      <label className="wide-field">
        Ucapan
        <textarea
          onChange={(event) => onChange({ ...form, message: event.target.value })}
          placeholder="Tulis ucapan singkat"
          rows={4}
          value={form.message}
        />
      </label>
      <button className="button primary" disabled={isSubmittingRSVP} type="submit">
        {isSubmittingRSVP ? 'Mengirim...' : 'Kirim RSVP'}
      </button>
      {rsvpMessage ? <p className="form-message">{rsvpMessage}</p> : null}
    </form>
  )
}

export function InviteBottomNav() {
  return (
    <nav className="invite-bottom-nav">
      <a href="#cover">Cover</a>
      <a href="#mempelai">Mempelai</a>
      <a href="#detail-acara">Acara</a>
      <a href="#galeri">Galeri</a>
      <a href="#rsvp">RSVP</a>
    </nav>
  )
}
