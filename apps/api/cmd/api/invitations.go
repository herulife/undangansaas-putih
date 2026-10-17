package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func (a *app) listInvitations(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select invitations.id, invitations.slug, invitations.title, invitations.couple, templates.name, templates.slug,
			invitations.event_type, invitations.child_name, invitations.parents_name, invitations.host_name, invitations.organization_name, invitations.event_name,
			invitations.event_date::text, invitations.status, invitations.config, count(rsvps.id),
			case
				when invitations.watermark_enabled = false then false
				when users.tier in ('creator', 'pro', 'business')
					and (users.tier_expires_at is null or users.tier_expires_at >= now())
					then false
				else true
			end as watermark,
			invitations.created_at
		from invitations
		join templates on templates.id = invitations.template_id
		left join users on users.id = invitations.user_id
		left join rsvps on rsvps.invitation_id = invitations.id
		where ($1 = 'admin' or invitations.user_id = $2::uuid)
			and invitations.deleted_at is null
		group by invitations.id, templates.name, templates.slug, users.tier, users.tier_expires_at
		order by invitations.created_at desc
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
		if err := rows.Scan(&item.ID, &item.Slug, &item.Title, &item.Couple, &item.Template, &item.TemplateSlug,
			&item.EventType, &item.ChildName, &item.ParentsName, &item.HostName, &item.OrganizationName, &item.EventName,
			&item.EventDate, &item.Status, &config, &item.RSVPCount, &item.Watermark, &item.CreatedAt); err != nil {
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

func (a *app) createInvitation(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload createInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	payload.Slug = normalizeSlug(payload.Slug)
	payload.TemplateSlug = normalizeSlug(payload.TemplateSlug)
	payload.Title = strings.TrimSpace(payload.Title)
	payload.Couple = strings.TrimSpace(payload.Couple)
	payload.EventType = normalizeEventType(payload.EventType)
	payload.ChildName = strings.TrimSpace(payload.ChildName)
	payload.ParentsName = strings.TrimSpace(payload.ParentsName)
	payload.HostName = strings.TrimSpace(payload.HostName)
	payload.OrganizationName = strings.TrimSpace(payload.OrganizationName)
	payload.EventName = strings.TrimSpace(payload.EventName)
	payload.EventDate = strings.TrimSpace(payload.EventDate)
	payload.Status = strings.ToLower(strings.TrimSpace(payload.Status))
	if payload.Config == nil {
		payload.Config = map[string]any{}
	}
	if payload.Status == "" {
		payload.Status = "draft"
	}

	if payload.Slug == "" {
		writeError(w, http.StatusBadRequest, errors.New("slug is required"))
		return
	}
	if err := resolveEventDisplayName(payload.EventType, &payload.Couple, payload.ChildName, payload.OrganizationName, payload.EventName); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if payload.Title == "" {
		payload.Title = payload.Couple
	}
	if payload.TemplateSlug == "" {
		writeError(w, http.StatusBadRequest, errors.New("templateSlug is required"))
		return
	}
	if _, err := time.Parse("2006-01-02", payload.EventDate); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("eventDate must use YYYY-MM-DD"))
		return
	}
	if payload.Status != "draft" && payload.Status != "published" {
		writeError(w, http.StatusBadRequest, errors.New("status must be draft or published"))
		return
	}

	config, err := json.Marshal(payload.Config)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("config must be a valid object"))
		return
	}

	var item invitation
	err = a.db.QueryRow(r.Context(), `
		with selected_template as (
			select id, name, slug
			from templates
			where slug = $6
		),
		inserted as (
			insert into invitations (template_id, slug, title, couple, event_type, child_name, parents_name, host_name, organization_name, event_name, event_date, status, config, user_id)
			select id, $1, $2, $3, $9, $10, $11, $12, $13, $14, $4, $8, $5::jsonb, $7::uuid
			from selected_template
			returning id, slug, title, couple, event_type, child_name, parents_name, host_name, organization_name, event_name, event_date, status, config, created_at
		)
		select inserted.id, inserted.slug, inserted.title, inserted.couple, selected_template.name, selected_template.slug, inserted.event_type, inserted.child_name, inserted.parents_name, inserted.host_name, inserted.organization_name, inserted.event_name, inserted.event_date::text, inserted.status, inserted.config, 0, true, inserted.created_at
		from inserted
		join selected_template on true
	`, payload.Slug, payload.Title, payload.Couple, payload.EventDate, string(config), payload.TemplateSlug, user.ID, payload.Status,
		payload.EventType, payload.ChildName, payload.ParentsName, payload.HostName, payload.OrganizationName, payload.EventName).Scan(
		&item.ID,
		&item.Slug,
		&item.Title,
		&item.Couple,
		&item.Template,
		&item.TemplateSlug,
		&item.EventType,
		&item.ChildName,
		&item.ParentsName,
		&item.HostName,
		&item.OrganizationName,
		&item.EventName,
		&item.EventDate,
		&item.Status,
		&config,
		&item.RSVPCount,
		&item.Watermark,
		&item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("template not found or slug already used"))
		return
	}
	if err := decodeConfig(config, &item); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, item)
}

