package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

type emailPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html"`
	Text    string   `json:"text"`
}

type resendResponse struct {
	ID string `json:"id"`
}

func emailProvider() string {
	return env("EMAIL_PROVIDER", "resend")
}

func emailAPIKey() string {
	return env("EMAIL_API_KEY", "")
}

func emailFromAddress() string {
	return env("EMAIL_FROM", "LinkUndang <noreply@linkundang.web.id>")
}

func emailIsValid() bool {
	return emailAPIKey() != ""
}

func sendEmail(to []string, subject, htmlBody, textBody string) error {
	if !emailIsValid() {
		log.Printf("email not configured, skipping: to=%v subject=%s", to, subject)
		return nil
	}

	provider := emailProvider()
	switch provider {
	case "resend":
		return sendViaResend(to, subject, htmlBody, textBody)
	case "smtp":
		return sendViaSMTP(to, subject, htmlBody)
	default:
		return fmt.Errorf("unsupported email provider: %s", provider)
	}
}

func sendViaResend(to []string, subject, htmlBody, textBody string) error {
	payload := emailPayload{
		From:    emailFromAddress(),
		To:      to,
		Subject: subject,
		HTML:    htmlBody,
		Text:    textBody,
	}

	body, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+emailAPIKey())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("resend API error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend API returned %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func sendViaSMTP(to []string, subject, htmlBody string) error {
	// SMTP sending would require net/smtp
	// For now, log it
	log.Printf("SMTP not yet implemented: to=%v subject=%s", to, subject)
	return nil
}

func emailWelcome(userName, userEmail string) {
	subject := "Selamat Datang di LinkUndang!"
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1f4f3a 0%%, #d7a847 100%%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">LinkUndang</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Undangan Digital Premium</p>
  </div>
  <div style="padding: 30px; background: #fffdf7; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f4f3a;">Halo, %s!</h2>
    <p>Terima kasih sudah bergabung dengan LinkUndang. Sekarang kamu bisa membuat undangan digital profesional dalam hitungan menit.</p>
    <div style="background: #f7f1e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #583018;">Langkah Selanjutnya:</h3>
      <ol style="margin: 0; padding-left: 20px;">
        <li>Pilih template undangan favorit kamu</li>
        <li>Isi data acara, foto, dan detail undangan</li>
        <li>Preview dan publish ke link personal</li>
        <li>Bagikan ke tamu undangan</li>
      </ol>
    </div>
    <a href="https://linkundang.web.id/dashboard" style="display: inline-block; background: #1f4f3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Mulai Buat Undangan</a>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">LinkUndang - Undangan Digital Premium Indonesia</p>
  </div>
</body>
</html>`, htmlEscapeString(userName))

	text := fmt.Sprintf("Halo %s!\n\nTerima kasih sudah bergabung dengan LinkUndang.\nMulai buat undangan digital pertama kamu di https://linkundang.web.id/dashboard", userName)

	if err := sendEmail([]string{userEmail}, subject, html, text); err != nil {
		log.Printf("failed to send welcome email to %s: %v", userEmail, err)
	}
}

func emailPaymentConfirmation(userName, userEmail, tier string, amount int) {
	subject := "Pembayaran Berhasil - LinkUndang"
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1f4f3a 0%%, #d7a847 100%%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">LinkUndang</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Pembayaran Berhasil</p>
  </div>
  <div style="padding: 30px; background: #fffdf7; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f4f3a;">Pembayaran Diterima!</h2>
    <p>Halo <strong>%s</strong>,</p>
    <p>Pembayaran kamu untuk paket <strong>%s</strong> sebesar <strong>Rp %s</strong> sudah berhasil diproses.</p>
    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
      <strong style="color: #2e7d32;">Status: Aktif</strong>
      <p style="margin: 5px 0 0 0; color: #555;">Paket kamu sudah aktif. Semua fitur premium sudah bisa digunakan.</p>
    </div>
    <a href="https://linkundang.web.id/dashboard" style="display: inline-block; background: #1f4f3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Buka Dashboard</a>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">LinkUndang - Undangan Digital Premium Indonesia</p>
  </div>
</body>
</html>`, htmlEscapeString(userName), strings.ToUpper(tier), fmt.Sprintf("%d", amount))

	text := fmt.Sprintf("Halo %s!\n\nPembayaran paket %s sebesar Rp %d sudah berhasil.\nPaket sudah aktif dan bisa digunakan.", userName, strings.ToUpper(tier), amount)

	if err := sendEmail([]string{userEmail}, subject, html, text); err != nil {
		log.Printf("failed to send payment email to %s: %v", userEmail, err)
	}
}

