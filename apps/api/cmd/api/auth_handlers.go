package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

const authTokenTTL = 30 * 24 * time.Hour

func (a *app) register(w http.ResponseWriter, r *http.Request) {
	var payload authRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	email := normalizeEmail(payload.Email)
	password := strings.TrimSpace(payload.Password)
	displayName := strings.TrimSpace(payload.DisplayName)
	if displayName == "" {
		displayName = strings.Split(email, "@")[0]
	}
	if err := validateAuthInput(email, password); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	user, err := a.insertUser(r, email, displayName, string(hash))
	if err != nil {
		writeError(w, http.StatusConflict, errors.New("email already registered"))
		return
	}

	// Send welcome email (non-blocking)
	go emailWelcome(displayName, email)

	// Send email verification link (non-blocking)
	if rawToken, err := a.createAuthToken(r.Context(), user.ID, purposeEmailVerification, 24*time.Hour); err == nil {
		link := publicWebURL() + "/verify-email?token=" + url.QueryEscape(rawToken)
		go emailVerifyAddress(displayName, email, link)
	}

	a.writeAuthResponse(w, user, http.StatusCreated)
}

func (a *app) login(w http.ResponseWriter, r *http.Request) {
	var payload authRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	email := normalizeEmail(payload.Email)
	password := strings.TrimSpace(payload.Password)
	if err := validateAuthInput(email, password); err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}

	var user authUserPublic
	var hash string
	err := a.db.QueryRow(r.Context(), `
		select id::text, email, display_name, role, tier, email_verified, coalesce(password_hash, '')
		from users
		where lower(email) = lower($1)
			and status <> 'suspended'
	`, email).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Role, &user.Tier, &user.EmailVerified, &hash)
	if errors.Is(err, pgx.ErrNoRows) || bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		writeError(w, http.StatusUnauthorized, errors.New("invalid email or password"))
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	a.writeAuthResponse(w, user, http.StatusOK)
}

func (a *app) authMe(w http.ResponseWriter, r *http.Request) {
	current, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var user authUserPublic
	err := a.db.QueryRow(r.Context(), `
		select id::text, email, display_name, role, tier, email_verified
		from users
		where id = $1
	`, current.ID).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Role, &user.Tier, &user.EmailVerified)
	if err != nil {
		writeError(w, http.StatusUnauthorized, errors.New("user not found"))
		return
	}

	writeJSON(w, user)
}

func (a *app) updateProfile(w http.ResponseWriter, r *http.Request) {
	current, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload updateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	email := normalizeEmail(payload.Email)
	displayName := strings.TrimSpace(payload.DisplayName)
	if displayName == "" {
		writeError(w, http.StatusBadRequest, errors.New("displayName is required"))
		return
	}
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		writeError(w, http.StatusBadRequest, errors.New("valid email is required"))
		return
	}

	var user authUserPublic
	err := a.db.QueryRow(r.Context(), `
		update users
		set email = $1, display_name = $2
		where id = $3
		returning id::text, email, display_name, role, tier, email_verified
	`, email, displayName, current.ID).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Role, &user.Tier, &user.EmailVerified)
	if err != nil {
		writeError(w, http.StatusConflict, errors.New("email already registered"))
		return
	}

	writeJSON(w, user)
}

func (a *app) changePassword(w http.ResponseWriter, r *http.Request) {
	current, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload changePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	currentPassword := strings.TrimSpace(payload.CurrentPassword)
	newPassword := strings.TrimSpace(payload.NewPassword)
	if len(currentPassword) < 8 {
		writeError(w, http.StatusBadRequest, errors.New("current password must be at least 8 characters"))
		return
	}
	if len(newPassword) < 8 {
		writeError(w, http.StatusBadRequest, errors.New("new password must be at least 8 characters"))
		return
	}

	var hash string
	err := a.db.QueryRow(r.Context(), `
		select coalesce(password_hash, '')
		from users
		where id = $1
	`, current.ID).Scan(&hash)
	if err != nil {
		writeError(w, http.StatusUnauthorized, errors.New("user not found"))
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(currentPassword)) != nil {
		writeError(w, http.StatusUnauthorized, errors.New("current password is incorrect"))
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if _, err := a.db.Exec(r.Context(), `update users set password_hash = $1 where id = $2`, string(newHash), current.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *app) insertUser(r *http.Request, email string, displayName string, passwordHash string) (authUserPublic, error) {
	var user authUserPublic
	err := a.db.QueryRow(r.Context(), `
		insert into users (email, display_name, password_hash, role, tier, status)
		values ($1, $2, $3, 'user', 'free', 'active')
		returning id::text, email, display_name, role, tier, email_verified
	`, email, displayName, passwordHash).Scan(&user.ID, &user.Email, &user.DisplayName, &user.Role, &user.Tier, &user.EmailVerified)
	return user, err
}

func (a *app) writeAuthResponse(w http.ResponseWriter, user authUserPublic, status int) {
	var tokenVersion int
	_ = a.db.QueryRow(context.Background(), `select coalesce(token_version, 0) from users where id = $1::uuid`, user.ID).Scan(&tokenVersion)

	token, err := signJWTWithVersion(user.ID, tokenVersion, authTokenTTL, env("JWT_SECRET", "dev-secret-change-me"))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(authResponse{Token: token, User: user})
}

func (a *app) logout(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	if _, err := a.db.Exec(r.Context(), `
		update users
		set token_version = coalesce(token_version, 0) + 1,
			updated_at = now()
		where id = $1::uuid
	`, user.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func normalizeEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func validateAuthInput(email string, password string) error {
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return errors.New("valid email is required")
	}
	if len(password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}
