package main

import (
	"context"
	"net/http"
	"time"
)

func (a *app) health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	status := "ok"
	if err := a.db.Ping(ctx); err != nil {
		status = "database_unreachable"
		w.WriteHeader(http.StatusServiceUnavailable)
	}

	writeJSON(w, map[string]string{
		"service": "linkundang-api",
		"status":  status,
	})
}
