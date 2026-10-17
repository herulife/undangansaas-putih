package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	ctx := context.Background()
	port := env("APP_PORT", "8088")
	databaseURL := env("DATABASE_URL", "")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer db.Close()

	if err := migrate(ctx, db); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	api := newApp(db)

	go func() {
		if n, err := api.downgradeExpiredTiers(ctx); err != nil {
			log.Printf("tier expiry cron: %v", err)
		} else if n > 0 {
			log.Printf("tier expiry cron: downgraded %d user(s)", n)
		}
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			if n, err := api.downgradeExpiredTiers(ctx); err != nil {
				log.Printf("tier expiry cron: %v", err)
			} else if n > 0 {
				log.Printf("tier expiry cron: downgraded %d user(s)", n)
			}
		}
	}()

	log.Printf("LinkUndang API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, api.routes()); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
