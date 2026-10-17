package main

import (
	"testing"
	"time"
)

func TestSignVerifyJWTRoundTrip(t *testing.T) {
	token, err := signJWT("user-123", time.Hour, "secret")
	if err != nil {
		t.Fatalf("signJWT: %v", err)
	}
	subject, err := verifyJWTSubject(token, "secret")
	if err != nil {
		t.Fatalf("verifyJWTSubject: %v", err)
	}
	if subject != "user-123" {
		t.Fatalf("subject = %q, want user-123", subject)
	}
}

func TestVerifyJWTRejectsWrongSecret(t *testing.T) {
	token, err := signJWT("user-123", time.Hour, "secret")
	if err != nil {
		t.Fatalf("signJWT: %v", err)
	}
	if _, err := verifyJWTSubject(token, "other-secret"); err == nil {
		t.Fatal("expected verification to fail with wrong secret")
	}
}

func TestVerifyJWTRejectsExpired(t *testing.T) {
	token, err := signJWT("user-123", -time.Minute, "secret")
	if err != nil {
		t.Fatalf("signJWT: %v", err)
	}
	if _, err := verifyJWTSubject(token, "secret"); err == nil {
		t.Fatal("expected expired token to fail")
	}
}

func TestVerifyJWTRejectsMalformed(t *testing.T) {
	cases := []string{"", "only-one", "two.parts", "a.b.c.d"}
	for _, token := range cases {
		if _, err := verifyJWTSubject(token, "secret"); err == nil {
			t.Fatalf("expected error for malformed token %q", token)
		}
	}
}

func TestJWTRequiresSecret(t *testing.T) {
	if _, err := signJWT("user-123", time.Hour, ""); err == nil {
		t.Fatal("signJWT should require a secret")
	}
	if _, err := verifyJWTSubject("a.b.c", ""); err == nil {
		t.Fatal("verifyJWTSubject should require a secret")
	}
}

func TestBearerToken(t *testing.T) {
	token, ok := bearerToken("Bearer abc.def.ghi")
	if !ok || token != "abc.def.ghi" {
		t.Fatalf("bearerToken = %q, %v", token, ok)
	}
	if _, ok := bearerToken("Token abc"); ok {
		t.Fatal("non-Bearer scheme must be rejected")
	}
	if _, ok := bearerToken("Bearer"); ok {
		t.Fatal("missing token must be rejected")
	}
	if _, ok := bearerToken(""); ok {
		t.Fatal("empty header must be rejected")
	}
}
