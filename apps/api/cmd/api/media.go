package main

import (
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type mediaAsset struct {
	ID        string    `json:"id"`
	FileName  string    `json:"fileName"`
	URL       string    `json:"url"`
	MediaType string    `json:"mediaType"`
	Provider  string    `json:"provider"`
	SizeBytes int64     `json:"sizeBytes"`
	CreatedAt time.Time `json:"createdAt"`
}

func (a *app) listMedia(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	mediaType := strings.TrimSpace(r.URL.Query().Get("type"))

	rows, err := a.db.Query(r.Context(), `
		select id::text, file_name, url, media_type, provider, size_bytes, created_at
		from media_assets
		where user_id = $1::uuid
			and ($2 = '' or media_type = $2)
		order by created_at desc
		limit 200
	`, user.ID, mediaType)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []mediaAsset{}
	for rows.Next() {
		var item mediaAsset
		if err := rows.Scan(&item.ID, &item.FileName, &item.URL, &item.MediaType, &item.Provider, &item.SizeBytes, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	var used int64
	_ = a.db.QueryRow(r.Context(), `
		select coalesce(sum(size_bytes), 0) from media_assets where user_id = $1::uuid
	`, user.ID).Scan(&used)

	features := featuresForUser(user, time.Now()).Features
	writeJSON(w, map[string]any{
		"assets":           items,
		"usedBytes":        used,
		"storageLimitBytes": features.StorageLimitBytes,
	})
}

func (a *app) deleteMedia(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}
	mediaID := chi.URLParam(r, "id")

	var url string
	err := a.db.QueryRow(r.Context(), `
		select url
		from media_assets
		where id = $1::uuid and user_id = $2::uuid
	`, mediaID, user.ID).Scan(&url)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("media not found"))
		return
	}

	tag, err := a.db.Exec(r.Context(), `
		delete from media_assets
		where id = $1::uuid and user_id = $2::uuid
	`, mediaID, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("media not found"))
		return
	}

	if rel, ok := strings.CutPrefix(url, "/api/uploads/"); ok {
		_ = os.Remove(filepath.Join(uploadDir(), filepath.FromSlash(rel)))
	}

	w.WriteHeader(http.StatusNoContent)
}