// resolveEventDisplayName ensures the primary display name (couple column) is
// filled based on the event type, and validates type-specific required fields.
func resolveEventDisplayName(eventType string, couple *string, childName, organizationName, eventName string) error {
	switch normalizeEventType(eventType) {
	case eventTypeWedding:
		if *couple == "" {
			return errors.New("couple is required for wedding")
		}
	case eventTypeAqiqah, eventTypeKhitanan, eventTypeBirthday:
		if childName == "" {
			return errors.New("childName is required for " + eventType)
		}
		if *couple == "" {
			*couple = childName
		}
	case eventTypeLembaga:
		if organizationName == "" {
			return errors.New("organizationName is required for lembaga")
		}
		if *couple == "" {
			*couple = organizationName
		}
	case eventTypeSyukuran:
		if *couple == "" {
			if eventName != "" {
				*couple = eventName
			} else {
				*couple = "Syukuran"
			}
		}
	default:
		if *couple == "" && eventName != "" {
			*couple = eventName
		}
		if *couple == "" {
			return errors.New("couple is required")
		}
	}
	return nil
}

func (a *app) getInvitation(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	var item invitation
	var config []byte

	err := a.db.QueryRow(r.Context(), `
		select invitations.id, invitations.slug, invitations.title, invitations.couple, templates.name, templates.slug,
			invitations.event_type, invitations.child_name, invitations.parents_name, invitations.host_name, invitations.organization_name, invitations.event_name,
			invitations.event_date::text, invitations.status, invitations.config, count(rsvps.id),
			case
				when invitations.watermark_enabled = false then false
				when users.tier in ('creator', 'pro', 'business')
					and (users.tier_expires_at is null or users.tier_expires_at >= now())
					then false
				else true
			end as watermark,
			invitations.created_at
		from invitations
		join templates on templates.id = invitations.template_id
		left join users on users.id = invitations.user_id
		left join rsvps on rsvps.invitation_id = invitations.id
		where invitations.slug = $1
			and invitations.deleted_at is null
		group by invitations.id, templates.name, templates.slug, users.tier, users.tier_expires_at
	`, slug).Scan(&item.ID, &item.Slug, &item.Title, &item.Couple, &item.Template, &item.TemplateSlug,
		&item.EventType, &item.ChildName, &item.ParentsName, &item.HostName, &item.OrganizationName, &item.EventName,
		&item.EventDate, &item.Status, &config, &item.RSVPCount, &item.Watermark, &item.CreatedAt)

	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}
	if err := decodeConfig(config, &item); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, item)
}

