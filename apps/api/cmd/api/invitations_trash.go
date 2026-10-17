package main

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type slugCheckResponse struct {
	Slug      string `json:"slug"`
	Available bool   `json:"available"`
}

func (a *app) checkInvitationSlug(w http.ResponseWriter, r *http.Request) {
	if _, ok := currentUserFromContext(r.Context()); !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	slug := normalizeSlug(r.URL.Query().Get("slug"))
	if slug == "" {
		writeError(w, http.StatusBadRequest, errors.New("slug is required"))
		return
	}

	var exists bool
	if err := a.db.QueryRow(r.Context(), `
		select exists(select 1 from invitations where slug = $1)
	`, slug).Scan(&exists); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, slugCheckResponse{Slug: slug, Available: !exists})
}

func (a *app) listTrashedInvitations(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select invitations.id, invitations.slug, invitations.title, invitations.couple, templates.name, templates.slug, invitations.event_date::text, invitations.status, invitations.config, count(rsvps.id),
			true as watermark,
			invitations.created_at
		from invitations
		join templates on templates.id = invitations.template_id
		left join rsvps on rsvps.invitation_id = invitations.id
		where invitations.deleted_at is not null
			and ($1 = 'admin' or invitations.user_id = $2::uuid)
		group by invitations.id, templates.name, templates.slug
		order by invitations.deleted_at desc
	`, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []invitation{}
	for rows.Next() {
		var item invitation
		var config []byte
		if err := rows.Scan(&item.ID, &item.Slug, &item.Title, &item.Couple, &item.Template, &item.TemplateSlug, &item.EventDate, &item.Status, &config, &item.RSVPCount, &item.Watermark, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		if err := decodeConfig(config, &item); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	writeJSON(w, items)
}

func (a *app) duplicateInvitation(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var (
		templateID   string
		title        string
		couple       string
		eventDate    string
		config       []byte
		templateName string
		templateSlug string
	)
	err := a.db.QueryRow(r.Context(), `
		select invitations.template_id, invitations.title, invitations.couple, invitations.event_date::text, invitations.config, templates.name, templates.slug
		from invitations
		join templates on templates.id = invitations.template_id
		where invitations.slug = $1
			and invitations.deleted_at is null
			and ($2 = 'admin' or invitations.user_id = $3::uuid)
	`, slug, user.Role, user.ID).Scan(&templateID, &title, &couple, &eventDate, &config, &templateName, &templateSlug)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}

	newSlug, err := a.availableSlug(r, slug+"-copy")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	newTitle := strings.TrimSpace(title)
	if newTitle == "" {
		newTitle = couple
	}
	newTitle = newTitle + " (Salinan)"

	var item invitation
	var storedConfig []byte
	err = a.db.QueryRow(r.Context(), `
		insert into invitations (template_id, slug, title, couple, event_date, status, config, user_id)
		values ($1, $2, $3, $4, $5::date, 'draft', $6::jsonb, $7::uuid)
		returning id, slug, title, couple, event_date::text, status, config, created_at
	`, templateID, newSlug, newTitle, couple, eventDate, string(config), user.ID).Scan(
		&item.ID, &item.Slug, &item.Title, &item.Couple, &item.EventDate, &item.Status, &storedConfig, &item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("gagal menduplikasi undangan"))
		return
	}
	if err := decodeConfig(storedConfig, &item); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	item.Template = templateName
	item.TemplateSlug = templateSlug
	item.Watermark = true

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, item)
}

func (a *app) trashInvitation(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		update invitations
		set deleted_at = now(),
			updated_at = now()
		where slug = $1
			and deleted_at is null
			and ($2 = 'admin' or user_id = $3::uuid)
	`, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}

	writeJSON(w, map[string]string{"slug": slug, "status": "trashed"})
}

func (a *app) restoreInvitation(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		update invitations
		set deleted_at = null,
			updated_at = now()
		where slug = $1
			and deleted_at is not null
			and ($2 = 'admin' or user_id = $3::uuid)
	`, slug, user.Role, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("invitation not found in trash"))
		return
	}

	writeJSON(w, map[string]string{"slug": slug, "status": "restored"})
}

func (a *app) availableSlug(r *http.Request, base string) (string, error) {
	base = normalizeSlug(base)
	if base == "" {
		base = "undangan"
	}
	for attempt := 0; attempt < 50; attempt++ {
		candidate := base
		if attempt > 0 {
			candidate = fmt.Sprintf("%s-%d", base, attempt+1)
		}
		var exists bool
		if err := a.db.QueryRow(r.Context(), `
			select exists(select 1 from invitations where slug = $1)
		`, candidate).Scan(&exists); err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", errors.New("tidak dapat menemukan slug yang tersedia")
}
