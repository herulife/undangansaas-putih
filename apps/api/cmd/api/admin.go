package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

func (a *app) auditFromRequest(r *http.Request, action, targetType, targetID string, metadata map[string]any) {
	user, _ := currentUserFromContext(r.Context())
	a.recordAudit(r.Context(), user, action, targetType, targetID, metadata, requestClientKey(r))
}

func (a *app) recordAudit(ctx context.Context, user *authUser, action, targetType, targetID string, metadata map[string]any, ip string) {	var payload []byte
	if metadata != nil {
		if encoded, err := json.Marshal(metadata); err == nil {
			payload = encoded
		}
	}
	var actorID any
	var actorEmail any
	if user != nil {
		actorID = user.ID
		actorEmail = user.Email
	}
	_, _ = a.db.Exec(ctx, `
		insert into audit_logs (actor_id, actor_email, action, target_type, target_id, metadata, ip)
		values ($1::uuid, $2, $3, $4, $5, $6, $7)
	`, actorID, actorEmail, action, targetType, targetID, payload, ip)
}

type auditLogEntry struct {
	ID         string         `json:"id"`
	ActorEmail string         `json:"actorEmail"`
	Action     string         `json:"action"`
	TargetType string         `json:"targetType"`
	TargetID   string         `json:"targetId"`
	Metadata   map[string]any `json:"metadata"`
	IP         string         `json:"ip"`
	CreatedAt  time.Time      `json:"createdAt"`
}

func (a *app) listAuditLogs(w http.ResponseWriter, r *http.Request) {
	limit := 100
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	rows, err := a.db.Query(r.Context(), `
		select id::text, coalesce(actor_email, ''), action,
			coalesce(target_type, ''), coalesce(target_id, ''), metadata, coalesce(ip, ''), created_at
		from audit_logs
		order by created_at desc
		limit $1
	`, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	logs := []auditLogEntry{}
	for rows.Next() {
		var entry auditLogEntry
		var metadata []byte
		if err := rows.Scan(&entry.ID, &entry.ActorEmail, &entry.Action, &entry.TargetType, &entry.TargetID, &metadata, &entry.IP, &entry.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		if len(metadata) > 0 {
			_ = json.Unmarshal(metadata, &entry.Metadata)
		}
		logs = append(logs, entry)
	}

	writeJSON(w, map[string]any{"logs": logs})
}

type adminOverviewResponse struct {
	TotalUsers        int   `json:"totalUsers"`
	TotalInvitations  int   `json:"totalInvitations"`
	PaidTransactions  int   `json:"paidTransactions"`
	GrossRevenueIDR   int64 `json:"grossRevenueIdr"`
	PendingManual     int   `json:"pendingManual"`
	ActiveVouchers    int   `json:"activeVouchers"`
	TotalMediaAssets  int   `json:"totalMediaAssets"`
	StorageUsedBytes  int64 `json:"storageUsedBytes"`
	UsersByTier       []tierCount `json:"usersByTier"`
}

type tierCount struct {
	Tier  string `json:"tier"`
	Count int    `json:"count"`
}

func (a *app) adminOverview(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var out adminOverviewResponse

	if err := a.db.QueryRow(ctx, `select count(*) from users`).Scan(&out.TotalUsers); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if err := a.db.QueryRow(ctx, `select count(*) from invitations where deleted_at is null`).Scan(&out.TotalInvitations); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if err := a.db.QueryRow(ctx, `
		select count(*), coalesce(sum(amount_idr), 0)
		from payments where status = 'paid'
	`).Scan(&out.PaidTransactions, &out.GrossRevenueIDR); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if err := a.db.QueryRow(ctx, `
		select count(*) from payments where status = 'pending' and provider = 'manual'
	`).Scan(&out.PendingManual); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if err := a.db.QueryRow(ctx, `
		select count(*) from vouchers where status = 'active'
	`).Scan(&out.ActiveVouchers); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if err := a.db.QueryRow(ctx, `
		select count(*), coalesce(sum(size_bytes), 0) from media_assets
	`).Scan(&out.TotalMediaAssets, &out.StorageUsedBytes); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	rows, err := a.db.Query(ctx, `select tier::text, count(*) from users group by tier order by count(*) desc`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()
	out.UsersByTier = []tierCount{}
	for rows.Next() {
		var item tierCount
		if err := rows.Scan(&item.Tier, &item.Count); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		out.UsersByTier = append(out.UsersByTier, item)
	}

	writeJSON(w, out)
}

func (a *app) listAdminMedia(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(r.Context(), `
		select m.id::text, m.file_name, m.url, m.media_type, m.provider, m.size_bytes,
			coalesce(u.email, ''), m.created_at
		from media_assets m
		left join users u on u.id = m.user_id
		order by m.created_at desc
		limit 200
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	type adminMediaItem struct {
		ID        string    `json:"id"`
		FileName  string    `json:"fileName"`
		URL       string    `json:"url"`
		MediaType string    `json:"mediaType"`
		Provider  string    `json:"provider"`
		SizeBytes int64     `json:"sizeBytes"`
		Owner     string    `json:"owner"`
		CreatedAt time.Time `json:"createdAt"`
	}

	items := []adminMediaItem{}
	var total int64
	for rows.Next() {
		var item adminMediaItem
		if err := rows.Scan(&item.ID, &item.FileName, &item.URL, &item.MediaType, &item.Provider, &item.SizeBytes, &item.Owner, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		total += item.SizeBytes
		items = append(items, item)
	}

	writeJSON(w, map[string]any{"assets": items, "totalBytes": total})
}
