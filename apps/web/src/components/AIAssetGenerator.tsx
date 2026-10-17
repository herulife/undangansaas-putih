import { apiURL } from '../app/api'
import type { AIImageInput, AIImageResult } from '../app/types'
import { useState } from 'react'
import type { FormEvent } from 'react'

export function AIAssetGenerator({
  generatedImages,
  imageMessage,
  isGeneratingImage,
  onGenerate,
}: {
  generatedImages: AIImageResult[]
  imageMessage: string
  isGeneratingImage: boolean
  onGenerate: (input: AIImageInput) => Promise<AIImageResult | null>
}) {
  const [form, setForm] = useState<AIImageInput>({
    prompt: 'Ilustrasi pasangan pengantin adat Jawa klasik, nuansa krem emas, elegan, detail ornamen batik, komposisi simetris',
    size: '1024x1024',
    style: 'premium wedding invitation asset, soft lighting, refined, no text, original artwork',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onGenerate(form)
  }

  return (
    <section className="form-card ai-generator-card">
      <div className="ai-generator-heading">
        <div>
          <p className="eyebrow">AI asset studio</p>
          <h2>Generate foto & ornamen template</h2>
        </div>
        <span>NVIDIA/Google/OpenAI</span>
      </div>

      <form className="ai-generator-form" onSubmit={handleSubmit}>
        <label className="wide-field">
          Prompt utama
          <textarea
            onChange={(event) => setForm({ ...form, prompt: event.target.value })}
            placeholder="Contoh: ornamen batik Jawa emas untuk undangan digital"
            required
            rows={4}
            value={form.prompt}
          />
        </label>
        <label>
          Gaya
          <input
            onChange={(event) => setForm({ ...form, style: event.target.value })}
            placeholder="No text, premium, soft lighting"
            type="text"
            value={form.style}
          />
        </label>
        <label>
          Ukuran
          <select
            onChange={(event) => setForm({ ...form, size: event.target.value })}
            value={form.size}
          >
            <option value="1024x1024">1024 x 1024</option>
            <option value="1024x1536">1024 x 1536</option>
            <option value="1536x1024">1536 x 1024</option>
          </select>
        </label>
        <button className="button primary" disabled={isGeneratingImage} type="submit">
          {isGeneratingImage ? 'Membuat gambar...' : 'Generate Asset'}
        </button>
        {imageMessage ? <p className="form-message">{imageMessage}</p> : null}
      </form>

      <div className="ai-result-grid">
        {generatedImages.length === 0 ? (
          <p className="empty-state">
            Hasil generate akan muncul di sini dan file-nya tersimpan di storage VPS.
          </p>
        ) : (
          generatedImages.map((image) => (
            <article className="ai-result-card" key={image.fileName}>
              <img alt={image.prompt} src={apiURL(image.url)} />
              <div>
                <strong>{image.fileName}</strong>
                <a href={apiURL(image.url)} target="_blank" rel="noreferrer">
                  Buka asset
                </a>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
