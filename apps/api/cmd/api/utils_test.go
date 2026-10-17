package main

import (
	"errors"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestEnvFallback(t *testing.T) {
	t.Setenv("LU_TEST_ENV", "")
	if got := env("LU_TEST_ENV", "fallback"); got != "fallback" {
		t.Fatalf("env fallback = %q, want fallback", got)
	}
	t.Setenv("LU_TEST_ENV", "value")
	if got := env("LU_TEST_ENV", "fallback"); got != "value" {
		t.Fatalf("env value = %q, want value", got)
	}
}

func TestEnvList(t *testing.T) {
	t.Setenv("LU_TEST_LIST", " a , b ,, c ")
	got := envList("LU_TEST_LIST", "")
	if strings.Join(got, "|") != "a|b|c" {
		t.Fatalf("envList = %v, want [a b c]", got)
	}
}

func TestIntString(t *testing.T) {
	if intString(42) != "42" {
		t.Fatalf("intString(42) = %q", intString(42))
	}
	if intString(-1) != "-1" {
		t.Fatalf("intString(-1) = %q", intString(-1))
	}
}

func TestNormalizeSlugEdgeCases(t *testing.T) {
	cases := map[string]string{
		"":                    "",
		"Hello   World":       "hello-world",
		"--Trim--":            "trim",
		"Akad & Resepsi 2026": "akad-resepsi-2026",
		"  spaces  ":          "spaces",
		"diakritik-é":         "diakritik",
	}
	for in, want := range cases {
		if got := normalizeSlug(in); got != want {
			t.Fatalf("normalizeSlug(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestWriteJSON(t *testing.T) {
	rec := httptest.NewRecorder()
	writeJSON(rec, map[string]string{"hello": "world"})
	if rec.Code != 200 {
		t.Fatalf("writeJSON status = %d, want 200", rec.Code)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "application/json") {
		t.Fatalf("writeJSON content-type = %q", ct)
	}
	if !strings.Contains(rec.Body.String(), "world") {
		t.Fatalf("writeJSON body = %q", rec.Body.String())
	}
}

func TestWriteError(t *testing.T) {
	rec := httptest.NewRecorder()
	writeError(rec, 400, errors.New("bad request"))
	if rec.Code != 400 {
		t.Fatalf("writeError status = %d, want 400", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "bad request") {
		t.Fatalf("writeError body = %q", rec.Body.String())
	}
}
