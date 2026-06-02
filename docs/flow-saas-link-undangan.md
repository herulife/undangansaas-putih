# Diagram Alir Aplikasi SaaS Link Undangan

Sumber mockup: Stitch project `2094056565527635761`.

Catatan pemisahan:
- **Aplikasi SaaS**: beranda, harga, galeri template, login WhatsApp, OTP, dashboard, editor, admin service, publish.
- **Template undangan/tamu**: output terpisah yang hanya dipakai sebagai preview atau link publik setelah undangan dipublikasikan.

```mermaid
flowchart TD
  START(["Mulai"]) --> HOME["Landing Page / Beranda<br/>Screen: Landing Page"]

  HOME --> CTA_FREE{"Aksi pengguna dari beranda"}
  CTA_FREE -->|"Buat Gratis / Build Now"| LOGIN["WhatsApp Login<br/>Masukkan nomor WA"]
  CTA_FREE -->|"Templates"| GALLERY["Template Gallery<br/>Browse dan filter template"]
  CTA_FREE -->|"Pricing / Lihat Harga"| PRICING["Pricing Section<br/>Pilih paket"]

  PRICING -->|"Mulai Gratis / Premium"| LOGIN
  PRICING -->|"Full Service"| ADMIN_ENTRY["Masuk flow Admin Service"]

  GALLERY --> TEMPLATE_DETAIL["Template Detail: Elegan-Gold<br/>Preview, fitur, harga"]
  TEMPLATE_DETAIL -->|"Pilih Template Ini"| LOGIN
  TEMPLATE_DETAIL -->|"Live Preview / Mobile View"| TEMPLATE_PREVIEW[["Preview Template Undangan<br/>Boundary: Template, bukan SaaS"]]

  LOGIN --> SEND_OTP["Kirim OTP<br/>Simulasi kode: 123456"]
  SEND_OTP --> OTP["OTP Verification"]
  OTP --> OTP_VALID{"OTP benar?"}
  OTP_VALID -->|"Tidak"| LOGIN
  OTP_VALID -->|"Ya"| METHOD["Dashboard: Method Selection<br/>Pilih metode pembuatan"]

  METHOD --> METHOD_A["Metode A: Buat Sendiri"]
  METHOD --> METHOD_B["Metode B: Minta Dibuatin Admin"]

  METHOD_A --> EVENT_FORM["Event Customization Dashboard<br/>Isi jenis acara, nama, tanggal, jam, venue"]
  EVENT_FORM --> TEMPLATE_PICK["Pilih template premium<br/>Contoh: Elegan-Gold"]
  TEMPLATE_PICK --> CUSTOMIZE["Kustomisasi undangan<br/>Font, warna, foto, musik, maps, titip kado"]
  CUSTOMIZE --> LIVE_PREVIEW[["Live Preview Template<br/>Boundary: Template, bukan SaaS"]]
  LIVE_PREVIEW --> CUSTOMIZE
  CUSTOMIZE --> PUBLISH_ACTION["Klik Publikasi Undangan"]

  METHOD_B --> ADMIN_UPLOAD["Admin Service Tracker<br/>Kirim data mentah: foto, teks, peta"]
  ADMIN_UPLOAD --> ADMIN_PROCESS["Admin memproses undangan<br/>Pilih template dan kustomisasi"]
  ADMIN_PROCESS --> ADMIN_PREVIEW["Admin mengirim preview"]
  ADMIN_PREVIEW --> REVIEW{"Pelanggan setuju?"}
  REVIEW -->|"Tidak"| REVISION["Revisi"]
  REVISION --> ADMIN_PROCESS
  REVIEW -->|"Ya"| PAYMENT["Bayar pas sudah jadi"]
  PAYMENT --> ADMIN_PUBLISH["Admin publish undangan"]
  ADMIN_PUBLISH --> PUBLISH_SUCCESS

  PUBLISH_ACTION --> PUBLISH_SUCCESS["Publish Success<br/>Link: linkundangan.com/inv/xyz"]
  PUBLISH_SUCCESS --> SHARE["Bagikan link<br/>WhatsApp, Instagram, Facebook, Email"]
  PUBLISH_SUCCESS --> DASHBOARD_BACK["Kembali ke Dashboard"]
  PUBLISH_SUCCESS --> PUBLIC_LINK[["Guest Invitation Mobile<br/>Boundary: Template publik / halaman tamu"]]

  PUBLIC_LINK --> GUEST_VIEW["Tamu membuka undangan"]
  GUEST_VIEW --> GUEST_ACTIONS{"Aksi tamu"}
  GUEST_ACTIONS -->|"RSVP"| RSVP["Konfirmasi Kehadiran"]
  GUEST_ACTIONS -->|"Buku Tamu"| GUESTBOOK["Tulis Ucapan"]
  GUEST_ACTIONS -->|"Kado Virtual"| GIFT["Titip Kado"]
  GUEST_ACTIONS -->|"Peta"| MAP["Lihat Lokasi"]
  GUEST_ACTIONS -->|"Bagikan"| GUEST_SHARE["Bagikan Undangan"]

  RSVP --> END(["Selesai"])
  GUESTBOOK --> END
  GIFT --> END
  MAP --> END
  GUEST_SHARE --> END
  SHARE --> END
```

## Screen SaaS Dari Stitch

- `Landing Page - IndoInvite`
- `WhatsApp Login - IndoInvite`
- `OTP Verification - IndoInvite`
- `Method Selection - IndoInvite Dashboard`
- `Template Gallery - IndoInvite`
- `Template Detail: Elegan-Gold - IndoInvite`
- `Event Customization - IndoInvite Dashboard`
- `Admin Service Tracker - IndoInvite`
- `Publish Success - IndoInvite`

## Screen Template / Output Terpisah

- `Guest Invitation - Link Undangan (Mobile)`
- `Guest Invitation - IndoInvite (Mobile)`

## Ringkasan Pemisahan Produk

```mermaid
flowchart LR
  subgraph SAAS["Aplikasi SaaS Link Undangan"]
    A["Marketing & Pricing"]
    B["Auth WhatsApp + OTP"]
    C["Dashboard"]
    D["Template Gallery"]
    E["Editor / Customization"]
    F["Admin Service"]
    G["Publish & Sharing"]
  end

  subgraph TEMPLATE["Template Undangan / Halaman Tamu"]
    H["Cover Undangan"]
    I["Isi Undangan"]
    J["RSVP"]
    K["Buku Tamu"]
    L["Kado Virtual"]
    M["Maps & Share"]
  end

  A --> B --> C
  C --> D --> E --> G
  C --> F --> G
  G -->|"Generate public link"| H
  H --> I --> J
  I --> K
  I --> L
  I --> M
```
