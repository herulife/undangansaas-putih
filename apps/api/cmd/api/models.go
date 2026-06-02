package main

import "time"

type template struct {
	ID           string         `json:"id"`
	Name         string         `json:"name"`
	Slug         string         `json:"slug"`
	Category     string         `json:"category"`
	ConfigSchema map[string]any `json:"configSchema"`
	TierAccess   []string       `json:"tierAccess"`
	AssetsURL    string         `json:"assetsUrl"`
	PreviewURL   string         `json:"previewUrl"`
	IsActive     bool           `json:"isActive"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type invitation struct {
	ID           string         `json:"id"`
	Slug         string         `json:"slug"`
	Title        string         `json:"title"`
	Couple       string         `json:"couple"`
	Template     string         `json:"template"`
	TemplateSlug string         `json:"templateSlug"`
	EventDate    string         `json:"eventDate"`
	Status       string         `json:"status"`
	Config       map[string]any `json:"config"`
	RSVPCount    int            `json:"rsvpCount"`
	Watermark    bool           `json:"watermark"`
	CreatedAt    time.Time      `json:"createdAt"`
}

type createInvitationRequest struct {
	Slug         string         `json:"slug"`
	Title        string         `json:"title"`
	Couple       string         `json:"couple"`
	TemplateSlug string         `json:"templateSlug"`
	EventDate    string         `json:"eventDate"`
	Status       string         `json:"status"`
	Config       map[string]any `json:"config"`
}

type updateInvitationRequest struct {
	Couple    string         `json:"couple"`
	EventDate string         `json:"eventDate"`
	Status    string         `json:"status"`
	Title     string         `json:"title"`
	Config    map[string]any `json:"config"`
}

type rsvpRequest struct {
	Name    string `json:"name"`
	Message string `json:"message"`
	Status  string `json:"status"`
	Guests  int    `json:"guests"`
}

type rsvp struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Message   string    `json:"message"`
	Status    string    `json:"status"`
	Guests    int       `json:"guests"`
	CreatedAt time.Time `json:"createdAt"`
}

type generateImageRequest struct {
	Prompt string `json:"prompt"`
	Style  string `json:"style"`
	Size   string `json:"size"`
}

type generateImageResponse struct {
	FileName string `json:"fileName"`
	Provider string `json:"provider"`
	URL      string `json:"url"`
	Prompt   string `json:"prompt"`
}

type tierName string

const (
	tierFree     tierName = "free"
	tierCreator  tierName = "creator"
	tierPro      tierName = "pro"
	tierBusiness tierName = "business"
)

type authUser struct {
	ID            string
	Email         string
	Role          string
	Tier          tierName
	Status        string
	TierExpiresAt *time.Time
	IsB2B         bool
	ClientLimit   int
}

type tierFeatureSet struct {
	Analytics        string   `json:"analytics"`
	APIAccess        bool     `json:"apiAccess"`
	ActiveMonths     int      `json:"activeMonths,omitempty"`
	BulkCreate       bool     `json:"bulkCreate"`
	ClientDashboard  bool     `json:"clientDashboard"`
	CustomDomain     bool     `json:"customDomain"`
	DynamicOG        bool     `json:"dynamicOg"`
	ExportCSV        bool     `json:"exportCsv"`
	Flags            []string `json:"flags"`
	MaxGallery       *int     `json:"maxGallery"`
	PrioritySupport  bool     `json:"prioritySupport"`
	RevenueShare     int      `json:"revenueShare"`
	RSVPLimit        int      `json:"rsvpLimit"`
	UnlimitedGallery bool     `json:"unlimitedGallery"`
	Watermark        bool     `json:"watermark"`
	WhiteLabel       bool     `json:"whiteLabel"`
}

type meFeaturesResponse struct {
	UserID          string         `json:"userId"`
	Email           string         `json:"email"`
	Role            string         `json:"role"`
	Tier            tierName       `json:"tier"`
	EffectiveTier   tierName       `json:"effectiveTier"`
	TierExpiresAt   *time.Time     `json:"tierExpiresAt"`
	IsExpired       bool           `json:"isExpired"`
	IsInGracePeriod bool           `json:"isInGracePeriod"`
	IsB2B           bool           `json:"isB2b"`
	ClientLimit     int            `json:"clientLimit"`
	Features        tierFeatureSet `json:"features"`
}

type publishInvitationRequest struct {
	CustomDomain    string `json:"customDomain"`
	DynamicOG       bool   `json:"dynamicOg"`
	GalleryCount    int    `json:"galleryCount"`
	RemoveWatermark bool   `json:"removeWatermark"`
}

type trackEventRequest struct {
	EventName      string         `json:"eventName"`
	InvitationSlug string         `json:"invitationSlug"`
	Properties     map[string]any `json:"properties"`
	VisitorID      string         `json:"visitorId"`
}

type authRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"displayName"`
}

type updateProfileRequest struct {
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type authResponse struct {
	Token string         `json:"token"`
	User  authUserPublic `json:"user"`
}

type authUserPublic struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	DisplayName string   `json:"displayName"`
	Role        string   `json:"role"`
	Tier        tierName `json:"tier"`
}

type adminUser struct {
	ID              string     `json:"id"`
	Email           string     `json:"email"`
	DisplayName     string     `json:"displayName"`
	Role            string     `json:"role"`
	Tier            tierName   `json:"tier"`
	Status          string     `json:"status"`
	TierExpiresAt   *time.Time `json:"tierExpiresAt"`
	IsB2B           bool       `json:"isB2b"`
	ClientLimit     int        `json:"clientLimit"`
	InvitationCount int        `json:"invitationCount"`
	RSVPCount       int        `json:"rsvpCount"`
	PaymentCount    int        `json:"paymentCount"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type adminUserRequest struct {
	Email         string `json:"email"`
	DisplayName   string `json:"displayName"`
	Password      string `json:"password"`
	Role          string `json:"role"`
	Tier          string `json:"tier"`
	Status        string `json:"status"`
	TierExpiresAt string `json:"tierExpiresAt"`
	IsB2B         bool   `json:"isB2b"`
	ClientLimit   int    `json:"clientLimit"`
}

type adminPasswordRequest struct {
	Password string `json:"password"`
}

type manualPaymentRequest struct {
	AmountIDR       int    `json:"amountIdr"`
	ProviderOrderID string `json:"providerOrderId"`
	Tier            string `json:"tier"`
	UserID          string `json:"userId"`
}

type adminTemplateRequest struct {
	AssetsURL    string         `json:"assetsUrl"`
	Category     string         `json:"category"`
	ConfigSchema map[string]any `json:"configSchema"`
	IsActive     *bool          `json:"isActive"`
	Name         string         `json:"name"`
	PreviewURL   string         `json:"previewUrl"`
	Slug         string         `json:"slug"`
	TierAccess   []string       `json:"tierAccess"`
}
