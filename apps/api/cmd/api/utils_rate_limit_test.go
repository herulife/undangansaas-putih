package main

import (
	"testing"
	"time"
)

func TestNormalizeSlug(t *testing.T) {
	got := normalizeSlug(" Alyssa & Rayhan Jawa Klasik! ")
	if got != "alyssa-rayhan-jawa-klasik" {
		t.Fatalf("unexpected slug: %s", got)
	}
}

func TestRateLimiterAllow(t *testing.T) {
	limiter := newRateLimiter()
	_, _, ok := limiter.allow("rsvp:127.0.0.1", 2, time.Hour)
	if !ok {
		t.Fatal("first request should pass")
	}
	remaining, _, ok := limiter.allow("rsvp:127.0.0.1", 2, time.Hour)
	if !ok || remaining != 0 {
		t.Fatalf("second request should pass with zero remaining, ok=%v remaining=%d", ok, remaining)
	}
	_, _, ok = limiter.allow("rsvp:127.0.0.1", 2, time.Hour)
	if ok {
		t.Fatal("third request should be blocked")
	}
}
