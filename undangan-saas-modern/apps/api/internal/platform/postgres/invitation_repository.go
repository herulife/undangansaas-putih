package postgres

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"undangan-saas-modern/apps/api/internal/invitation"
)

type InvitationRepository struct {
	db *pgxpool.Pool
}

func NewInvitationRepository(db *pgxpool.Pool) *InvitationRepository {
	return &InvitationRepository{db: db}
}

func (r *InvitationRepository) Create(ctx context.Context, item invitation.Invitation) error {
	_, err := r.db.Exec(ctx, `
		insert into invitations (id, owner_id, slug, title, couple_name, event_date, venue, theme, is_published, created_at)
		values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, item.ID, item.OwnerID, item.Slug, item.Title, item.CoupleName, item.EventDate, item.Venue, item.Theme, item.IsPublished, item.CreatedAt)
	return err
}

func (r *InvitationRepository) FindPublishedBySlug(ctx context.Context, slug string) (invitation.Invitation, error) {
	var item invitation.Invitation
	err := r.db.QueryRow(ctx, `
		select id, slug, title, couple_name, event_date, venue, theme, is_published, created_at
		from invitations
		where slug = $1 and is_published = true
	`, slug).Scan(&item.ID, &item.Slug, &item.Title, &item.CoupleName, &item.EventDate, &item.Venue, &item.Theme, &item.IsPublished, &item.CreatedAt)
	return item, err
}
