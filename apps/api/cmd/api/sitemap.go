package main

import (
	"fmt"
	"net/http"
	"strings"
	"time"
)

func (a *app) sitemapXML(w http.ResponseWriter, r *http.Request) {
	baseURL := "https://linkundang.web.id"
	now := time.Now().Format("2006-01-02")

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>` + baseURL + `/</loc>
    <lastmod>` + now + `</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>` + baseURL + `/templates</loc>
    <lastmod>` + now + `</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>` + baseURL + `/dashboard</loc>
    <lastmod>` + now + `</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>` + baseURL + `/login</loc>
    <lastmod>` + now + `</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>` + baseURL + `/register</loc>
    <lastmod>` + now + `</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`)

	// Add published invitations
	rows, err := a.db.Query(r.Context(), `
		select slug, updated_at
		from invitations
		where status = 'published'
		order by updated_at desc
		limit 1000
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var slug string
			var updatedAt time.Time
			if err := rows.Scan(&slug, &updatedAt); err != nil {
				continue
			}
			sb.WriteString(fmt.Sprintf(`  <url>
    <loc>%s/u/%s</loc>
    <lastmod>%s</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`, baseURL, slug, updatedAt.Format("2006-01-02")))
		}
	}

	sb.WriteString(`</urlset>`)

	w.Header().Set("Content-Type", "application/xml; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	_, _ = w.Write([]byte(sb.String()))
}
