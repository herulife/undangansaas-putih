package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"html"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

func (a *app) createManualPayment(w http.ResponseWriter, r *http.Request) {
	var payload manualPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	tier, err := normalizeAdminTier(payload.Tier)
	if err != nil || tier == tierFree {
		writeError(w, http.StatusBadRequest, errors.New("tier must be creator, pro, or business"))
		return
	}
	if strings.TrimSpace(payload.UserID) == "" {
		writeError(w, http.StatusBadRequest, errors.New("userId is required"))
		return
	}
	if payload.AmountIDR < 0 {
		writeError(w, http.StatusBadRequest, errors.New("amountIdr must be greater than or equal to zero"))
		return
	}

	orderID := strings.TrimSpace(payload.ProviderOrderID)
	if orderID == "" {
		orderID = fmt.Sprintf("manual-%d", time.Now().UnixNano())
	}
	idempotency := paymentIdempotency("manual", orderID)
	expiresAt := tierExpiry(tier, time.Now())
	rawPayload := map[string]any{
		"source":          "admin_manual",
		"providerOrderId": orderID,
	}
	rawPayloadJSON, _ := json.Marshal(rawPayload)

	tx, err := a.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(r.Context())

	var paymentID string
	err = tx.QueryRow(r.Context(), `
		insert into payments (user_id, provider, provider_order_id, idempotency_key, tier, amount_idr, status, raw_payload, paid_at)
		values ($1::uuid, 'manual', $2, $3, $4, $5, 'paid', $6::jsonb, now())
		on conflict (provider, provider_order_id) do update
		set status = 'paid',
			tier = excluded.tier,
			amount_idr = excluded.amount_idr,
			raw_payload = excluded.raw_payload,
			paid_at = coalesce(payments.paid_at, now()),
			updated_at = now()
		returning id::text
	`, payload.UserID, orderID, idempotency, string(tier), payload.AmountIDR, string(rawPayloadJSON)).Scan(&paymentID)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("user not found or payment cannot be saved"))
		return
	}

	_, err = tx.Exec(r.Context(), `
		update users
		set tier = $2,
			tier_expires_at = $3,
			updated_at = now()
		where id = $1::uuid
	`, payload.UserID, string(tier), expiresAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, map[string]any{
		"id":            paymentID,
		"provider":      "manual",
		"providerOrder": orderID,
		"tier":          tier,
		"tierExpiresAt": expiresAt,
		"status":        "paid",
	})
}

func tierExpiry(tier tierName, now time.Time) time.Time {
	switch tier {
	case tierBusiness:
		return now.AddDate(0, 1, 0)
	default:
		return now.AddDate(1, 0, 0)
	}
}

func paymentIdempotency(provider string, orderID string) string {
	sum := sha256.Sum256([]byte(provider + ":" + orderID))
	return hex.EncodeToString(sum[:])
}

func (a *app) createAdminTemplate(w http.ResponseWriter, r *http.Request) {
	payload, ok := readTemplatePayload(w, r)
	if !ok {
		return
	}
	active := true
	if payload.IsActive != nil {
		active = *payload.IsActive
	}
	configSchema, _ := json.Marshal(payload.ConfigSchema)

	var item template
	var configSchemaRaw []byte
	err := a.db.QueryRow(r.Context(), `
		insert into templates (name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active)
		values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
		returning id, name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active, created_at, updated_at
	`, payload.Name, payload.Slug, payload.Category, string(configSchema), payload.TierAccess, payload.AssetsURL, payload.PreviewURL, active).Scan(
		&item.ID,
		&item.Name,
		&item.Slug,
		&item.Category,
		&configSchemaRaw,
		&item.TierAccess,
		&item.AssetsURL,
		&item.PreviewURL,
		&item.IsActive,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		writeError(w, http.StatusConflict, errors.New("template slug already exists or payload invalid"))
		return
	}
	_ = json.Unmarshal(configSchemaRaw, &item.ConfigSchema)

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, item)
}

