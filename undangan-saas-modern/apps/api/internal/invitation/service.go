package invitation

import (
	"context"
	"errors"
	"strings"
	"time"
)

type Invitation struct {
	ID          string    `json:"id"`
	OwnerID     string    `json:"owner_id,omitempty"`
	Slug        string    `json:"slug"`
	Title       string    `json:"title"`
	CoupleName  string    `json:"couple_name"`
	EventDate   time.Time `json:"event_date"`
	Venue       string    `json:"venue"`
	Theme       string    `json:"theme"`
	IsPublished bool      `json:"is_published"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateRequest struct {
	Slug       string    `json:"slug" binding:"required"`
	Title      string    `json:"title" binding:"required"`
	CoupleName string    `json:"couple_name" binding:"required"`
	EventDate  time.Time `json:"event_date" binding:"required"`
	Venue      string    `json:"venue" binding:"required"`
	Theme      string    `json:"theme" binding:"required"`
}

type Repository interface {
	Create(ctx context.Context, item Invitation) error
	FindPublishedBySlug(ctx context.Context, slug string) (Invitation, error)
}

type Cache interface {
	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
}

type Service struct {
	repo  Repository
	cache Cache
}

func NewService(repo Repository, cache Cache) *Service {
	return &Service{repo: repo, cache: cache}
}

func (s *Service) Create(ctx context.Context, ownerID string, req CreateRequest) (Invitation, error) {
	item := Invitation{
		ID:          "inv_" + strings.ReplaceAll(time.Now().Format("20060102150405.000000"), ".", ""),
		OwnerID:     ownerID,
		Slug:        normalizeSlug(req.Slug),
		Title:       strings.TrimSpace(req.Title),
		CoupleName:  strings.TrimSpace(req.CoupleName),
		EventDate:   req.EventDate,
		Venue:       strings.TrimSpace(req.Venue),
		Theme:       strings.TrimSpace(req.Theme),
		IsPublished: false,
		CreatedAt:   time.Now().UTC(),
	}
	if item.Slug == "" {
		return Invitation{}, errors.New("slug_required")
	}
	if err := s.repo.Create(ctx, item); err != nil {
		return Invitation{}, err
	}
	return item, nil
}

func (s *Service) PublicBySlug(ctx context.Context, slug string) (Invitation, error) {
	return s.repo.FindPublishedBySlug(ctx, normalizeSlug(slug))
}

func normalizeSlug(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, " ", "-")
	return value
}
