package main

import (
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/go-chi/chi/v5"
)

const shellCacheTTL = 30 * time.Second

var (
	shellCacheMu   sync.Mutex
	shellCacheBody []byte
	shellCacheAt   time.Time
)

var (
	titleTagPattern        = regexp.MustCompile(`(?is)<title[^>]*>[\s\S]*?</title>`)
	descriptionMetaPattern = regexp.MustCompile(`(?is)<meta\s+name=["']description["'][^>]*>`)
	ogMetaPattern          = regexp.MustCompile(`(?is)<meta\s+property=["']og:[^"']*["'][^>]*>`)
	twitterMetaPattern     = regexp.MustCompile(`(?is)<meta\s+name=["']twitter:[^"']*["'][^>]*>`)
)

// fetchSPAShell returns the built SPA index.html, caching it briefly. The SPA
// shell carries the hashed asset references, so we always serve the one the web
// container currently has.
func (a *app) fetchSPAShell(r *http.Request) []byte {
	shellCacheMu.Lock()
	cached := shellCacheBody
	cachedAt := shellCacheAt
	shellCacheMu.Unlock()

	if len(cached) > 0 && time.Since(cachedAt) < shellCacheTTL {
		return cached
	}

	base := strings.TrimRight(env("WEB_INTERNAL_URL", "http://linkundang-web"), "/")
	request, err := http.NewRequestWithContext(r.Context(), http.MethodGet, base+"/", nil)
	if err != nil {
		return cached
	}
	client := &http.Client{Timeout: 5 * time.Second}
	response, err := client.Do(request)
	if err != nil {
		return cached
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, 4<<20))
	if err != nil || response.StatusCode != http.StatusOK || len(body) == 0 {
		return cached
	}

	shellCacheMu.Lock()
	shellCacheBody = body
	shellCacheAt = time.Now()
	shellCacheMu.Unlock()
	return body
}

type invitationMeta struct {
	Description string
	Image       string
	Title       string
	URL         string
}

func (a *app) invitationPage(w http.ResponseWriter, r *http.Request) {
	slug := normalizeSlug(chi.URLParam(r, "slug"))
	baseURL := publicWebURL()

	shell := a.fetchSPAShell(r)
	if len(shell) == 0 {
		http.Error(w, "undangan sedang tidak tersedia", http.StatusServiceUnavailable)
		return
	}

	meta := invitationMeta{
		Description: "Undangan digital online dari LinkUndang.",
		Title:       "LinkUndang - Undangan Digital Online",
		URL:         baseURL + "/u/" + slug,
	}

	if slug != "" {
		var couple string
		var title string
		var eventDate string
		var configRaw []byte
		err := a.db.QueryRow(r.Context(), `
			select coalesce(title, ''), couple, event_date::text, config
			from invitations
			where slug = $1 and status = 'published'
		`, slug).Scan(&title, &couple, &eventDate, &configRaw)
		if err == nil {
			config := map[string]any{}
			if len(configRaw) > 0 {
				_ = json.Unmarshal(configRaw, &config)
			}
			meta = buildInvitationMeta(baseURL, slug, title, couple, eventDate, config)
		}
	}

	output := injectInvitationMeta(shell, meta)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300")
	_, _ = w.Write(output)
}

func buildInvitationMeta(baseURL, slug, title, couple, eventDateISO string, config map[string]any) invitationMeta {
	displayTitle := strings.TrimSpace(title)
	if displayTitle == "" {
		displayTitle = strings.TrimSpace(couple)
	}
	if displayTitle == "" {
		displayTitle = "Undangan Digital"
	}

	dateText := formatIndonesianDate(eventDateISO)
	venue := configString(config, "venue")

	parts := make([]string, 0, 3)
	if couple = strings.TrimSpace(couple); couple != "" {
		parts = append(parts, "Undangan "+couple)
	}
	if dateText != "" {
		parts = append(parts, dateText)
	}
	if venue != "" {
		parts = append(parts, "di "+venue)
	}
	description := strings.Join(parts, ", ")
	if description == "" {
		description = "Undangan digital online dari LinkUndang."
	}

	return invitationMeta{
		Description: description,
		Image:       invitationImageURL(baseURL, slug, config),
		Title:       displayTitle + " - Undangan Digital",
		URL:         strings.TrimRight(baseURL, "/") + "/u/" + slug,
	}
}

