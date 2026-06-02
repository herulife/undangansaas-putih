package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"undangan-saas-modern/apps/api/internal/auth"
	"undangan-saas-modern/apps/api/internal/config"
	apphttp "undangan-saas-modern/apps/api/internal/http"
	"undangan-saas-modern/apps/api/internal/invitation"
	"undangan-saas-modern/apps/api/internal/platform/postgres"
	redisstore "undangan-saas-modern/apps/api/internal/platform/redis"
)

func main() {
	cfg := config.Load()
	ctx := context.Background()

	db, err := postgres.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer db.Close()

	cache := redisstore.Connect(cfg.RedisAddr)
	authService := auth.NewService(cfg.JWTSecret, postgres.NewUserRepository(db))
	invitationService := invitation.NewService(postgres.NewInvitationRepository(db), cache)

	router := apphttp.NewRouter(cfg, authService, invitationService)
	server := &http.Server{
		Addr:              ":" + cfg.APIPort,
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("api listening on :%s", cfg.APIPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Printf("server shutdown: %v", err)
	}
}
