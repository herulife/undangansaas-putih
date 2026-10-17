package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

func buildGuestURL(slug, name, guestID string) string {
	base := strings.TrimRight(env("PUBLIC_BASE_URL", "https://linkundang.web.id"), "/")
	return fmt.Sprintf("%s/u/%s?to=%s&g=%s", base, slug, url.QueryEscape(name), guestID)
}

type guest struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Phone       string     `json:"phone"`
	Status      string     `json:"status"`
	PersonalURL string     `json:"personalUrl"`
	SentAt      *time.Time `json:"sentAt,omitempty"`
	OpenedAt    *time.Time `json:"openedAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

type createGuestRequest struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type updateGuestRequest struct {
	Name   string `json:"name"`
	Phone  string `json:"phone"`
	Status string `json:"status"`
}

func (a *app) createGuest(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload createGuestRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Name == "" {
		writeError(w, http.StatusBadRequest, errors.New("name is required"))
		return
	}

	var invitationID string
	err := a.db.QueryRow(r.Context(), `
		select id::text from invitations
		where slug = $1 and ($2 = 'admin' or user_id = $3::uuid)
	`, slug, user.Role, user.ID).Scan(&invitationID)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}

	var item guest
	err = a.db.QueryRow(r.Context(), `
		insert into guests (user_id, invitation_id, name, phone)
		values ($1, $2, $3, $4)
		returning id, name, phone, status, personal_url, sent_at, opened_at, created_at
	`, user.ID, invitationID, payload.Name, payload.Phone).Scan(
		&item.ID, &item.Name, &item.Phone, &item.Status, &item.PersonalURL,
		&item.SentAt, &item.OpenedAt, &item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	item.PersonalURL = buildGuestURL(slug, item.Name, item.ID)
	if _, err := a.db.Exec(r.Context(), `
		update guests set personal_url = $1, updated_at = now() where id = $2::uuid
	`, item.PersonalURL, item.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, item)
}

func (a *app) listGuests(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select guests.id, guests.name, guests.phone, guests.status, guests.personal_url,
			guests.sent_at, guests.opened_at, guests.created_at
		from guests
		join invitations on invitations.id = guests.invitation_id
		where invitations.slug = $1
			and ($2 = 'admin' or invitations.user_id = $3::uuid)
		order by guests.created_at desc
	`, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []guest{}
	for rows.Next() {
		var item guest
		if err := rows.Scan(&item.ID, &item.Name, &item.Phone, &item.Status, &item.PersonalURL,
			&item.SentAt, &item.OpenedAt, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	writeJSON(w, items)
}

func (a *app) updateGuest(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	guestID := chi.URLParam(r, "guestId")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload updateGuestRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	var item guest
	err := a.db.QueryRow(r.Context(), `
		update guests set
			name = coalesce(nullif($1, ''), guests.name),
			phone = coalesce(nullif($2, ''), guests.phone),
			status = coalesce(nullif($3, ''), guests.status),
			updated_at = now()
		from invitations
		where guests.id = $4::uuid
			and guests.invitation_id = invitations.id
			and invitations.slug = $5
			and ($6 = 'admin' or invitations.user_id = $7::uuid)
		returning guests.id, guests.name, guests.phone, guests.status, guests.personal_url,
			guests.sent_at, guests.opened_at, guests.created_at
	`, payload.Name, payload.Phone, payload.Status, guestID, slug, user.Role, user.ID).Scan(
		&item.ID, &item.Name, &item.Phone, &item.Status, &item.PersonalURL,
		&item.SentAt, &item.OpenedAt, &item.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("guest not found"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, item)
}

func (a *app) deleteGuest(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	guestID := chi.URLParam(r, "guestId")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		delete from guests using invitations
		where guests.id = $1::uuid
			and guests.invitation_id = invitations.id
			and invitations.slug = $2
			and ($3 = 'admin' or invitations.user_id = $4::uuid)
	`, guestID, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("guest not found"))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *app) importGuestsCSV(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var invitationID string
	err := a.db.QueryRow(r.Context(), `
		select id::text from invitations
		where slug = $1 and ($2 = 'admin' or user_id = $3::uuid)
	`, slug, user.Role, user.ID).Scan(&invitationID)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("file csv diperlukan"))
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid csv format"))
		return
	}

	imported := 0
	for i, record := range records {
		if i == 0 {
			continue
		}
		if len(record) < 1 || strings.TrimSpace(record[0]) == "" {
			continue
		}
		name := strings.TrimSpace(record[0])
		phone := ""
		if len(record) > 1 {
			phone = strings.TrimSpace(record[1])
		}

		_, err := a.db.Exec(r.Context(), `
			insert into guests (user_id, invitation_id, name, phone)
			values ($1, $2, $3, $4)
			on conflict (invitation_id, phone) where phone <> '' do update
				set name = excluded.name, updated_at = now()
		`, user.ID, invitationID, name, phone)
		if err == nil {
			imported++
		}
	}

	a.backfillGuestURLs(r, invitationID, slug)

	writeJSON(w, map[string]any{
		"imported": imported,
		"total":    len(records) - 1,
	})
}

func (a *app) backfillGuestURLs(r *http.Request, invitationID, slug string) {
	rows, err := a.db.Query(r.Context(), `
		select id::text, name from guests
		where invitation_id = $1::uuid and (personal_url = '' or personal_url is null)
	`, invitationID)
	if err != nil {
		return
	}
	type pending struct{ id, name string }
	var list []pending
	for rows.Next() {
		var item pending
		if err := rows.Scan(&item.id, &item.name); err == nil {
			list = append(list, item)
		}
	}
	rows.Close()

	for _, item := range list {
		_, _ = a.db.Exec(r.Context(), `
			update guests set personal_url = $1, updated_at = now() where id = $2::uuid
		`, buildGuestURL(slug, item.name, item.id), item.id)
	}
}

func (a *app) markGuestOpened(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	guestID := chi.URLParam(r, "guestId")

	var invitationID, ownerID string
	err := a.db.QueryRow(r.Context(), `
		select invitations.id::text, coalesce(invitations.user_id::text, '')
		from invitations
		where invitations.slug = $1 and invitations.deleted_at is null
	`, slug).Scan(&invitationID, &ownerID)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}

	var guestName string
	err = a.db.QueryRow(r.Context(), `
		update guests
		set opened_at = coalesce(opened_at, now()),
			status = case when status in ('draft', 'sent') then 'opened' else status end,
			updated_at = now()
		where id = $1::uuid and invitation_id = $2::uuid
		returning name
	`, guestID, invitationID).Scan(&guestName)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("guest not found"))
		return
	}

	properties, _ := json.Marshal(map[string]string{"guestId": guestID, "guestName": guestName})
	_, _ = a.db.Exec(r.Context(), `
		insert into events (user_id, invitation_id, event_name, properties)
		values (nullif($1, '')::uuid, $2::uuid, 'guest_opened', $3::jsonb)
	`, ownerID, invitationID, string(properties))

	writeJSON(w, map[string]string{"guest": guestName, "status": "opened"})
}

func (a *app) exportGuestsCSV(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select guests.name, guests.phone, guests.status, guests.personal_url
		from guests
		join invitations on invitations.id = guests.invitation_id
		where invitations.slug = $1
			and ($2 = 'admin' or invitations.user_id = $3::uuid)
		order by guests.created_at desc
	`, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=guests.csv")
	writer := csv.NewWriter(w)
	writer.Write([]string{"name", "phone", "status", "personal_url"})

	for rows.Next() {
		var name, phone, status, url string
		if err := rows.Scan(&name, &phone, &status, &url); err != nil {
			continue
		}
		writer.Write([]string{name, phone, status, url})
	}
	writer.Flush()
}
