package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type contextKey string

const authUserContextKey contextKey = "authUser"

type jwtHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
}

type jwtClaims struct {
	ExpiresAt int64  `json:"exp"`
	Subject   string `json:"sub"`
	UserID    string `json:"user_id"`
	Version   int    `json:"ver"`
}

func (a *app) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := a.authenticateRequest(r)
		if err != nil {
			writeError(w, http.StatusUnauthorized, err)
			return
		}

		ctx := context.WithValue(r.Context(), authUserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (a *app) RequireAdmin(next http.Handler) http.Handler {
	return a.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := currentUserFromContext(r.Context())
		if !ok {
			writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
			return
		}
		if user.Role != "admin" {
			writeError(w, http.StatusForbidden, errors.New("admin role required"))
			return
		}

		next.ServeHTTP(w, r)
	}))
}

func currentUserFromContext(ctx context.Context) (*authUser, bool) {
	user, ok := ctx.Value(authUserContextKey).(*authUser)
	return user, ok && user != nil
}

func (a *app) authenticateRequest(r *http.Request) (*authUser, error) {
	if env("ALLOW_DEV_AUTH", "false") == "true" {
		if userID := strings.TrimSpace(r.Header.Get("X-User-ID")); userID != "" {
			return a.findUserByID(r.Context(), userID)
		}
	}

	token, ok := bearerToken(r.Header.Get("Authorization"))
	if !ok {
		return nil, errors.New("missing bearer token")
	}

	claims, err := verifyJWTClaims(token, env("JWT_SECRET", "dev-secret-change-me"))
	if err != nil {
		return nil, err
	}
	subject := strings.TrimSpace(claims.Subject)
	if subject == "" {
		subject = strings.TrimSpace(claims.UserID)
	}
	if subject == "" {
		return nil, errors.New("jwt subject is required")
	}

	user, err := a.findUserByID(r.Context(), subject)
	if err != nil {
		return nil, err
	}
	if user.TokenVersion != claims.Version {
		return nil, errors.New("session has been revoked")
	}
	return user, nil
}

func bearerToken(header string) (string, bool) {
	parts := strings.Fields(header)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", false
	}
	return parts[1], true
}

func verifyJWTSubject(token string, secret string) (string, error) {
	claims, err := verifyJWTClaims(token, secret)
	if err != nil {
		return "", err
	}
	subject := strings.TrimSpace(claims.Subject)
	if subject == "" {
		subject = strings.TrimSpace(claims.UserID)
	}
	if subject == "" {
		return "", errors.New("jwt subject is required")
	}
	return subject, nil
}

func verifyJWTClaims(token string, secret string) (jwtClaims, error) {
	if secret == "" {
		return jwtClaims{}, errors.New("JWT_SECRET is not configured")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return jwtClaims{}, errors.New("invalid jwt format")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return jwtClaims{}, errors.New("invalid jwt header")
	}

	var header jwtHeader
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return jwtClaims{}, errors.New("invalid jwt header json")
	}
	if header.Algorithm != "HS256" {
		return jwtClaims{}, errors.New("unsupported jwt algorithm")
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(parts[0] + "." + parts[1]))
	expected := mac.Sum(nil)

	actual, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return jwtClaims{}, errors.New("invalid jwt signature")
	}
	if !hmac.Equal(actual, expected) {
		return jwtClaims{}, errors.New("invalid jwt signature")
	}

	claimsBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return jwtClaims{}, errors.New("invalid jwt claims")
	}

	var claims jwtClaims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return jwtClaims{}, errors.New("invalid jwt claims json")
	}
	if claims.ExpiresAt > 0 && time.Now().Unix() >= claims.ExpiresAt {
		return jwtClaims{}, errors.New("jwt expired")
	}

	return claims, nil
}

func signJWT(userID string, ttl time.Duration, secret string) (string, error) {
	return signJWTWithVersion(userID, 0, ttl, secret)
}

func signJWTWithVersion(userID string, version int, ttl time.Duration, secret string) (string, error) {
	if secret == "" {
		return "", errors.New("JWT_SECRET is not configured")
	}

	header := jwtHeader{Algorithm: "HS256", Type: "JWT"}
	claims := jwtClaims{
		ExpiresAt: time.Now().Add(ttl).Unix(),
		Subject:   userID,
		UserID:    userID,
		Version:   version,
	}

	headerBytes, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	claimsBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	unsigned := base64.RawURLEncoding.EncodeToString(headerBytes) + "." + base64.RawURLEncoding.EncodeToString(claimsBytes)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(unsigned))
	return unsigned + "." + base64.RawURLEncoding.EncodeToString(mac.Sum(nil)), nil
}

func (a *app) findUserByID(ctx context.Context, userID string) (*authUser, error) {
	var user authUser
	err := a.db.QueryRow(ctx, `
		select id::text, email, role, tier, status, tier_expires_at, is_b2b, client_limit,
			coalesce(token_version, 0)
		from users
		where id = $1
	`, userID).Scan(
		&user.ID,
		&user.Email,
		&user.Role,
		&user.Tier,
		&user.Status,
		&user.TierExpiresAt,
		&user.IsB2B,
		&user.ClientLimit,
		&user.TokenVersion,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errors.New("user not found")
	}
	if err != nil {
		return nil, err
	}
	if user.Tier == "" {
		user.Tier = tierFree
	}
	if user.Status == "suspended" {
		return nil, errors.New("user is suspended")
	}

	return &user, nil
}
