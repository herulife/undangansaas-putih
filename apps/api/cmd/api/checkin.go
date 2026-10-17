package main

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	qrcode "github.com/skip2/go-qrcode"
)

type checkinGuest struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	Phone        string     `json:"phone"`
	Status       string     `json:"status"`
	Token        string     `json:"token"`
	PersonalURL  string     `json:"personalUrl"`
	CheckedInAt  *time.Time `json:"checkedInAt"`
	CheckinCount int        `json:"checkinCount"`
}

type checkinSummary struct {
	Total     int `json:"total"`
	CheckedIn int `json:"checkedIn"`
	Pending   int `json:"pending"`
}

type checkinFeedItem struct {
	GuestName string    `json:"guestName"`
	CreatedAt time.Time `json:"createdAt"`
}

type checkinRequest struct {
	Token   string `json:"token"`
	GuestID string `json:"guestId"`
}

type checkinGuestResult struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	CheckedInAt  *time.Time `json:"checkedInAt"`
	CheckinCount int        `json:"checkinCount"`
}

type checkinResult struct {
	Guest            checkinGuestResult `json:"guest"`
	AlreadyCheckedIn bool               `json:"alreadyCheckedIn"`
	Slug             string             `json:"slug"`
}

func publicBaseURL() string {
	return strings.TrimRight(env("PUBLIC_BASE_URL", "https://linkundang.web.id"), "/")
}

func extractCheckinToken(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}
	if idx := strings.LastIndex(raw, "/scan/"); idx >= 0 {
		return strings.Trim(raw[idx+len("/scan/"):], "/ ")
	}
	return raw
}

func (a *app) listCheckinGuests(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var invitationID, screenKey string
	err := a.db.QueryRow(r.Context(), `
		select id::text, checkin_screen_key
		from invitations
		where slug = $1 and deleted_at is null
			and ($2 = 'admin' or user_id = $3::uuid)
	`, slug, user.Role, user.ID).Scan(&invitationID, &screenKey)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select id::text, name, phone, status, checkin_token, personal_url, checked_in_at, checkin_count
		from guests
		where invitation_id = $1::uuid
		order by name
	`, invitationID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	guests := []checkinGuest{}
	summary := checkinSummary{}
	for rows.Next() {
		var item checkinGuest
		if err := rows.Scan(&item.ID, &item.Name, &item.Phone, &item.Status, &item.Token,
			&item.PersonalURL, &item.CheckedInAt, &item.CheckinCount); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		guests = append(guests, item)
		summary.Total++
		if item.CheckedInAt != nil {
			summary.CheckedIn++
		} else {
			summary.Pending++
		}
	}

	writeJSON(w, map[string]any{
		"slug":      slug,
		"screenKey": screenKey,
		"summary":   summary,
		"guests":    guests,
	})
}

func (a *app) checkinGuestQR(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	guestID := chi.URLParam(r, "guestId")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var token string
	err := a.db.QueryRow(r.Context(), `
		select guests.checkin_token
		from guests
		join invitations on invitations.id = guests.invitation_id
		where guests.id = $1::uuid and invitations.slug = $2 and invitations.deleted_at is null
			and ($3 = 'admin' or invitations.user_id = $4::uuid)
	`, guestID, slug, user.Role, user.ID).Scan(&token)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("guest not found"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	png, err := qrcode.Encode(publicBaseURL()+"/scan/"+token, qrcode.Medium, 320)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Cache-Control", "private, max-age=3600")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(png)
}

func (a *app) checkInByToken(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload checkinRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}
	token := extractCheckinToken(payload.Token)
	if token == "" {
		writeError(w, http.StatusBadRequest, errors.New("kode QR kosong"))
		return
	}

	var guestID, invitationID, slug, name, ownerID string
	err := a.db.QueryRow(r.Context(), `
		select guests.id::text, guests.invitation_id::text, invitations.slug, guests.name,
			coalesce(invitations.user_id::text, '')
		from guests
		join invitations on invitations.id = guests.invitation_id
		where guests.checkin_token = $1 and invitations.deleted_at is null
	`, token).Scan(&guestID, &invitationID, &slug, &name, &ownerID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("kode QR tidak dikenali"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if user.Role != "admin" && user.ID != ownerID {
		writeError(w, http.StatusForbidden, errors.New("bukan pemilik undangan ini"))
		return
	}

	guest, already, err := a.performCheckin(r, invitationID, guestID, name, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, checkinResult{Guest: guest, AlreadyCheckedIn: already, Slug: slug})
}

func (a *app) performCheckin(r *http.Request, invitationID, guestID, guestName, actorID string) (checkinGuestResult, bool, error) {
	var current *time.Time
	var count int
	err := a.db.QueryRow(r.Context(), `
		select checked_in_at, checkin_count from guests where id = $1::uuid
	`, guestID).Scan(&current, &count)
	if err != nil {
		return checkinGuestResult{}, false, err
	}

	result := checkinGuestResult{ID: guestID, Name: guestName, CheckedInAt: current, CheckinCount: count}
	if current != nil {
		return result, true, nil
	}

	err = a.db.QueryRow(r.Context(), `
		update guests
		set checked_in_at = now(), checkin_count = checkin_count + 1, updated_at = now()
		where id = $1::uuid
		returning checked_in_at, checkin_count
	`, guestID).Scan(&result.CheckedInAt, &result.CheckinCount)
	if err != nil {
		return checkinGuestResult{}, false, err
	}

	_, _ = a.db.Exec(r.Context(), `
		insert into checkins (invitation_id, guest_id, guest_name, source, actor_id)
		values ($1::uuid, $2::uuid, $3, 'qr', nullif($4, '')::uuid)
	`, invitationID, guestID, guestName, actorID)

	properties, _ := json.Marshal(map[string]string{"guestId": guestID, "guestName": guestName})
	_, _ = a.db.Exec(r.Context(), `
		insert into events (invitation_id, event_name, properties)
		values ($1::uuid, 'guest_checkin', $2::jsonb)
	`, invitationID, string(properties))

	return result, false, nil
}

func (a *app) resetGuestCheckin(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload checkinRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}
	if strings.TrimSpace(payload.GuestID) == "" {
		writeError(w, http.StatusBadRequest, errors.New("guestId diperlukan"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		update guests
		set checked_in_at = null, checkin_count = 0, updated_at = now()
		from invitations
		where guests.id = $1::uuid
			and guests.invitation_id = invitations.id
			and invitations.slug = $2
			and ($3 = 'admin' or invitations.user_id = $4::uuid)
	`, payload.GuestID, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("guest not found"))
		return
	}

	_, _ = a.db.Exec(r.Context(), `delete from checkins where guest_id = $1::uuid`, payload.GuestID)

	writeJSON(w, map[string]string{"status": "reset"})
}

func (a *app) checkinFeed(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	key := r.URL.Query().Get("key")

	var invitationID, screenKey string
	err := a.db.QueryRow(r.Context(), `
		select id::text, checkin_screen_key
		from invitations
		where slug = $1 and deleted_at is null
	`, slug).Scan(&invitationID, &screenKey)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if len(key) == 0 || subtle.ConstantTimeCompare([]byte(key), []byte(screenKey)) != 1 {
		writeError(w, http.StatusForbidden, errors.New("layar sapa key tidak valid"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select guest_name, created_at
		from checkins
		where invitation_id = $1::uuid and created_at >= now() - interval '6 hours'
		order by created_at desc
		limit 30
	`, invitationID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []checkinFeedItem{}
	for rows.Next() {
		var item checkinFeedItem
		if err := rows.Scan(&item.GuestName, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	writeJSON(w, items)
}
