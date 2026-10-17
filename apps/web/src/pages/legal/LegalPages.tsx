const LAST_UPDATED = '16 Oktober 2026'

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="legal-page" style={{ maxWidth: '820px', margin: '0 auto', padding: '48px 20px' }}>
      <a href="/" style={{ color: '#1f4f3a', fontWeight: 600, textDecoration: 'none' }}>&larr; Kembali ke LinkUndang</a>
      <h1 style={{ color: '#1f4f3a', marginTop: '24px' }}>{title}</h1>
      <p style={{ color: '#888', fontSize: '14px' }}>Terakhir diperbarui: {LAST_UPDATED}</p>
      <div style={{ lineHeight: 1.7, color: '#333' }}>{children}</div>
    </main>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Syarat & Ketentuan">
      <p>
        Dengan menggunakan LinkUndang, Anda menyetujui syarat dan ketentuan berikut. Layanan ini
        ditujukan untuk pembuatan undangan digital dan pengelolaan tamu.
      </p>
      <h2>1. Akun</h2>
      <p>Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan seluruh aktivitas yang terjadi di dalamnya.</p>
      <h2>2. Konten</h2>
      <p>Anda dilarang mengunggah konten yang melanggar hukum, mengandung kebencian, atau melanggar hak pihak lain.</p>
      <h2>3. Paket Berbayar</h2>
      <p>Fitur premium diaktifkan setelah pembayaran terverifikasi dan berlaku sesuai masa aktif paket.</p>
      <h2>4. Penghentian</h2>
      <p>Kami berhak menangguhkan akun yang melanggar ketentuan ini.</p>
    </LegalLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Kebijakan Privasi">
      <p>
        Kami menghormati privasi Anda. Kebijakan ini menjelaskan bagaimana LinkUndang mengumpulkan dan
        menggunakan data.
      </p>
      <h2>Data yang dikumpulkan</h2>
      <p>Nama, email, nomor telepon, data undangan, dan data RSVP tamu yang Anda masukkan.</p>
      <h2>Penggunaan data</h2>
      <p>Data digunakan untuk menyediakan layanan, memproses pembayaran, dan mengirim notifikasi terkait undangan.</p>
      <h2>Berbagi data</h2>
      <p>Kami tidak menjual data Anda. Data dapat dibagikan kepada penyedia pembayaran (mis. Midtrans) untuk memproses transaksi.</p>
      <h2>Keamanan</h2>
      <p>Kami menerapkan langkah teknis yang wajar untuk melindungi data dari akses tidak sah.</p>
    </LegalLayout>
  )
}

export function RefundPage() {
  return (
    <LegalLayout title="Kebijakan Pengembalian Dana">
      <p>
        Kami ingin Anda puas dengan layanan LinkUndang. Berikut ketentuan pengembalian dana.
      </p>
      <h2>Kelayakan</h2>
      <p>Permohonan pengembalian dana dapat diajukan dalam 7 hari setelah pembayaran bila fitur berbayar tidak dapat digunakan karena kesalahan sistem dari pihak kami.</p>
      <h2>Pengecualian</h2>
      <p>Pengembalian dana tidak berlaku untuk paket yang sudah banyak digunakan, atau kesalahan input dari pengguna.</p>
      <h2>Cara mengajukan</h2>
      <p>Hubungi tim dukungan dengan menyertakan ID pesanan dan alasan permohonan. Kami akan menindaklanjuti dalam 3 hari kerja.</p>
    </LegalLayout>
  )
}
