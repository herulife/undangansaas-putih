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
)

func (a *app) meFeatures(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	writeJSON(w, featuresForUser(user, time.Now()))
}

func (a *app) exportInvitationsCSV(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select invitations.slug, invitations.couple, templates.slug, invitations.event_date::text, invitations.status, count(rsvps.id)
		from invitations
		join templates on templates.id = invitations.template_id
		left join rsvps on rsvps.invitation_id = invitations.id
		where invitations.user_id = $1
		group by invitations.id, templates.slug
		order by invitations.created_at desc
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", `attachment; filename="invitations.csv"`)

	writer := csv.NewWriter(w)
	if err := writer.Write([]string{"slug", "couple", "template_slug", "event_date", "status", "rsvp_count"}); err != nil {
		return
	}

	for rows.Next() {
		var slug string
		var couple string
		var templateSlug string
		var eventDate string
		var status string
		var rsvpCount int
		if err := rows.Scan(&slug, &couple, &templateSlug, &eventDate, &status, &rsvpCount); err != nil {
			return
		}
		if err := writer.Write([]string{slug, couple, templateSlug, eventDate, status, strconv.Itoa(rsvpCount)}); err != nil {
			return
		}
	}
	writer.Flush()
}

func (a *app) publishInvitation(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload publishInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	payload.CustomDomain = strings.ToLower(strings.TrimSpace(payload.CustomDomain))
	if payload.GalleryCount < 0 {
		payload.GalleryCount = 0
	}

	featureResponse := featuresForUser(user, time.Now())
	features := featureResponse.Features

	if payload.RemoveWatermark && features.Watermark {
		writeError(w, http.StatusForbidden, errors.New("remove watermark requires Creator tier or above"))
		return
	}
	if payload.CustomDomain != "" && !features.CustomDomain {
		writeError(w, http.StatusForbidden, errors.New("custom domain requires Pro tier or above"))
		return
	}
	if payload.DynamicOG && !features.DynamicOG {
		writeError(w, http.StatusForbidden, errors.New("dynamic og requires Pro tier or above"))
		return
	}
	if !features.UnlimitedGallery && features.MaxGallery != nil && payload.GalleryCount > *features.MaxGallery {
		writeError(w, http.StatusForbidden, errors.New("gallery count exceeds current tier limit"))
		return
	}

	slug := normalizeSlug(chi.URLParam(r, "slug"))
	watermarkEnabled := !payload.RemoveWatermark

	var item invitation
	err := a.db.QueryRow(r.Context(), `
		update invitations
		set status = 'published',
			custom_domain = nullif($3, ''),
			dynamic_og_enabled = $4,
			watermark_enabled = $5,
			published_at = coalesce(published_at, now()),
			updated_at = now()
		where slug = $1
			and user_id = $2
		returning id, slug, couple, event_date::text, status, created_at
	`, slug, user.ID, payload.CustomDomain, payload.DynamicOG, watermarkEnabled).Scan(
		&item.ID,
		&item.Slug,
		&item.Couple,
		&item.EventDate,
		&item.Status,
		&item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}

	err = a.db.QueryRow(r.Context(), `
		select templates.name, templates.slug, count(rsvps.id),
			case
				when invitations.watermark_enabled = false then false
				when users.tier in ('creator', 'pro', 'business')
					and (users.tier_expires_at is null or users.tier_expires_at >= now())
					then false
				else true
			end as watermark
		from invitations
		join templates on templates.id = invitations.template_id
		left join users on users.id = invitations.user_id
		left join rsvps on rsvps.invitation_id = invitations.id
		where invitations.id = $1
		group by invitations.id, templates.name, templates.slug, users.tier, users.tier_expires_at
	`, item.ID).Scan(&item.Template, &item.TemplateSlug, &item.RSVPCount, &item.Watermark)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	// Send publish notification email (non-blocking)
	var userName, userEmail string
	_ = a.db.QueryRow(r.Context(), `select display_name, email from users where id = $1`, user.ID).Scan(&userName, &userEmail)
	if userEmail != "" {
		go emailInvitationPublished(userName, userEmail, item.Title, item.Slug)
	}

	writeJSON(w, item)
}
