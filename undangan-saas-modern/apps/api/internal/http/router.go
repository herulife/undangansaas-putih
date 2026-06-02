package http

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"undangan-saas-modern/apps/api/internal/auth"
	"undangan-saas-modern/apps/api/internal/config"
	"undangan-saas-modern/apps/api/internal/invitation"
)

func NewRouter(cfg config.Config, authService *auth.Service, invitationService *invitation.Service) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Recovery(), requestID(), cors.New(cors.Config{
		AllowOrigins:     []string{cfg.WebOrigin},
		AllowMethods:     []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowHeaders:     []string{"Authorization", "Content-Type", "X-Request-ID"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	authHandler := NewAuthHandler(authService)
	invitationHandler := NewInvitationHandler(invitationService)

	api := router.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "service": "undangan-api"})
	})
	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)
	api.GET("/invitations/:slug", invitationHandler.PublicBySlug)

	protected := api.Group("")
	protected.Use(authMiddleware(authService))
	protected.GET("/me", authHandler.Me)
	protected.POST("/invitations", invitationHandler.Create)

	return router
}