func (a *app) updateAdminTemplate(w http.ResponseWriter, r *http.Request) {
	payload, ok := readTemplatePayload(w, r)
	if !ok {
		return
	}
	id := strings.TrimSpace(chi.URLParam(r, "id"))
	active := true
	if payload.IsActive != nil {
		active = *payload.IsActive
	}
	configSchema, _ := json.Marshal(payload.ConfigSchema)

	var item template
	var configSchemaRaw []byte
	err := a.db.QueryRow(r.Context(), `
		update templates
		set name = $2,
			slug = $3,
			category = $4,
			config_schema = $5::jsonb,
			tier_access = $6,
			assets_url = $7,
			preview_url = $8,
			is_active = $9,
			updated_at = now()
		where id = $1::uuid
		returning id, name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active, created_at, updated_at
	`, id, payload.Name, payload.Slug, payload.Category, string(configSchema), payload.TierAccess, payload.AssetsURL, payload.PreviewURL, active).Scan(
		&item.ID,
		&item.Name,
		&item.Slug,
		&item.Category,
		&configSchemaRaw,
		&item.TierAccess,
		&item.AssetsURL,
		&item.PreviewURL,
		&item.IsActive,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("template not found or slug already used"))
		return
	}
	_ = json.Unmarshal(configSchemaRaw, &item.ConfigSchema)

	writeJSON(w, item)
}

func readTemplatePayload(w http.ResponseWriter, r *http.Request) (adminTemplateRequest, bool) {
	var payload adminTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return payload, false
	}

	payload.Name = strings.TrimSpace(payload.Name)
	payload.Slug = normalizeSlug(payload.Slug)
	payload.Category = strings.TrimSpace(payload.Category)
	payload.AssetsURL = strings.TrimSpace(payload.AssetsURL)
	payload.PreviewURL = strings.TrimSpace(payload.PreviewURL)
	if payload.ConfigSchema == nil {
		payload.ConfigSchema = map[string]any{"type": "object"}
	}
	if len(payload.TierAccess) == 0 {
		payload.TierAccess = []string{"free", "creator", "pro", "business"}
	}
	cleanTierAccess := make([]string, 0, len(payload.TierAccess))
	for _, tier := range payload.TierAccess {
		normalized, err := normalizeAdminTier(tier)
		if err != nil {
			writeError(w, http.StatusBadRequest, errors.New("tierAccess must contain free, creator, pro, or business"))
			return payload, false
		}
		cleanTierAccess = append(cleanTierAccess, string(normalized))
	}
	payload.TierAccess = cleanTierAccess

	if payload.Name == "" {
		writeError(w, http.StatusBadRequest, errors.New("name is required"))
		return payload, false
	}
	if payload.Slug == "" {
		writeError(w, http.StatusBadRequest, errors.New("slug is required"))
		return payload, false
	}
	if payload.Category == "" {
		payload.Category = "wedding"
	}

	return payload, true
}

func (a *app) dynamicOGSVG(w http.ResponseWriter, r *http.Request) {
	slug := normalizeSlug(chi.URLParam(r, "slug"))
	var couple string
	var title string
	var templateName string
	err := a.db.QueryRow(r.Context(), `
		select invitations.couple, invitations.title, templates.name
		from invitations
		join templates on templates.id = invitations.template_id
		where invitations.slug = $1
	`, slug).Scan(&couple, &title, &templateName)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("invitation not found"))
		return
	}
	if title == "" {
		title = couple
	}

	w.Header().Set("Content-Type", "image/svg+xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=86400")
	_, _ = fmt.Fprintf(w, `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fffaf0"/>
      <stop offset="0.58" stop-color="#f3ead6"/>
      <stop offset="1" stop-color="#1f4f3a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="980" cy="80" r="260" fill="#d7a847" opacity="0.28"/>
  <circle cx="130" cy="560" r="220" fill="#277553" opacity="0.18"/>
  <rect x="86" y="74" width="1028" height="482" rx="36" fill="#fffdf7" opacity="0.88"/>
  <text x="120" y="164" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#1f7a53">Undangan Digital</text>
  <text x="120" y="292" font-family="Georgia, serif" font-size="84" font-weight="700" fill="#24382e">%s</text>
  <text x="120" y="374" font-family="Arial, sans-serif" font-size="32" fill="#6a5b42">%s</text>
  <text x="120" y="470" font-family="Arial, sans-serif" font-size="28" fill="#1f4f3a">Kepada Yth. Tamu Undangan</text>
  <text x="120" y="512" font-family="Arial, sans-serif" font-size="24" fill="#977333">undanganku</text>
</svg>`, html.EscapeString(title), html.EscapeString(templateName))
}
