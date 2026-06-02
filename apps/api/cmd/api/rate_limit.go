package main

import (
	"errors"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type rateLimitEntry struct {
	Count     int
	ResetAt   time.Time
	UpdatedAt time.Time
}

type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]rateLimitEntry
}

func newRateLimiter() *rateLimiter {
	return &rateLimiter{buckets: map[string]rateLimitEntry{}}
}

func (a *app) RateLimit(scope string, limit int, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if a.limiter == nil || limit <= 0 || window <= 0 {
				next.ServeHTTP(w, r)
				return
			}

			key := scope + ":" + requestClientKey(r)
			remaining, resetAt, allowed := a.limiter.allow(key, limit, window)
			w.Header().Set("X-RateLimit-Limit", intString(limit))
			w.Header().Set("X-RateLimit-Remaining", intString(remaining))
			w.Header().Set("X-RateLimit-Reset", intString(int(time.Until(resetAt).Seconds())))
			if !allowed {
				writeError(w, http.StatusTooManyRequests, errors.New("rate limit reached"))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (limiter *rateLimiter) allow(key string, limit int, window time.Duration) (int, time.Time, bool) {
	now := time.Now()
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	limiter.cleanup(now)

	entry := limiter.buckets[key]
	if entry.ResetAt.IsZero() || now.After(entry.ResetAt) {
		entry = rateLimitEntry{Count: 0, ResetAt: now.Add(window)}
	}
	entry.Count++
	entry.UpdatedAt = now
	limiter.buckets[key] = entry

	remaining := limit - entry.Count
	if remaining < 0 {
		remaining = 0
	}
	return remaining, entry.ResetAt, entry.Count <= limit
}

func (limiter *rateLimiter) cleanup(now time.Time) {
	if len(limiter.buckets) < 1000 {
		return
	}
	for key, entry := range limiter.buckets {
		if now.After(entry.ResetAt.Add(time.Minute)) || now.Sub(entry.UpdatedAt) > time.Hour {
			delete(limiter.buckets, key)
		}
	}
}

func requestClientKey(r *http.Request) string {
	for _, header := range []string{"CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP"} {
		value := strings.TrimSpace(r.Header.Get(header))
		if value == "" {
			continue
		}
		if comma := strings.Index(value, ","); comma >= 0 {
			value = strings.TrimSpace(value[:comma])
		}
		if value != "" {
			return value
		}
	}

	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}
