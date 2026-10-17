import { apiURL, authHeaders } from './api'
import type { AIImageInput, AIImageResult, CreateInvitationInput, Invitation, ManualPaymentInput, ManualProofInput, MidtransPaymentInput, MidtransPaymentResult, PublishInvitationInput, RSVP, RSVPInput, Template, TemplateAdminInput, UpdateInvitationInput, VoucherValidateResult } from './types'
import { trackEvent } from '../analytics'
import { useCallback, useEffect, useState } from 'react'

export function useAPIData(token: string) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [trashedInvitations, setTrashedInvitations] = useState<Invitation[]>([])
  const [source, setSource] = useState<'api' | 'error'>('api')
  const [isDataLoading, setIsDataLoading] = useState(true)
  const [isAdminSaving, setIsAdminSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageMessage, setImageMessage] = useState('')
  const [generatedImages, setGeneratedImages] = useState<AIImageResult[]>([])
  const [formMessage, setFormMessage] = useState('')
  const [editorMessage, setEditorMessage] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [publishMessage, setPublishMessage] = useState('')
  const [templateMessage, setTemplateMessage] = useState('')
  const [rsvpsBySlug, setRSVPsBySlug] = useState<Record<string, RSVP[]>>({})
  const [rsvpMessage, setRSVPMessage] = useState('')
  const [publicInvitations, setPublicInvitations] = useState<Record<string, Invitation>>({})
  const [publicInvitationStatus, setPublicInvitationStatus] = useState<Record<string, 'error' | 'loading' | 'not-found' | 'ready'>>({})

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setIsDataLoading(true)
    try {
      const templateRequest = fetch(apiURL('/api/templates'), { signal })
      const invitationRequest = token
        ? fetch(apiURL('/api/invitations'), { headers: authHeaders(token), signal })
        : Promise.resolve(null)
      const [templateResponse, invitationResponse] = await Promise.all([
        templateRequest,
        invitationRequest,
      ])

      if (!templateResponse.ok) {
        throw new Error('API response was not ok')
      }

      const templateData = await templateResponse.json() as Template[]
      setTemplates(templateData)

      if (invitationResponse) {
        if (!invitationResponse.ok) {
          throw new Error('Invitation API response was not ok')
        }
        setInvitations(await invitationResponse.json() as Invitation[])
      } else {
        setInvitations([])
      }
      setSource('api')
    } catch {
      if (!signal?.aborted) {
        setSource('error')
      }
    } finally {
      if (!signal?.aborted) {
        setIsDataLoading(false)
      }
    }
  }, [token])

  const loadPublicInvitation = useCallback(async (slug: string) => {
    if (!slug) {
      return
    }
    setPublicInvitationStatus((current) => {
      if (current[slug] === 'loading') {
        return current
      }
      return { ...current, [slug]: 'loading' }
    })
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}`))
      if (response.status === 404) {
        setPublicInvitationStatus((current) => ({ ...current, [slug]: 'not-found' }))
        return
      }
      if (!response.ok) {
        throw new Error('Invitation API response was not ok')
      }
      const invitation = await response.json() as Invitation
      setPublicInvitations((current) => ({ ...current, [slug]: invitation }))
      setPublicInvitationStatus((current) => ({ ...current, [slug]: 'ready' }))
    } catch {
      setPublicInvitationStatus((current) => ({ ...current, [slug]: 'error' }))
    }
  }, [])

  async function createInvitation(input: CreateInvitationInput) {
    if (!token) {
      setFormMessage('Silakan login dulu untuk membuat undangan.')
      return null
    }
    setIsCreating(true)
    setFormMessage('')
    try {
      const response = await fetch(apiURL('/api/invitations'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal membuat undangan')
      }

      const createdInvitation = await response.json() as Invitation
      setInvitations((current) => [createdInvitation, ...current])
      setSource('api')
      setFormMessage('Undangan baru berhasil dibuat.')
      return createdInvitation
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Gagal membuat undangan')
      return null
    } finally {
      setIsCreating(false)
    }
  }

  async function checkSlugAvailable(slug: string) {
    const candidate = slug.trim()
    if (!token || !candidate) {
      return null
    }
    try {
      const response = await fetch(apiURL(`/api/invitations/slug-check?slug=${encodeURIComponent(candidate)}`), {
        headers: authHeaders(token),
      })
      if (!response.ok) {
        return null
      }
      const data = await response.json() as { available: boolean }
      return data.available
    } catch {
      return null
    }
  }

  async function duplicateInvitation(slug: string) {
    if (!token) {
      setFormMessage('Silakan login dulu untuk menduplikasi undangan.')
      return null
    }
    setIsCreating(true)
    setFormMessage('')
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}/duplicate`), {
        headers: authHeaders(token),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal menduplikasi undangan')
      }
      const created = await response.json() as Invitation
      setInvitations((current) => [created, ...current])
      setFormMessage(`Undangan diduplikasi menjadi /${created.slug}.`)
      return created
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Gagal menduplikasi undangan')
      return null
    } finally {
      setIsCreating(false)
    }
  }

  async function trashInvitation(slug: string) {
    if (!token) {
      setFormMessage('Silakan login dulu untuk menghapus undangan.')
      return false
    }
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}`), {
        headers: authHeaders(token),
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Gagal memindahkan undangan ke trash')
      }
      setInvitations((current) => current.filter((item) => item.slug !== slug))
      setFormMessage(`Undangan /${slug} dipindahkan ke trash.`)
      return true
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Gagal menghapus undangan')
      return false
    }
  }

  const loadTrash = useCallback(async () => {
    if (!token) {
      setTrashedInvitations([])
      return
    }
    try {
      const response = await fetch(apiURL('/api/invitations/trash'), {
        headers: authHeaders(token),
      })
      if (!response.ok) {
        throw new Error('API response was not ok')
      }
      setTrashedInvitations(await response.json() as Invitation[])
    } catch {
      setTrashedInvitations([])
    }
  }, [token])

  async function restoreInvitation(slug: string) {
    if (!token) {
      setFormMessage('Silakan login dulu untuk memulihkan undangan.')
      return false
    }
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}/restore`), {
        headers: authHeaders(token),
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Gagal memulihkan undangan')
      }
      setTrashedInvitations((current) => current.filter((item) => item.slug !== slug))
      await loadData()
      setFormMessage(`Undangan /${slug} berhasil dipulihkan.`)
      return true
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : 'Gagal memulihkan undangan')
      return false
    }
  }

  async function updateInvitation(slug: string, input: UpdateInvitationInput) {
    if (!token) {
      setEditorMessage('Silakan login dulu untuk menyimpan undangan.')
      return false
    }
    setIsUpdating(true)
    setEditorMessage('')
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}`), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'PATCH',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal menyimpan perubahan')
      }

      const updatedInvitation = await response.json() as Invitation
      setInvitations((current) =>
        current.map((item) => item.slug === updatedInvitation.slug ? updatedInvitation : item),
      )
      setEditorMessage('Perubahan undangan berhasil disimpan.')
      setSource('api')
      return true
    } catch (error) {
      setEditorMessage(error instanceof Error ? error.message : 'Gagal menyimpan perubahan')
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  async function publishInvitation(slug: string, input: PublishInvitationInput) {
    if (!token) {
      setPublishMessage('Silakan login dulu untuk publish.')
      return false
    }
    setIsPublishing(true)
    setPublishMessage('')
    try {
      const response = await fetch(apiURL(`/api/v1/invitations/${slug}/publish`), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'PUT',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal publish undangan')
      }
      const published = await response.json() as Invitation
      setInvitations((current) =>
        current.map((item) => item.slug === published.slug ? published : item),
      )
      trackEvent({
        eventName: 'publish',
        invitationSlug: slug,
        properties: { dynamicOg: input.dynamicOg, removeWatermark: input.removeWatermark },
      })
      setPublishMessage('Undangan berhasil dipublish.')
      return true
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : 'Gagal publish undangan')
      return false
    } finally {
      setIsPublishing(false)
    }
  }

  async function submitRSVP(slug: string, input: RSVPInput) {
    setIsSubmittingRSVP(true)
    setRSVPMessage('')
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}/rsvp`), {
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal mengirim RSVP')
      }

      const createdRSVP = await response.json() as RSVP
      trackEvent({
        eventName: 'rsvp_submit',
        invitationSlug: slug,
        properties: { guests: input.guests, status: input.status },
      })
      setRSVPsBySlug((current) => ({
        ...current,
        [slug]: [createdRSVP, ...(current[slug] ?? [])],
      }))
      setPublicInvitations((current) => {
        const invitation = current[slug]
        if (!invitation) return current
        return { ...current, [slug]: { ...invitation, rsvpCount: invitation.rsvpCount + 1 } }
      })
      setInvitations((current) =>
        current.map((item) => item.slug === slug ? { ...item, rsvpCount: item.rsvpCount + 1 } : item),
      )
      setRSVPMessage('Terima kasih, RSVP Anda sudah tersimpan.')
      return true
    } catch (error) {
      setRSVPMessage(error instanceof Error ? error.message : 'Gagal mengirim RSVP')
      return false
    } finally {
      setIsSubmittingRSVP(false)
    }
  }

  async function generateImage(input: AIImageInput) {
    if (!token) {
      setImageMessage('Silakan login dulu untuk generate asset.')
      return null
    }
    setIsGeneratingImage(true)
    setImageMessage('')
    try {
      const response = await fetch(apiURL('/api/ai/images'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal generate gambar')
      }

      const image = await response.json() as AIImageResult
      setGeneratedImages((current) => [image, ...current])
      setImageMessage('Gambar berhasil dibuat dan disimpan sebagai asset lokal.')
      return image
    } catch (error) {
      setImageMessage(error instanceof Error ? error.message : 'Gagal generate gambar')
      return null
    } finally {
      setIsGeneratingImage(false)
    }
  }

  async function createManualPayment(input: ManualPaymentInput) {
    if (!token) {
      setPaymentMessage('Silakan login admin dulu.')
      return false
    }
    setIsAdminSaving(true)
    setPaymentMessage('')
    try {
      const response = await fetch(apiURL('/api/admin/payments/manual'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal aktivasi payment manual')
      }
      setPaymentMessage('Payment manual berhasil dicatat dan tier user diperbarui.')
      return true
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Gagal aktivasi payment manual')
      return false
    } finally {
      setIsAdminSaving(false)
    }
  }

  async function validateVoucher(code: string, amountIdr: number): Promise<VoucherValidateResult | null> {
    if (!token) {
      setPaymentMessage('Silakan login dulu.')
      return null
    }
    setPaymentMessage('')
    try {
      const response = await fetch(apiURL('/api/vouchers/validate'), {
        body: JSON.stringify({ amountIdr, code }),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Voucher tidak valid')
      }
      const result = await response.json() as VoucherValidateResult
      setPaymentMessage(`Voucher ${result.code} diterapkan: potongan Rp ${result.discountAmount.toLocaleString('id-ID')}.`)
      return result
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Voucher tidak valid')
      return null
    }
  }

  async function submitManualProof(input: ManualProofInput): Promise<boolean> {
    if (!token) {
      setPaymentMessage('Silakan login dulu.')
      return false
    }
    setIsAdminSaving(true)
    setPaymentMessage('')
    try {
      const response = await fetch(apiURL('/api/payments/manual'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal mengirim bukti transfer')
      }
      setPaymentMessage('Bukti transfer terkirim. Menunggu verifikasi admin.')
      return true
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Gagal mengirim bukti transfer')
      return false
    } finally {
      setIsAdminSaving(false)
    }
  }

  async function uploadProof(file: File): Promise<string | null> {
    if (!token) {
      setPaymentMessage('Silakan login dulu.')
      return null
    }
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch(apiURL('/api/uploads'), {
        body,
        headers: authHeaders(token),
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Gagal mengunggah bukti transfer')
      }
      const result = await response.json() as { url?: string; mediaUrl?: string }
      return result.url ?? result.mediaUrl ?? null
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Gagal mengunggah bukti transfer')
      return null
    }
  }

  async function createMidtransPayment(input: MidtransPaymentInput): Promise<MidtransPaymentResult | null> {
    if (!token) {
      setPaymentMessage('Silakan login dulu untuk melakukan pembayaran.')
      return null
    }
    setIsAdminSaving(true)
    setPaymentMessage('')
    try {
      const response = await fetch(apiURL('/api/payments/midtrans'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal membuat pembayaran')
      }
      const result = await response.json() as MidtransPaymentResult
      setPaymentMessage('Redirect ke halaman pembayaran...')
      return result
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Gagal membuat pembayaran')
      return null
    } finally {
      setIsAdminSaving(false)
    }
  }

  async function registerTemplate(input: TemplateAdminInput) {
    if (!token) {
      setTemplateMessage('Silakan login admin dulu.')
      return false
    }
    setIsAdminSaving(true)
    setTemplateMessage('')
    try {
      const response = await fetch(apiURL('/api/admin/templates'), {
        body: JSON.stringify(input),
        headers: authHeaders(token, true),
        method: 'POST',
      })
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { error?: string } | null
        throw new Error(error?.error ?? 'Gagal register template')
      }
      const template = await response.json() as Template
      setTemplates((current) => [template, ...current])
      setTemplateMessage('Template berhasil diregister.')
      return true
    } catch (error) {
      setTemplateMessage(error instanceof Error ? error.message : 'Gagal register template')
      return false
    } finally {
      setIsAdminSaving(false)
    }
  }

  const loadRSVPs = useCallback(async (slug: string) => {
    if (!token) {
      setRSVPsBySlug((current) => ({ ...current, [slug]: current[slug] ?? [] }))
      return
    }
    try {
      const response = await fetch(apiURL(`/api/invitations/${slug}/rsvps`), {
        headers: authHeaders(token),
      })
      if (!response.ok) {
        throw new Error('API response was not ok')
      }
      const data = await response.json() as RSVP[]
      setRSVPsBySlug((current) => ({ ...current, [slug]: data }))
    } catch {
      setRSVPsBySlug((current) => ({ ...current, [slug]: current[slug] ?? [] }))
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => {
      void loadData(controller.signal)
    }, 0)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [loadData])

  return {
    checkSlugAvailable,
    createInvitation,
    createManualPayment,
    createMidtransPayment,
    duplicateInvitation,
    editorMessage,
    formMessage,
    generateImage,
    generatedImages,
    imageMessage,
    isAdminSaving,
    invitations,
    isCreating,
    isDataLoading,
    isGeneratingImage,
    isPublishing,
    isSubmittingRSVP,
    isUpdating,
    loadData,
    loadPublicInvitation,
    loadRSVPs,
    loadTrash,
    paymentMessage,
    submitManualProof,
    uploadProof,
    validateVoucher,
    publicInvitations,
    publicInvitationStatus,
    publishInvitation,
    publishMessage,
    restoreInvitation,
    rsvpMessage,
    rsvpsBySlug,
    source,
    submitRSVP,
    registerTemplate,
    templateMessage,
    templates,
    trashInvitation,
    trashedInvitations,
    updateInvitation,
  }
}
