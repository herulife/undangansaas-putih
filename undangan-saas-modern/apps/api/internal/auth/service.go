package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           string
	Name         string
	Email        string
	PasswordHash string
}

type UserRepository interface {
	Create(ctx context.Context, user User) error
	FindByEmail(ctx context.Context, email string) (User, error)
}

type Service struct {
	secret string
	users  UserRepository
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type SessionResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

func NewService(secret string, users UserRepository) *Service {
	return &Service{secret: secret, users: users}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (SessionResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return SessionResponse{}, err
	}

	user := User{
		ID:           "usr_" + RandomToken(12),
		Name:         strings.TrimSpace(req.Name),
		Email:        strings.ToLower(strings.TrimSpace(req.Email)),
		PasswordHash: string(hash),
	}
	if err := s.users.Create(ctx, user); err != nil {
		return SessionResponse{}, err
	}
	return s.session(user)
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (SessionResponse, error) {
	user, err := s.users.FindByEmail(ctx, strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		return SessionResponse{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return SessionResponse{}, err
	}
	return s.session(user)
}

func (s *Service) VerifyBearer(header string) (string, error) {
	tokenValue := strings.TrimPrefix(header, "Bearer ")
	if tokenValue == header || tokenValue == "" {
		return "", errors.New("missing bearer token")
	}

	token, err := jwt.Parse(tokenValue, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.secret), nil
	}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}

	subject, err := token.Claims.GetSubject()
	if err != nil || subject == "" {
		return "", errors.New("missing subject")
	}
	return subject, nil
}

func (s *Service) session(user User) (SessionResponse, error) {
	claims := jwt.RegisteredClaims{
		Subject:   user.ID,
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenValue, err := token.SignedString([]byte(s.secret))
	if err != nil {
		return SessionResponse{}, err
	}
	user.PasswordHash = ""
	return SessionResponse{Token: tokenValue, User: user}, nil
}

func RandomToken(size int) string {
	bytes := make([]byte, size)
	if _, err := rand.Read(bytes); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))[:size]
	}
	return hex.EncodeToString(bytes)
}
