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
	router.Route("/api", func(r chi.Router) {
		r.Get("/health", a.health)
		r.Post("/auth/register", a.register)
		r.Post("/auth/login", a.login)
		r.With(a.RequireAuth).Get("/auth/me", a.authMe)
		r.With(a.RequireAuth).Patch("/auth/me", a.updateProfile)
		r.With(a.RequireAuth).Patch("/auth/password", a.changePassword)
		r.Get("/templates", a.listTemplates)
		r.With(a.RequireAuth).Get("/invitations", a.listInvitations)
		r.With(a.RequireAuth).Post("/invitations", a.createInvitation)
		r.Get("/invitations/{slug}", a.getInvitation)
		r.With(a.RequireAuth).Patch("/invitations/{slug}", a.updateInvitation)
		r.With(a.RateLimit("rsvp", 3, time.Hour)).Post("/invitations/{slug}/rsvp", a.createRSVP)
		r.With(a.RequireAuth).Get("/invitations/{slug}/rsvps", a.listRSVPs)
		r.With(a.RequireAuth, a.RateLimit("ai-image", 10, time.Hour)).Post("/ai/images", a.generateImage)
		r.With(a.RequireAuth, a.RateLimit("upload", 60, time.Hour)).Post("/uploads", a.uploadMedia)
		r.Handle("/uploads/*", http.StripPrefix("/api/uploads/", http.FileServer(http.Dir(uploadDir()))))

		r.Group(func(r chi.Router) {
			r.Use(a.RequireAdmin)
			r.Get("/admin/users", a.listAdminUsers)
			r.Post("/admin/users", a.createAdminUser)
			r.Patch("/admin/users/{id}", a.updateAdminUser)
			r.Patch("/admin/users/{id}/password", a.resetAdminUserPassword)
			r.Post("/admin/payments/manual", a.createManualPayment)
			r.Post("/admin/templates", a.createAdminTemplate)
			r.Patch("/admin/templates/{id}", a.updateAdminTemplate)
		})
	})

	router.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", a.health)
		r.Get("/templates", a.listTemplates)
		r.With(a.RateLimit("event", 120, time.Minute)).Post("/events", a.trackEvent)
		r.Get("/og/{slug}.svg", a.dynamicOGSVG)

		r.Group(func(r chi.Router) {
			r.Use(a.RequireAuth)
			r.Get("/me/features", a.meFeatures)
			r.Put("/invitations/{slug}/publish", a.publishInvitation)
			r.With(a.RequireTier([]string{featureExportCSV})).Get("/exports/invitations.csv", a.exportInvitationsCSV)
		})
	})

	return router
}