func invitationImageURL(baseURL, slug string, config map[string]any) string {
	if cover := configString(config, "coverImage"); cover != "" {
		return absoluteAssetURL(baseURL, cover)
	}
	if gallery := configStringSlice(config, "gallery"); len(gallery) > 0 {
		return absoluteAssetURL(baseURL, gallery[0])
	}
	return strings.TrimRight(baseURL, "/") + "/api/v1/og/" + slug + ".svg"
}

func injectInvitationMeta(shell []byte, meta invitationMeta) []byte {
	page := string(shell)
	page = titleTagPattern.ReplaceAllString(page, "")
	page = descriptionMetaPattern.ReplaceAllString(page, "")
	page = ogMetaPattern.ReplaceAllString(page, "")
	page = twitterMetaPattern.ReplaceAllString(page, "")

	var builder strings.Builder
	fmt.Fprintf(&builder, `<title>%s</title>`, html.EscapeString(meta.Title))
	fmt.Fprintf(&builder, `<meta name="description" content="%s">`, html.EscapeString(meta.Description))
	builder.WriteString(`<meta property="og:type" content="website">`)
	fmt.Fprintf(&builder, `<meta property="og:title" content="%s">`, html.EscapeString(meta.Title))
	fmt.Fprintf(&builder, `<meta property="og:description" content="%s">`, html.EscapeString(meta.Description))
	if meta.Image != "" {
		fmt.Fprintf(&builder, `<meta property="og:image" content="%s">`, html.EscapeString(meta.Image))
	}
	fmt.Fprintf(&builder, `<meta property="og:url" content="%s">`, html.EscapeString(meta.URL))
	builder.WriteString(`<meta name="twitter:card" content="summary_large_image">`)
	fmt.Fprintf(&builder, `<meta name="twitter:title" content="%s">`, html.EscapeString(meta.Title))
	fmt.Fprintf(&builder, `<meta name="twitter:description" content="%s">`, html.EscapeString(meta.Description))
	if meta.Image != "" {
		fmt.Fprintf(&builder, `<meta name="twitter:image" content="%s">`, html.EscapeString(meta.Image))
	}
	injections := builder.String()

	if index := strings.Index(page, "</head>"); index >= 0 {
		return []byte(page[:index] + injections + page[index:])
	}
	return []byte(injections + page)
}

func absoluteAssetURL(baseURL, reference string) string {
	reference = strings.TrimSpace(reference)
	if reference == "" {
		return ""
	}
	if strings.HasPrefix(reference, "http://") || strings.HasPrefix(reference, "https://") {
		return reference
	}
	if !strings.HasPrefix(reference, "/") {
		reference = "/" + reference
	}
	return strings.TrimRight(baseURL, "/") + reference
}

func configString(config map[string]any, key string) string {
	if value, ok := config[key].(string); ok {
		return strings.TrimSpace(value)
	}
	return ""
}

func configStringSlice(config map[string]any, key string) []string {
	raw, ok := config[key].([]any)
	if !ok {
		return nil
	}
	values := make([]string, 0, len(raw))
	for _, item := range raw {
		if value, ok := item.(string); ok && strings.TrimSpace(value) != "" {
			values = append(values, value)
		}
	}
	return values
}

func formatIndonesianDate(iso string) string {
	parsed, err := time.Parse("2006-01-02", strings.TrimSpace(iso))
	if err != nil {
		return strings.TrimSpace(iso)
	}
	months := [...]string{
		"Januari", "Februari", "Maret", "April", "Mei", "Juni",
		"Juli", "Agustus", "September", "Oktober", "November", "Desember",
	}
	return fmt.Sprintf("%d %s %d", parsed.Day(), months[int(parsed.Month())-1], parsed.Year())
}
