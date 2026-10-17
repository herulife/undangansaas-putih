package main

import "strings"

const (
	eventTypeWedding  = "wedding"
	eventTypeAqiqah   = "aqiqah"
	eventTypeKhitanan = "khitanan"
	eventTypeSyukuran = "syukuran"
	eventTypeBirthday = "birthday"
	eventTypeLembaga  = "lembaga"
	eventTypeOther    = "other"
)

var validEventTypes = map[string]bool{
	eventTypeWedding:  true,
	eventTypeAqiqah:   true,
	eventTypeKhitanan: true,
	eventTypeSyukuran: true,
	eventTypeBirthday: true,
	eventTypeLembaga:  true,
	eventTypeOther:    true,
}

func normalizeEventType(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if validEventTypes[value] {
		return value
	}
	return eventTypeWedding
}
