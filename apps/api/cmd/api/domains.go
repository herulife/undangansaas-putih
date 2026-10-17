package main

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type customDomain struct {
	ID           string     `json:"id"`
	Domain       string     `json:"domain"`
	InvitationID string     `json:"invitationId,omitempty"`
	InvitationSlug string   `json:"invitationSlug,omitempty"`
	Status       string     `json:"status"`
	VerifiedAt   *time.Time `json:"verifiedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

type createDomainRequest struct {
	Domain       string `json:"domain"`
	InvitationID string `json:"invitationId"`
}

var serverIP string

func init() {
	ips, err := net.LookupHost("host.docker.internal")
	if err != nil {
		ips, _ = net.LookupHost("api")
	}
	if len(ips) > 0 {
		serverIP = ips[0]
	} else {
		serverIP = "103.107.206.10"
	}
}

func (a *app) createDomain(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload createDomainRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	domain := strings.TrimSpace(strings.ToLower(payload.Domain))
	if domain == "" {
		writeError(w, http.StatusBadRequest, errors.New("domain is required"))
		return
	}
	if strings.Contains(domain, "linkundang.web.id") || strings.Contains(domain, "demo.linkundang.web.id") {
		writeError(w, http.StatusBadRequest, errors.New("cannot use reserved domain"))
		return
	}

	var item customDomain
	err := a.db.QueryRow(r.Context(), `
		insert into custom_domains (user_id, domain, invitation_id)
		values ($1, $2, nullif($3, '')::uuid)
		returning id, domain, status, verified_at, created_at
	`, user.ID, domain, payload.InvitationID).Scan(
		&item.ID, &item.Domain, &item.Status, &item.VerifiedAt, &item.CreatedAt,
	)
	if err != nil {
		if strings.Contains(err.Error(), "unique") {
			writeError(w, http.StatusConflict, errors.New("domain already registered"))
			return
		}
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, item)
}

func (a *app) listDomains(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select cd.id, cd.domain, cd.status, cd.verified_at, cd.created_at,
			coalesce(i.id::text, '') as invitation_id,
			coalesce(i.slug, '') as invitation_slug
		from custom_domains cd
		left join invitations i on i.id = cd.invitation_id
		where cd.user_id = $1 or $2 = 'admin'
		order by cd.created_at desc
	`, user.ID, user.Role)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []customDomain{}
	for rows.Next() {
		var item customDomain
		if err := rows.Scan(&item.ID, &item.Domain, &item.Status, &item.VerifiedAt, &item.CreatedAt,
			&item.InvitationID, &item.InvitationSlug); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	writeJSON(w, items)
}

func (a *app) verifyDomain(w http.ResponseWriter, r *http.Request) {
	domainID := chi.URLParam(r, "domainId")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var domain string
	err := a.db.QueryRow(r.Context(), `
		select cd.domain
		from custom_domains cd
		where cd.id = $1::uuid
			and (cd.user_id = $2::uuid or $3 = 'admin')
	`, domainID, user.ID, user.Role).Scan(&domain)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, errors.New("domain not found"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	verified := false
	addrs, err := net.LookupHost(domain)
	if err == nil {
		for _, addr := range addrs {
			if addr == serverIP {
				verified = true
				break
			}
		}
	}

	newStatus := "failed"
	if verified {
		newStatus = "verified"
	}

	_, err = a.db.Exec(r.Context(), `
		update custom_domains
		set status = $1,
			verified_at = case when $2 then now() else null end,
			updated_at = now()
		where id = $3::uuid
	`, newStatus, verified, domainID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, map[string]any{
		"status":   newStatus,
		"domain":   domain,
		"resolved": addrs,
	})
}

func (a *app) deleteDomain(w http.ResponseWriter, r *http.Request) {
	domainID := chi.URLParam(r, "domainId")
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		delete from custom_domains
		where id = $1::uuid
			and (user_id = $2::uuid or $3 = 'admin')
	`, domainID, user.ID, user.Role)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("domain not found"))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *app) generateDomainNginxConfig(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok || user.Role != "admin" {
		writeError(w, http.StatusForbidden, errors.New("admin required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select cd.domain, i.slug
		from custom_domains cd
		join invitations i on i.id = cd.invitation_id
		where cd.status in ('verified', 'active')
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	var config strings.Builder
	config.WriteString("# Auto-generated custom domains - DO NOT EDIT MANUALLY\n")
	config.WriteString("# Generated at " + time.Now().Format(time.RFC3339) + "\n\n")

	for rows.Next() {
		var domain, slug string
		if err := rows.Scan(&domain, &slug); err != nil {
			continue
		}

		config.WriteString("server {\n")
		config.WriteString("    listen 80;\n")
		config.WriteString("    listen [::]:80;\n")
		config.WriteString("    server_name " + domain + ";\n")
		config.WriteString("    location /.well-known/acme-challenge/ {\n")
		config.WriteString("        root /var/www/certbot;\n")
		config.WriteString("    }\n")
		config.WriteString("    return 301 https://$host$request_uri;\n")
		config.WriteString("}\n\n")

		config.WriteString("server {\n")
		config.WriteString("    listen 443 ssl http2;\n")
		config.WriteString("    listen [::]:443 ssl http2;\n")
		config.WriteString("    server_name " + domain + ";\n")
		config.WriteString("    ssl_certificate /etc/ssl/cloudflare/" + domain + ".pem;\n")
		config.WriteString("    ssl_certificate_key /etc/ssl/cloudflare/" + domain + "-key.pem;\n\n")
		config.WriteString("    location / {\n")
		config.WriteString("        proxy_pass http://172.19.0.7:80;\n")
		config.WriteString("        proxy_http_version 1.1;\n")
		config.WriteString("        proxy_set_header Host $host;\n")
		config.WriteString("        proxy_set_header X-Real-IP $remote_addr;\n")
		config.WriteString("        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n")
		config.WriteString("        proxy_set_header X-Forwarded-Proto $scheme;\n")
		config.WriteString("    }\n")
		config.WriteString("    location /api/ {\n")
		config.WriteString("        proxy_pass http://172.19.0.2:8088/api/;\n")
		config.WriteString("        proxy_http_version 1.1;\n")
		config.WriteString("        proxy_set_header Host $host;\n")
		config.WriteString("        proxy_set_header X-Real-IP $remote_addr;\n")
		config.WriteString("        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n")
		config.WriteString("        proxy_set_header X-Forwarded-Proto $scheme;\n")
		config.WriteString("    }\n")
		config.WriteString("}\n\n")
	}

	w.Header().Set("Content-Type", "text/plain")
	w.Write([]byte(config.String()))
}
