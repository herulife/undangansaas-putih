package main

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"
)

type app struct {
	db      *pgxpool.Pool
	limiter *rateLimiter
}

func newApp(db *pgxpool.Pool) *app {
	return &app{
		db:      db,
		limiter: newRateLimiter(),
	}
}

func (a *app) routes() http.Handler {
	router := chi.NewRouter()
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   envList("WEB_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"),
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	router.Get("/health", a.health)
	router.Get("/sitemap.xml", a.sitemapXML)
	router.Get("/u/{slug}", a.invitationPage)
	router.Route("/api", func(r chi.Router) {
		r.Get("/health", a.health)
		r.Post("/auth/register", a.register)
		r.Post("/auth/login", a.login)
		r.With(a.RateLimit("verify-email", 10, time.Hour)).Post("/auth/verify-email", a.verifyEmail)
		r.With(a.RateLimit("forgot-password", 5, time.Hour)).Post("/auth/forgot-password", a.forgotPassword)
		r.With(a.RateLimit("reset-password", 10, time.Hour)).Post("/auth/reset-password", a.resetPassword)
		r.With(a.RequireAuth).Get("/auth/me", a.authMe)
		r.With(a.RequireAuth).Patch("/auth/me", a.updateProfile)
		r.With(a.RequireAuth).Patch("/auth/password", a.changePassword)
		r.With(a.RequireAuth).Post("/auth/logout", a.logout)
		r.With(a.RequireAuth).Post("/auth/resend-verification", a.resendVerification)
		r.Get("/templates", a.listTemplates)
		r.With(a.RequireAuth).Get("/invitations", a.listInvitations)
		r.With(a.RequireAuth).Post("/invitations", a.createInvitation)
		r.Get("/invitations/{slug}", a.getInvitation)
		r.With(a.RequireAuth).Get("/invitations/slug-check", a.checkInvitationSlug)
		r.With(a.RequireAuth).Get("/invitations/trash", a.listTrashedInvitations)
		r.With(a.RequireAuth).Patch("/invitations/{slug}", a.updateInvitation)
		r.With(a.RequireAuth).Post("/invitations/{slug}/duplicate", a.duplicateInvitation)
		r.With(a.RequireAuth).Delete("/invitations/{slug}", a.trashInvitation)
		r.With(a.RequireAuth).Post("/invitations/{slug}/restore", a.restoreInvitation)
		r.With(a.RateLimit("rsvp", 3, time.Hour)).Post("/invitations/{slug}/rsvp", a.createRSVP)
		r.With(a.RequireAuth).Get("/invitations/{slug}/rsvps", a.listRSVPs)
		r.With(a.RequireAuth).Get("/invitations/{slug}/rsvps/export", a.exportRSVPsCSV)
		r.With(a.RequireAuth).Delete("/invitations/{slug}/rsvps/{rsvpId}", a.deleteRSVP)
		r.With(a.RequireAuth).Post("/invitations/{slug}/guests/import", a.importGuestsCSV)
		r.With(a.RequireAuth).Get("/invitations/{slug}/guests/export", a.exportGuestsCSV)
		r.With(a.RequireAuth).Post("/invitations/{slug}/guests", a.createGuest)
		r.With(a.RequireAuth).Get("/invitations/{slug}/guests", a.listGuests)
		r.With(a.RequireAuth).Patch("/invitations/{slug}/guests/{guestId}", a.updateGuest)
		r.With(a.RequireAuth).Delete("/invitations/{slug}/guests/{guestId}", a.deleteGuest)

		// Guest check-in (QR) & layar sapa
		checkinTier := a.RequireTier([]string{featureGuestCheckin})
		r.With(a.RequireAuth, checkinTier).Get("/invitations/{slug}/checkin", a.listCheckinGuests)
		r.With(a.RequireAuth, checkinTier).Get("/invitations/{slug}/checkin/qr/{guestId}", a.checkinGuestQR)
		r.With(a.RequireAuth, checkinTier).Post("/invitations/{slug}/checkin/reset", a.resetGuestCheckin)
		r.With(a.RequireAuth, checkinTier).Post("/checkin", a.checkInByToken)

		r.With(a.RequireAuth).Get("/domains", a.listDomains)
		r.With(a.RequireAuth).Post("/domains", a.createDomain)
		r.With(a.RequireAuth).Post("/domains/{domainId}/verify", a.verifyDomain)
		r.With(a.RequireAuth).Delete("/domains/{domainId}", a.deleteDomain)
		r.With(a.RequireAuth).Get("/admin/domains/nginx-config", a.generateDomainNginxConfig)
		r.With(a.RequireAuth, a.RateLimit("ai-image", 10, time.Hour)).Post("/ai/images", a.generateImage)
		r.With(a.RequireAuth, a.RateLimit("upload", 60, time.Hour)).Post("/uploads", a.uploadMedia)
		r.With(a.RequireAuth).Get("/media", a.listMedia)
		r.With(a.RequireAuth).Delete("/media/{id}", a.deleteMedia)
		r.Handle("/uploads/*", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir(uploadDir()))))

		// Midtrans payment
		r.With(a.RequireAuth).Get("/payments", a.listPayments)
		r.With(a.RequireAuth).Post("/payments/midtrans", a.createMidtransPayment)
		r.With(a.RequireAuth, a.RateLimit("manual-payment", 10, time.Hour)).Post("/payments/manual", a.submitManualPayment)
		r.With(a.RequireAuth, a.RateLimit("voucher", 30, time.Minute)).Post("/vouchers/validate", a.validateVoucher)
		r.Get("/payments/midtrans/config", a.getMidtransConfig)
		r.Post("/webhooks/midtrans", a.midtransWebhook)

		r.Group(func(r chi.Router) {
			r.Use(a.RequireAdmin)
			r.Get("/admin/users", a.listAdminUsers)
			r.Post("/admin/users", a.createAdminUser)
			r.Patch("/admin/users/{id}", a.updateAdminUser)
			r.Patch("/admin/users/{id}/password", a.resetAdminUserPassword)
			r.Post("/admin/payments/manual", a.createManualPayment)
			r.Get("/admin/payments", a.listAdminPayments)
			r.Post("/admin/payments/{paymentId}/verify", a.verifyManualPayment)
			r.Post("/admin/payments/{paymentId}/reject", a.rejectManualPayment)
			r.Get("/admin/vouchers", a.listAdminVouchers)
			r.Post("/admin/vouchers", a.createAdminVoucher)
			r.Patch("/admin/vouchers/{id}", a.updateAdminVoucher)
			r.Delete("/admin/vouchers/{id}", a.deleteAdminVoucher)
			r.Post("/admin/templates", a.createAdminTemplate)
			r.Patch("/admin/templates/{id}", a.updateAdminTemplate)
			r.Get("/admin/overview", a.adminOverview)
			r.Get("/admin/media", a.listAdminMedia)
			r.Get("/admin/audit-logs", a.listAuditLogs)
		})
	})

	router.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", a.health)
		r.Get("/templates", a.listTemplates)
		r.With(a.RateLimit("event", 120, time.Minute)).Post("/events", a.trackEvent)
		r.With(a.RateLimit("guest-open", 60, time.Minute)).Post("/invitations/{slug}/guests/{guestId}/open", a.markGuestOpened)
		r.With(a.RateLimit("checkin-feed", 240, time.Minute)).Get("/checkin/{slug}/feed", a.checkinFeed)
		r.Get("/og/{slug}.svg", a.dynamicOGSVG)

		r.Group(func(r chi.Router) {
			r.Use(a.RequireAuth)
			r.Get("/me/features", a.meFeatures)
			r.Get("/analytics/overview", a.analyticsOverview)
			r.Get("/analytics/realtime", a.analyticsRealtime)
			r.Put("/invitations/{slug}/publish", a.publishInvitation)
			r.With(a.RequireTier([]string{featureExportCSV})).Get("/exports/invitations.csv", a.exportInvitationsCSV)
		})
	})

	return router
}