func emailInvitationPublished(userName, userEmail, invitationTitle, invitationSlug string) {
	subject := "Undangan Sudah Dipublish!"
	link := fmt.Sprintf("https://linkundang.web.id/u/%s", invitationSlug)
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1f4f3a 0%%, #d7a847 100%%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">LinkUndang</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Undangan Sudah Siap</p>
  </div>
  <div style="padding: 30px; background: #fffdf7; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f4f3a;">Undangan Berhasil Dipublish!</h2>
    <p>Halo <strong>%s</strong>,</p>
    <p>Undangan <strong>"%s"</strong> sudah berhasil dipublish dan siap dibagikan.</p>
    <div style="background: #f7f1e7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #583018;">Link Undangan Kamu:</p>
      <a href="%s" style="color: #1f4f3a; font-size: 18px; font-weight: bold; word-break: break-all;">%s</a>
    </div>
    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #2e7d32;">Cara Membagikan:</h3>
      <ol style="margin: 0; padding-left: 20px; color: #555;">
        <li>Salin link undangan di atas</li>
        <li>Kirim ke tamu via WhatsApp atau SMS</li>
        <li>Tamu bisa membuka link di HP mereka</li>
        <li>Pantau RSVP dari dashboard</li>
      </ol>
    </div>
    <a href="%s" style="display: inline-block; background: #1f4f3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Lihat Undangan</a>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">LinkUndang - Undangan Digital Premium Indonesia</p>
  </div>
</body>
</html>`, htmlEscapeString(userName), htmlEscapeString(invitationTitle), link, link, link)

	text := fmt.Sprintf("Halo %s!\n\nUndangan \"%s\" sudah dipublish.\nLink: %s\n\nBagikan link ini ke tamu undangan kamu.", userName, invitationTitle, link)

	if err := sendEmail([]string{userEmail}, subject, html, text); err != nil {
		log.Printf("failed to send publish email to %s: %v", userEmail, err)
	}
}

func emailRSVPNotification(userName, userEmail, guestName, status string, guests int, message, invitationSlug string) {
	subject := fmt.Sprintf("RSVP Baru dari %s", guestName)
	dashboardLink := "https://linkundang.web.id/dashboard"
	statusLabel := map[string]string{
		"attending": "Hadir",
		"declined":  "Tidak hadir",
		"pending":   "Belum pasti",
	}[status]
	if statusLabel == "" {
		statusLabel = status
	}
	messageText := message
	if strings.TrimSpace(messageText) == "" {
		messageText = "(tanpa ucapan)"
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1f4f3a 0%%, #d7a847 100%%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">LinkUndang</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">RSVP Baru Masuk</p>
  </div>
  <div style="padding: 30px; background: #fffdf7; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f4f3a;">Ada RSVP Baru!</h2>
    <p>Halo <strong>%s</strong>,</p>
    <p>Undangan <strong>%s</strong> menerima RSVP baru:</p>
    <div style="background: #f7f1e7; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0;"><strong>Nama:</strong> %s</p>
      <p style="margin: 0 0 8px 0;"><strong>Status:</strong> %s</p>
      <p style="margin: 0 0 8px 0;"><strong>Jumlah tamu:</strong> %d</p>
      <p style="margin: 0;"><strong>Ucapan:</strong> %s</p>
    </div>
    <a href="%s" style="display: inline-block; background: #1f4f3a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Lihat di Dashboard</a>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">LinkUndang - Undangan Digital Premium Indonesia</p>
  </div>
</body>
</html>`, htmlEscapeString(userName), htmlEscapeString(invitationSlug), htmlEscapeString(guestName), htmlEscapeString(statusLabel), guests, htmlEscapeString(messageText), dashboardLink)

	text := fmt.Sprintf("Halo %s!\n\nRSVP baru untuk undangan %s:\nNama: %s\nStatus: %s\nJumlah tamu: %d\nUcapan: %s\n\nLihat di %s",
		userName, invitationSlug, guestName, statusLabel, guests, messageText, dashboardLink)

	if err := sendEmail([]string{userEmail}, subject, html, text); err != nil {
		log.Printf("failed to send RSVP email to %s: %v", userEmail, err)
	}
}

