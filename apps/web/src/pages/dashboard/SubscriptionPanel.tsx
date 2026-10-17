import type { AuthUser, ManualProofInput, MidtransPaymentInput, MidtransPaymentResult, VoucherValidateResult } from '../../app/types'
import { useState } from 'react'
import type { FormEvent } from 'react'

const tierPricing = {
  creator: { amount: 39000, label: 'Creator', features: 'Tanpa watermark, gallery 15, RSVP 300' },
  pro: { amount: 79000, label: 'Pro', features: 'Custom domain, dynamic OG, analytics full' },
  business: { amount: 199000, label: 'Business', features: 'White label, API, bulk create' },
} as const

export function SubscriptionPanel({
  authUser,
  isSaving,
  onCreateMidtransPayment,
  onSubmitManualProof,
  onUploadProof,
  onValidateVoucher,
  paymentMessage,
}: {
  authUser: AuthUser | null
  isSaving: boolean
  onCreateMidtransPayment: (input: MidtransPaymentInput) => Promise<MidtransPaymentResult | null>
  onSubmitManualProof: (input: ManualProofInput) => Promise<boolean>
  onUploadProof: (file: File) => Promise<string | null>
  onValidateVoucher: (code: string, amountIdr: number) => Promise<VoucherValidateResult | null>
  paymentMessage: string
}) {
  const [selectedTier, setSelectedTier] = useState<'creator' | 'pro' | 'business'>('creator')
  const [isProcessing, setIsProcessing] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherValidateResult | null>(null)

  const [manualTier, setManualTier] = useState<'creator' | 'pro' | 'business'>('creator')
  const [note, setNote] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSubmittingManual, setIsSubmittingManual] = useState(false)

  const baseAmount = tierPricing[selectedTier].amount
  const finalAmount = appliedVoucher ? appliedVoucher.finalAmount : baseAmount

  function changeTier(tier: 'creator' | 'pro' | 'business') {
    setSelectedTier(tier)
    setAppliedVoucher(null)
  }

  async function applyVoucher() {
    if (!voucherCode.trim()) return
    const result = await onValidateVoucher(voucherCode.trim(), baseAmount)
    setAppliedVoucher(result)
  }

  async function handleMidtransPayment() {
    if (!authUser) return
    setIsProcessing(true)
    const result = await onCreateMidtransPayment({
      invitationSlug: '',
      tier: selectedTier,
      amountIdr: baseAmount,
      email: authUser.email,
      name: authUser.displayName || authUser.email,
      phone: '',
      voucherCode: appliedVoucher?.code ?? '',
    })
    if (result?.paymentUrl) {
      window.location.href = result.paymentUrl
    }
    setIsProcessing(false)
  }

  async function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!proofFile) return
    setIsSubmittingManual(true)
    const proofUrl = await onUploadProof(proofFile)
    if (proofUrl) {
      await onSubmitManualProof({
        amountIdr: tierPricing[manualTier].amount,
        note,
        proofUrl,
        tier: manualTier,
      })
      setProofFile(null)
      setNote('')
    }
    setIsSubmittingManual(false)
  }

  return (
    <section className="module-grid">
      <article className="module-card span-2">
        <p className="eyebrow">Upgrade Paket</p>
        <h2>Pilih paket yang sesuai</h2>
        <p>
          Upgrade untuk mendapatkan fitur premium: tanpa watermark, custom domain, RSVP lebih banyak, dan lainnya.
        </p>

        <div className="pricing-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
          {(['creator', 'pro', 'business'] as const).map((tier) => (
            <div
              key={tier}
              className={`pricing-card ${selectedTier === tier ? 'selected' : ''}`}
              onClick={() => changeTier(tier)}
              style={{
                border: selectedTier === tier ? '2px solid #1f4f3a' : '1px solid #ddd',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                background: selectedTier === tier ? '#f0fdf4' : 'white',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0' }}>{tierPricing[tier].label}</h3>
              <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                Rp {tierPricing[tier].amount.toLocaleString('id-ID')}
              </p>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>{tierPricing[tier].features}</p>
            </div>
          ))}
        </div>

        <div className="voucher-apply" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <input
            onChange={(event) => setVoucherCode(event.target.value.toUpperCase())}
            placeholder="Kode voucher (opsional)"
            value={voucherCode}
          />
          <button className="button secondary" onClick={applyVoucher} type="button">Pakai Voucher</button>
        </div>
        {appliedVoucher ? (
          <p className="form-message">
            {appliedVoucher.code}: -Rp {appliedVoucher.discountAmount.toLocaleString('id-ID')} → Rp {finalAmount.toLocaleString('id-ID')}
          </p>
        ) : null}

        <button
          className="button primary"
          onClick={handleMidtransPayment}
          disabled={isProcessing || isSaving}
          style={{ marginTop: '20px' }}
          type="button"
        >
          {isProcessing ? 'Memproses...' : `Bayar ${tierPricing[selectedTier].label} - Rp ${finalAmount.toLocaleString('id-ID')}`}
        </button>
        {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}
      </article>

      <article className="module-card span-2">
        <p className="eyebrow">Transfer Manual</p>
        <h2>Bayar via transfer bank</h2>
        <p>
          Transfer ke rekening resmi, lalu unggah bukti transfer. Admin akan memverifikasi dan mengaktifkan paket Anda.
        </p>
        <form className="invite-form" onSubmit={handleManualSubmit}>
          <label>
            Paket
            <select
              onChange={(event) => setManualTier(event.target.value as 'creator' | 'pro' | 'business')}
              value={manualTier}
            >
              <option value="creator">Creator - Rp39.000</option>
              <option value="pro">Pro - Rp79.000</option>
              <option value="business">Business - Rp199.000</option>
            </select>
          </label>
          <label>
            Catatan (opsional)
            <input
              onChange={(event) => setNote(event.target.value)}
              placeholder="Nama pengirim / bank"
              value={note}
            />
          </label>
          <label>
            Bukti Transfer
            <input
              accept="image/*"
              onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
              required
              type="file"
            />
          </label>
          <button className="button primary" disabled={isSubmittingManual || isSaving || !proofFile} type="submit">
            {isSubmittingManual ? 'Mengirim...' : 'Kirim Bukti Transfer'}
          </button>
          {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}
        </form>
      </article>
    </section>
  )
}

export function VoucherPanel({
  onValidateVoucher,
  paymentMessage,
}: {
  onValidateVoucher: (code: string, amountIdr: number) => Promise<VoucherValidateResult | null>
  paymentMessage: string
}) {
  const [code, setCode] = useState('')
  const [amount, setAmount] = useState(79000)
  const [result, setResult] = useState<VoucherValidateResult | null>(null)

  async function handleValidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const applied = await onValidateVoucher(code.trim(), amount)
    setResult(applied)
  }

  return (
    <section className="form-card compact-module">
      <p className="eyebrow">Voucher</p>
      <h2>Tukar Voucher</h2>
      <form className="invite-form" onSubmit={handleValidate}>
        <label className="wide-field">
          Kode voucher
          <input
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Masukkan kode voucher"
            type="text"
            value={code}
          />
        </label>
        <label>
          Nominal transaksi
          <input
            min="0"
            onChange={(event) => setAmount(Number(event.target.value))}
            type="number"
            value={amount}
          />
        </label>
        <button className="button primary" type="submit">Gunakan</button>
        {result ? (
          <p className="form-message">
            {result.code}: -Rp {result.discountAmount.toLocaleString('id-ID')} → Rp {result.finalAmount.toLocaleString('id-ID')}
          </p>
        ) : null}
        {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}
      </form>
    </section>
  )
}
