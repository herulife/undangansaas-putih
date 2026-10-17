package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

func (a *app) createRSVP(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var payload rsvpRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}
	if payload.Name == "" {
		writeError(w, http.StatusBadRequest, errors.New("name is required"))
		return
	}
	if strings.TrimSpace(payload.Website) != "" {
		writeError(w, http.StatusBadRequest, errors.New("submission rejected"))
		return
	}
	payload.Status = strings.ToLower(strings.TrimSpace(payload.Status))
	if payload.Status != "attending" && payload.Status != "declined" && payload.Status != "pending" {
		writeError(w, http.StatusBadRequest, errors.New("status must be attending, declined, or pending"))
		return
	}
	if payload.Guests <= 0 {
		payload.Guests = 1
	}
	if payload.Guests > 10 {
		writeError(w, http.StatusBadRequest, errors.New("guests cannot exceed 10"))
		return
	}

	tx, err := a.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(r.Context())

	var invitationID string
	var owner authUser
	err = tx.QueryRow(r.Context(), `
		select invitations.id::text,
			coalesce(users.id::text, ''),
			coalesce(users.email, ''),
			coalesce(users.role, 'user'),
			coalesce(users.tier, 'free'),
			coalesce(users.status, 'active'),
			users.tier_expires_at,
			coalesce(users.is_b2b, false),
			coalesce(users.client_limit, 1)
		from invitations
		left join users on users.id = invitations.user_id
		where invitations.slug = $1
		for update of invitations
	`, slug).Scan(
		&invitationID,
		&owner.ID,
		&owner.Email,
		&owner.Role,
		&owner.Tier,
		&owner.Status,
		&owner.TierExpiresAt,
		&owner.IsB2B,
		&owner.ClientLimit,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if owner.Tier == "" {
		owner.Tier = tierFree
	}

	features := featuresForUser(&owner, time.Now()).Features
	var currentRSVPCount int
	if err := tx.QueryRow(r.Context(), `
		select count(*)::int
		from rsvps
		where invitation_id = $1
	`, invitationID).Scan(&currentRSVPCount); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if currentRSVPCount >= features.RSVPLimit {
		writeError(w, http.StatusForbidden, errors.New("rsvp limit reached for current tier"))
		return
	}

	var item rsvp
	err = tx.QueryRow(r.Context(), `
		insert into rsvps (invitation_id, name, message, status, guests, guest_id)
		values ($1, $2, $3, $4, $5, nullif($6, '')::uuid)
		returning id, name, message, status, guests, created_at
	`, invitationID, strings.TrimSpace(payload.Name), strings.TrimSpace(payload.Message), payload.Status, payload.Guests, strings.TrimSpace(payload.GuestID)).Scan(
		&item.ID,
		&item.Name,
		&item.Message,
		&item.Status,
		&item.Guests,
		&item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if owner.Email != "" {
		var ownerName string
		_ = a.db.QueryRow(r.Context(), `select coalesce(display_name, '') from users where id = $1::uuid`, owner.ID).Scan(&ownerName)
		go emailRSVPNotification(ownerName, owner.Email, item.Name, item.Status, item.Guests, item.Message, slug)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, item)
}

func (a *app) listRSVPs(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select rsvps.id, rsvps.name, rsvps.message, rsvps.status, rsvps.guests, rsvps.created_at
		from rsvps
		join invitations on invitations.id = rsvps.invitation_id
		where invitations.slug = $1
			and ($2 = 'admin' or invitations.user_id = $3::uuid)
		order by rsvps.created_at desc
	`, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []rsvp{}
	for rows.Next() {
		var item rsvp
		if err := rows.Scan(&item.ID, &item.Name, &item.Message, &item.Status, &item.Guests, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	writeJSON(w, items)
}

func (a *app) deleteRSVP(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	rsvpID := chi.URLParam(r, "rsvpId")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		delete from rsvps using invitations
		where rsvps.id = $1::uuid
			and rsvps.invitation_id = invitations.id
			and invitations.slug = $2
			and ($3 = 'admin' or invitations.user_id = $4::uuid)
	`, rsvpID, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("rsvp not found"))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *app) exportRSVPsCSV(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select rsvps.name, rsvps.status, rsvps.guests, rsvps.message, rsvps.created_at
		from rsvps
		join invitations on invitations.id = rsvps.invitation_id
		where invitations.slug = $1
			and ($2 = 'admin' or invitations.user_id = $3::uuid)
		order by rsvps.created_at desc
	`, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=rsvps.csv")
	writer := csv.NewWriter(w)
	writer.Write([]string{"name", "status", "guests", "message", "created_at"})

	for rows.Next() {
		var name, status, message string
		var guests int
		var createdAt time.Time
		if err := rows.Scan(&name, &status, &guests, &message, &createdAt); err != nil {
			continue
		}
		writer.Write([]string{name, status, strconv.Itoa(guests), message, createdAt.Format(time.RFC3339)})
	}
	writer.Flush()
}