func (a *app) updateInvitation(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload updateInvitationRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	payload.Couple = strings.TrimSpace(payload.Couple)
	payload.EventType = strings.ToLower(strings.TrimSpace(payload.EventType))
	payload.ChildName = strings.TrimSpace(payload.ChildName)
	payload.ParentsName = strings.TrimSpace(payload.ParentsName)
	payload.HostName = strings.TrimSpace(payload.HostName)
	payload.OrganizationName = strings.TrimSpace(payload.OrganizationName)
	payload.EventName = strings.TrimSpace(payload.EventName)
	payload.EventDate = strings.TrimSpace(payload.EventDate)
	payload.Status = strings.ToLower(strings.TrimSpace(payload.Status))
	payload.Title = strings.TrimSpace(payload.Title)
	if payload.Config == nil {
		payload.Config = map[string]any{}
	}

	// Preserve the stored event type when the client does not send one, so
	// older clients updating a non-wedding invitation do not reset it.
	if payload.EventType == "" {
		var existingType, existingChild, existingParents, existingHost, existingOrg, existingEvent string
		_ = a.db.QueryRow(r.Context(), `
			select event_type, child_name, parents_name, host_name, organization_name, event_name
			from invitations
			where slug = $1 and deleted_at is null and ($2 = 'admin' or user_id = $3::uuid)
		`, slug, user.Role, user.ID).Scan(&existingType, &existingChild, &existingParents, &existingHost, &existingOrg, &existingEvent)
		payload.EventType = existingType
		if payload.ChildName == "" {
			payload.ChildName = existingChild
		}
		if payload.ParentsName == "" {
			payload.ParentsName = existingParents
		}
		if payload.HostName == "" {
			payload.HostName = existingHost
		}
		if payload.OrganizationName == "" {
			payload.OrganizationName = existingOrg
		}
		if payload.EventName == "" {
			payload.EventName = existingEvent
		}
	}
	payload.EventType = normalizeEventType(payload.EventType)

	if err := resolveEventDisplayName(payload.EventType, &payload.Couple, payload.ChildName, payload.OrganizationName, payload.EventName); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	if payload.Title == "" {
		payload.Title = payload.Couple
	}
	if _, err := time.Parse("2006-01-02", payload.EventDate); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("eventDate must use YYYY-MM-DD"))
		return
	}
	if payload.Status != "draft" && payload.Status != "published" {
		writeError(w, http.StatusBadRequest, errors.New("status must be draft or published"))
		return
	}

	config, err := json.Marshal(payload.Config)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("config must be a valid object"))
		return
	}

	var item invitation
	err = a.db.QueryRow(r.Context(), `
		update invitations
		set title = $2,
			couple = $3,
			event_type = $9,
			child_name = $10,
			parents_name = $11,
			host_name = $12,
			organization_name = $13,
			event_name = $14,
			event_date = $4,
			status = $5,
			config = $6::jsonb,
			updated_at = now()
		where slug = $1
			and deleted_at is null
			and ($7 = 'admin' or user_id = $8::uuid)
		returning id, slug, title, couple, event_type, child_name, parents_name, host_name, organization_name, event_name, event_date::text, status, config, created_at
	`, slug, payload.Title, payload.Couple, payload.EventDate, payload.Status, string(config), user.Role, user.ID,
		payload.EventType, payload.ChildName, payload.ParentsName, payload.HostName, payload.OrganizationName, payload.EventName).Scan(
		&item.ID,
		&item.Slug,
		&item.Title,
		&item.Couple,
		&item.EventType,
		&item.ChildName,
		&item.ParentsName,
		&item.HostName,
		&item.OrganizationName,
		&item.EventName,
		&item.EventDate,
		&item.Status,
		&config,
		&item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}
	if err := decodeConfig(config, &item); err != nil {
		writeError(w, http.StatusInternalServerError, err)
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

	writeJSON(w, item)
}

func decodeConfig(raw []byte, item *invitation) error {
	item.Config = map[string]any{}
	if len(raw) == 0 {
		return nil
	}
	return json.Unmarshal(raw, &item.Config)
}
