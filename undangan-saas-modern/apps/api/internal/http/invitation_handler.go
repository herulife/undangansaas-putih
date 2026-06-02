package http

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"undangan-saas-modern/apps/api/internal/invitation"
)

type InvitationHandler struct {
	service *invitation.Service
}

func NewInvitationHandler(service *invitation.Service) *InvitationHandler {
	return &InvitationHandler{service: service}
}

func (h *InvitationHandler) Create(c *gin.Context) {
	var req invitation.CreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_payload"})
		return
	}

	userID := c.GetString("user_id")
	item, err := h.service.Create(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *InvitationHandler) PublicBySlug(c *gin.Context) {
	item, err := h.service.PublicBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not_found"})
		return
	}
	c.JSON(http.StatusOK, item)
}
