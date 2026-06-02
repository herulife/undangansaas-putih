package config

import "os"

type Config struct {
	AppEnv      string
	APIPort     string
	WebOrigin   string
	DatabaseURL string
	RedisAddr   string
	JWTSecret   string
}

func Load() Config {
	return Config{
		AppEnv:      env("APP_ENV", "development"),
		APIPort:     env("API_PORT", "8090"),
		WebOrigin:   env("WEB_ORIGIN", "http://localhost:5174"),
		DatabaseURL: env("DATABASE_URL", "postgres://undangan:undangan@localhost:5440/undangan_saas?sslmode=disable"),
		RedisAddr:   env("REDIS_ADDR", "localhost:6380"),
		JWTSecret:   env("JWT_SECRET", "dev-secret-change-me"),
	}
}

func env(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
