package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"undangan-saas-modern/apps/api/internal/auth"
)

func requestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = "req-" + auth.RandomToken(16)
		}
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

func authMiddleware(service *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := service.VerifyBearer(c.GetHeader("Authorization"))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Set("user_id", userID)
		c.Next()
	}
}
