package main

import (
	"errors"
	"net/http"
	"time"
)

const (
	featureAnalyticsBasic   = "analytics:basic"
	featureAnalyticsFull    = "analytics:full"
	featureAPIAccess        = "api_access"
	featureBulkCreate       = "bulk_create"
	featureClientDashboard  = "client_dashboard"
	featureCustomDomain     = "custom_domain"
	featureDynamicOG        = "dynamic_og"
	featureExportCSV        = "export_csv"
	featurePrioritySupport  = "priority_support"
	featureUnlimitedGallery = "unlimited_gallery"
	featureWatermarkRemove  = "watermark_remove"
	featureWhiteLabel       = "white_label"
)

const tierGracePeriod = 72 * time.Hour

func (a *app) RequireTier(requiredFlags []string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := currentUserFromContext(r.Context())
			if !ok {
				writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
				return
			}

			features := featuresForUser(user, time.Now())
			missing := missingFeatureFlags(features.Features, requiredFlags)
			if len(missing) > 0 {
				writeError(w, http.StatusForbidden, errors.New("tier does not allow: "+joinComma(missing)))
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func featuresForUser(user *authUser, now time.Time) meFeaturesResponse {
	effectiveTier, isExpired, isInGrace := effectiveTier(user, now)
	features := featuresForTier(effectiveTier)

	return meFeaturesResponse{
		UserID:          user.ID,
		Email:           user.Email,
		Role:            user.Role,
		Tier:            user.Tier,
		EffectiveTier:   effectiveTier,
		TierExpiresAt:   user.TierExpiresAt,
		IsExpired:       isExpired,
		IsInGracePeriod: isInGrace,
		IsB2B:           user.IsB2B,
		ClientLimit:     user.ClientLimit,
		Features:        features,
	}
}

func effectiveTier(user *authUser, now time.Time) (tierName, bool, bool) {
	if user == nil {
		return tierFree, false, false
	}
	if user.Tier == tierFree || user.TierExpiresAt == nil {
		return user.Tier, false, false
	}
	if now.Before(*user.TierExpiresAt) || now.Equal(*user.TierExpiresAt) {
		return user.Tier, false, false
	}
	if now.Before(user.TierExpiresAt.Add(tierGracePeriod)) {
		return user.Tier, true, true
	}
	return tierFree, true, false
}

func featuresForTier(tier tierName) tierFeatureSet {
	maxGalleryFree := 3
	maxGalleryCreator := 15

	switch tier {
	case tierBusiness:
		return tierFeatureSet{
			Analytics:        "full",
			APIAccess:        true,
			ActiveMonths:     1,
			BulkCreate:       true,
			ClientDashboard:  true,
			CustomDomain:     true,
			DynamicOG:        true,
			ExportCSV:        true,
			Flags:            []string{featureAnalyticsFull, featureAPIAccess, featureBulkCreate, featureClientDashboard, featureCustomDomain, featureDynamicOG, featureExportCSV, featurePrioritySupport, featureUnlimitedGallery, featureWatermarkRemove, featureWhiteLabel},
			MaxGallery:       nil,
			PrioritySupport:  true,
			RevenueShare:     20,
			RSVPLimit:        10000,
			StorageLimitBytes: 20 << 30,
			UnlimitedGallery: true,
			Watermark:        false,
			WhiteLabel:       true,
		}
	case tierPro:
		return tierFeatureSet{
			Analytics:        "full",
			ActiveMonths:     12,
			CustomDomain:     true,
			DynamicOG:        true,
			ExportCSV:        true,
			Flags:            []string{featureAnalyticsFull, featureCustomDomain, featureDynamicOG, featureExportCSV, featurePrioritySupport, featureUnlimitedGallery, featureWatermarkRemove},
			MaxGallery:       nil,
			PrioritySupport:  true,
			RSVPLimit:        1000,
			StorageLimitBytes: 5 << 30,
			UnlimitedGallery: true,
			Watermark:        false,
		}
	case tierCreator:
		return tierFeatureSet{
			Analytics:    "basic",
			ActiveMonths: 12,
			ExportCSV:    true,
			Flags:        []string{featureAnalyticsBasic, featureExportCSV, featureWatermarkRemove},
			MaxGallery:   &maxGalleryCreator,
			RSVPLimit:    300,
			StorageLimitBytes: 1 << 30,
			Watermark:    false,
		}
	default:
		return tierFeatureSet{
			Analytics:  "basic",
			Flags:      []string{featureAnalyticsBasic},
			MaxGallery: &maxGalleryFree,
			RSVPLimit:  50,
			StorageLimitBytes: 100 << 20,
			Watermark:  true,
		}
	}
}

func missingFeatureFlags(features tierFeatureSet, required []string) []string {
	missing := []string{}
	allowed := map[string]bool{}
	for _, flag := range features.Flags {
		allowed[flag] = true
	}
	for _, flag := range required {
		if !allowed[flag] {
			missing = append(missing, flag)
		}
	}
	return missing
}

func joinComma(values []string) string {
	if len(values) == 0 {
		return ""
	}
	result := values[0]
	for _, value := range values[1:] {
		result += ", " + value
	}
	return result
}
