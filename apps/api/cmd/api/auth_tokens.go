package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	purposeEmailVerification = "email_verification"
	purposePasswordReset     = "password_reset"
)

func publicWebURL() string {
	return strings.TrimRight(env("APP_PUBLIC_URL", "https://linkundang.web.id"), "/")
}

func hashAuthToken(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}

func generateAuthToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

// createAuthToken generates a random token, stores only its hash, and returns the raw token.
func (a *app) createAuthToken(ctx context.Context, userID, purpose string, ttl time.Duration) (string, error) {
	raw, err := generateAuthToken()
	if err != nil {
		return "", err
	}
	_, err = a.db.Exec(ctx, `
		insert into auth_tokens (user_id, token_hash, purpose, expires_at)
		values ($1, $2, $3, $4)
	`, userID, hashAuthToken(raw), purpose, time.Now().Add(ttl))
	if err != nil {
		return "", err
	}
	return raw, nil
}

// consumeAuthToken atomically marks a valid, unexpired, unused token as used and returns its user id.
func (a *app) consumeAuthToken(ctx context.Context, raw, purpose string) (string, error) {
	if strings.TrimSpace(raw) == "" {
		return "", errors.New("invalid or expired token")
	}
	var userID string
	err := a.db.QueryRow(ctx, `
		update auth_tokens
		set used_at = now()
		where token_hash = $1
			and purpose = $2
			and used_at is null
			and expires_at > now()
		returning user_id::text
	`, hashAuthToken(raw), purpose).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", errors.New("invalid or expired token")
	}
	return userID, err
}

func (a *app) verifyEmail(w http.ResponseWriter, r *http.Request) {
	var payload verifyEmailRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	userID, err := a.consumeAuthToken(r.Context(), payload.Token, purposeEmailVerification)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("token verifikasi tidak valid atau sudah kedaluwarsa"))
		return
	}

	if _, err := a.db.Exec(r.Context(), `
		update users
		set email_verified = true, email_verified_at = now(), updated_at = now()
		where id = $1
	`, userID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, map[string]any{"ok": true, "message": "Email berhasil diverifikasi."})
}

func (a *app) resendVerification(w http.ResponseWriter, r *http.Request) {
	current, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var email, displayName string
	var verified bool
	err := a.db.QueryRow(r.Context(), `
		select email, display_name, email_verified
		from users
		where id = $1
	`, current.ID).Scan(&email, &displayName, &verified)
	if err != nil {
		writeError(w, http.StatusUnauthorized, errors.New("user not found"))
		return
	}
	if verified {
		writeJSON(w, map[string]any{"ok": true, "alreadyVerified": true, "message": "Email sudah diverifikasi."})
		return
	}

	raw, err := a.createAuthToken(r.Context(), current.ID, purposeEmailVerification, 24*time.Hour)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	link := publicWebURL() + "/verify-email?token=" + url.QueryEscape(raw)
	go emailVerifyAddress(displayName, email, link)

	writeJSON(w, map[string]any{"ok": true, "message": "Email verifikasi telah dikirim ulang."})
}

func (a *app) forgotPassword(w http.ResponseWriter, r *http.Request) {
	var payload forgotPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	email := normalizeEmail(payload.Email)
	if email == "" {
		writeError(w, http.StatusBadRequest, errors.New("email is required"))
		return
	}

	var userID, displayName string
	err := a.db.QueryRow(r.Context(), `
		select id::text, display_name
		from users
		where lower(email) = lower($1) and status <> 'suspended'
	`, email).Scan(&userID, &displayName)
	if err == nil {
		if raw, tokenErr := a.createAuthToken(r.Context(), userID, purposePasswordReset, time.Hour); tokenErr == nil {
			link := publicWebURL() + "/reset-password?token=" + url.QueryEscape(raw)
			go emailPasswordReset(displayName, email, link)
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	// Always respond successfully to avoid leaking which emails are registered.
	writeJSON(w, map[string]any{
		"ok":      true,
		"message": "Jika email terdaftar, tautan reset password telah dikirim.",
	})
}

func (a *app) resetPassword(w http.ResponseWriter, r *http.Request) {
	var payload resetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	password := strings.TrimSpace(payload.Password)
	if len(password) < 8 {
		writeError(w, http.StatusBadRequest, errors.New("password must be at least 8 characters"))
		return
	}

	userID, err := a.consumeAuthToken(r.Context(), payload.Token, purposePasswordReset)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("token reset tidak valid atau sudah kedaluwarsa"))
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if _, err := a.db.Exec(r.Context(), `
		update users set password_hash = $1, updated_at = now() where id = $2
	`, string(hash), userID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	// Invalidate any other outstanding reset tokens for this user.
	_, _ = a.db.Exec(r.Context(), `
		update auth_tokens set used_at = now()
		where user_id = $1 and purpose = $2 and used_at is null
	`, userID, purposePasswordReset)

	writeJSON(w, map[string]any{"ok": true, "message": "Password berhasil direset. Silakan login."})
}