func emailVerifyAddress(userName, userEmail, verifyLink string) {
	subject := "Verifikasi Email - LinkUndang"
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1f4f3a 0%%, #d7a847 100%%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">LinkUndang</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Verifikasi Email</p>
  </div>
  <div style="padding: 30px; background: #fffdf7; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f4f3a;">Konfirmasi Email Kamu</h2>
    <p>Halo <strong>%s</strong>,</p>
    <p>Terima kasih sudah mendaftar di LinkUndang. Klik tombol di bawah ini untuk memverifikasi alamat email kamu.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="%s" style="display: inline-block; background: #1f4f3a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Verifikasi Email</a>
    </div>
    <p style="color: #777; font-size: 13px;">Tautan ini berlaku selama 24 jam. Jika kamu tidak merasa membuat akun, abaikan email ini.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">LinkUndang - Undangan Digital Premium Indonesia</p>
  </div>
</body>
</html>`, htmlEscapeString(userName), verifyLink)

	text := fmt.Sprintf("Halo %s!\n\nVerifikasi email kamu dengan membuka tautan berikut (berlaku 24 jam):\n%s", userName, verifyLink)

	if err := sendEmail([]string{userEmail}, subject, html, text); err != nil {
		log.Printf("failed to send verification email to %s: %v", userEmail, err)
	}
}

func emailPasswordReset(userName, userEmail, resetLink string) {
	subject := "Reset Password - LinkUndang"
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1f4f3a 0%%, #d7a847 100%%); padding: 30px; border-radius: 12px; text-align: center;">
    <h1 style="color: white; margin: 0;">LinkUndang</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Reset Password</p>
  </div>
  <div style="padding: 30px; background: #fffdf7; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <h2 style="color: #1f4f3a;">Atur Ulang Password</h2>
    <p>Halo <strong>%s</strong>,</p>
    <p>Kami menerima permintaan untuk mengatur ulang password akun kamu. Klik tombol di bawah untuk membuat password baru.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="%s" style="display: inline-block; background: #1f4f3a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset Password</a>
    </div>
    <div style="background: #fff4e5; padding: 15px; border-radius: 8px; border-left: 4px solid #f0a020;">
      <p style="margin: 0; color: #8a5a00; font-size: 13px;">Tautan ini berlaku selama 1 jam. Jika kamu tidak meminta reset password, abaikan email ini dan password kamu tidak akan berubah.</p>
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #999; font-size: 12px; text-align: center;">LinkUndang - Undangan Digital Premium Indonesia</p>
  </div>
</body>
</html>`, htmlEscapeString(userName), resetLink)

	text := fmt.Sprintf("Halo %s!\n\nReset password akun kamu dengan membuka tautan berikut (berlaku 1 jam):\n%s\n\nJika kamu tidak meminta ini, abaikan email ini.", userName, resetLink)

	if err := sendEmail([]string{userEmail}, subject, html, text); err != nil {
		log.Printf("failed to send password reset email to %s: %v", userEmail, err)
	}
}

func htmlEscapeString(s string) string {
	s = strings.ReplaceAll(s, "&", "&amp;")
	s = strings.ReplaceAll(s, "<", "&lt;")
	s = strings.ReplaceAll(s, ">", "&gt;")
	s = strings.ReplaceAll(s, `"`, "&quot;")
	return s
}
