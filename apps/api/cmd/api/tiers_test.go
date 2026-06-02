package main

import (
	"testing"
	"time"
)

func TestFeaturesForTier(t *testing.T) {
	free := featuresForTier(tierFree)
	if !free.Watermark || free.RSVPLimit != 50 || free.MaxGallery == nil || *free.MaxGallery != 3 {
		t.Fatalf("free tier mismatch: %+v", free)
	}

	creator := featuresForTier(tierCreator)
	if creator.Watermark || !creator.ExportCSV || creator.RSVPLimit != 300 {
		t.Fatalf("creator tier mismatch: %+v", creator)
	}

	pro := featuresForTier(tierPro)
	if !pro.CustomDomain || !pro.DynamicOG || !pro.UnlimitedGallery {
		t.Fatalf("pro tier mismatch: %+v", pro)
	}

	business := featuresForTier(tierBusiness)
	if !business.WhiteLabel || !business.APIAccess || business.RevenueShare != 20 {
		t.Fatalf("business tier mismatch: %+v", business)
	}
}

func TestEffectiveTierGracePeriod(t *testing.T) {
	now := time.Date(2026, 6, 2, 8, 0, 0, 0, time.UTC)
	expiredRecently := now.Add(-time.Hour)
	user := &authUser{Tier: tierPro, TierExpiresAt: &expiredRecently}

	tier, expired, grace := effectiveTier(user, now)
	if tier != tierPro || !expired || !grace {
		t.Fatalf("expected pro in grace period, got tier=%s expired=%v grace=%v", tier, expired, grace)
	}

	expiredLongAgo := now.Add(-96 * time.Hour)
	user.TierExpiresAt = &expiredLongAgo
	tier, expired, grace = effectiveTier(user, now)
	if tier != tierFree || !expired || grace {
		t.Fatalf("expected downgrade to free, got tier=%s expired=%v grace=%v", tier, expired, grace)
	}
}
