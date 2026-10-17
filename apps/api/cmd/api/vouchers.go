package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type voucherRecord struct {
	ID            string     `json:"id"`
	Code          string     `json:"code"`
	DiscountType  string     `json:"discountType"`
	DiscountValue int        `json:"discountValue"`
	Quota         int        `json:"quota"`
	UsedCount     int        `json:"usedCount"`
	ExpiresAt     *time.Time `json:"expiresAt,omitempty"`
	Status        string     `json:"status"`
	CreatedAt     time.Time  `json:"createdAt"`
}

type voucherAdminRequest struct {
	Code          string `json:"code"`
	DiscountType  string `json:"discountType"`
	DiscountValue int    `json:"discountValue"`
	Quota         int    `json:"quota"`
	ExpiresAt     string `json:"expiresAt"`
	Status        string `json:"status"`
}

type voucherValidateRequest struct {
	Code      string `json:"code"`
	AmountIDR int    `json:"amountIdr"`
}

type voucherApplyResult struct {
	Code           string `json:"code"`
	DiscountType   string `json:"discountType"`
	DiscountValue  int    `json:"discountValue"`
	DiscountAmount int    `json:"discountAmount"`
	FinalAmount    int    `json:"finalAmount"`
}

func (a *app) validateVoucherCode(ctx context.Context, rawCode string, amount int) (voucherApplyResult, string, error) {
	code := strings.ToUpper(strings.TrimSpace(rawCode))
	var (
		voucherID   string
		storedCode  string
		discountTyp string
		value       int
		quota       int
		used        int
		expiresAt   *time.Time
		status      string
	)

	err := a.db.QueryRow(ctx, `
		select id::text, code, discount_type, discount_value, quota, used_count, expires_at, status
		from vouchers
		where upper(code) = $1
	`, code).Scan(&voucherID, &storedCode, &discountTyp, &value, &quota, &used, &expiresAt, &status)
	if errors.Is(err, context.Canceled) {
		return voucherApplyResult{}, "", err
	}
	if err != nil {
		return voucherApplyResult{}, "", errors.New("voucher tidak ditemukan")
	}
	if status != "active" {
		return voucherApplyResult{}, "", errors.New("voucher tidak aktif")
	}
	if expiresAt != nil && expiresAt.Before(time.Now()) {
		return voucherApplyResult{}, "", errors.New("voucher sudah kedaluwarsa")
	}
	if quota > 0 && used >= quota {
		return voucherApplyResult{}, "", errors.New("kuota voucher sudah habis")
	}

	discount := 0
	if discountTyp == "percent" {
		discount = amount * value / 100
	} else {
		discount = value
	}
	if discount < 0 {
		discount = 0
	}
	if discount > amount {
		discount = amount
	}

	return voucherApplyResult{
		Code:           storedCode,
		DiscountType:   discountTyp,
		DiscountValue:  value,
		DiscountAmount: discount,
		FinalAmount:    amount - discount,
	}, voucherID, nil
}

func (a *app) consumeVoucher(ctx context.Context, voucherID string) error {
	tag, err := a.db.Exec(ctx, `
		update vouchers
		set used_count = used_count + 1,
			updated_at = now()
		where id = $1::uuid
			and status = 'active'
			and (expires_at is null or expires_at > now())
			and (quota = 0 or used_count < quota)
	`, voucherID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("kuota voucher sudah habis")
	}
	return nil
}

func (a *app) validateVoucher(w http.ResponseWriter, r *http.Request) {
	var payload voucherValidateRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}
	if payload.AmountIDR <= 0 {
		writeError(w, http.StatusBadRequest, errors.New("amountIdr must be greater than 0"))
		return
	}

	result, _, err := a.validateVoucherCode(r.Context(), payload.Code, payload.AmountIDR)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	writeJSON(w, result)
}

func (a *app) listAdminVouchers(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(r.Context(), `
		select id::text, code, discount_type, discount_value, quota, used_count, expires_at, status, created_at
		from vouchers
		order by created_at desc
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []voucherRecord{}
	for rows.Next() {
		var item voucherRecord
		if err := rows.Scan(
			&item.ID, &item.Code, &item.DiscountType, &item.DiscountValue,
			&item.Quota, &item.UsedCount, &item.ExpiresAt, &item.Status, &item.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}
	writeJSON(w, items)
}

func normalizeVoucherType(value string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "percent":
		return "percent", nil
	case "fixed":
		return "fixed", nil
	default:
		return "", errors.New("discountType must be percent or fixed")
	}
}

func normalizeVoucherStatus(value string) (string, error) {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "active", "paused", "expired":
		return strings.ToLower(strings.TrimSpace(value)), nil
	default:
		return "", errors.New("status must be active, paused, or expired")
	}
}

func (a *app) createAdminVoucher(w http.ResponseWriter, r *http.Request) {
	var payload voucherAdminRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	code := strings.ToUpper(strings.TrimSpace(payload.Code))
	if code == "" {
		writeError(w, http.StatusBadRequest, errors.New("code is required"))
		return
	}
	if payload.DiscountValue < 0 || payload.Quota < 0 {
		writeError(w, http.StatusBadRequest, errors.New("discountValue and quota must be positive"))
		return
	}
	discountType, err := normalizeVoucherType(payload.DiscountType)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
		return
	}
	status := "active"
	if payload.Status != "" {
		status, err = normalizeVoucherStatus(payload.Status)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
	}

	var expiresAt any
	if strings.TrimSpace(payload.ExpiresAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(payload.ExpiresAt))
		if err != nil {
			writeError(w, http.StatusBadRequest, errors.New("expiresAt must be an RFC3339 timestamp"))
			return
		}
		expiresAt = parsed
	}

	var item voucherRecord
	err = a.db.QueryRow(r.Context(), `
		insert into vouchers (code, discount_type, discount_value, quota, expires_at, status)
		values ($1, $2, $3, $4, $5::timestamptz, $6)
		returning id::text, code, discount_type, discount_value, quota, used_count, expires_at, status, created_at
	`, code, discountType, payload.DiscountValue, payload.Quota, expiresAt, status).Scan(
		&item.ID, &item.Code, &item.DiscountType, &item.DiscountValue,
		&item.Quota, &item.UsedCount, &item.ExpiresAt, &item.Status, &item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusConflict, errors.New("voucher sudah ada atau tidak valid"))
		return
	}
	a.auditFromRequest(r, "voucher.create", "voucher", item.ID, map[string]any{"code": item.Code})
	writeJSON(w, item)
}

func (a *app) updateAdminVoucher(w http.ResponseWriter, r *http.Request) {
	voucherID := chi.URLParam(r, "id")
	var payload voucherAdminRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	sets := []string{}
	args := []any{}
	argIndex := 1
	addSet := func(column string, value any) {
		sets = append(sets, column+" = $"+strconv.Itoa(argIndex))
		args = append(args, value)
		argIndex++
	}

	if strings.TrimSpace(payload.DiscountType) != "" {
		discountType, err := normalizeVoucherType(payload.DiscountType)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		addSet("discount_type", discountType)
	}
	if payload.DiscountValue > 0 {
		addSet("discount_value", payload.DiscountValue)
	}
	if payload.Quota > 0 {
		addSet("quota", payload.Quota)
	}
	if strings.TrimSpace(payload.Status) != "" {
		status, err := normalizeVoucherStatus(payload.Status)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		addSet("status", status)
	}
	if strings.TrimSpace(payload.ExpiresAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(payload.ExpiresAt))
		if err != nil {
			writeError(w, http.StatusBadRequest, errors.New("expiresAt must be an RFC3339 timestamp"))
			return
		}
		addSet("expires_at", parsed)
	}
	if len(sets) == 0 {
		writeError(w, http.StatusBadRequest, errors.New("no fields to update"))
		return
	}
	addSet("updated_at", time.Now())
	args = append(args, voucherID)

	var item voucherRecord
	err := a.db.QueryRow(r.Context(), `
		update vouchers
		set `+strings.Join(sets, ", ")+`
		where id = $`+strconv.Itoa(argIndex)+`::uuid
		returning id::text, code, discount_type, discount_value, quota, used_count, expires_at, status, created_at
	`, args...).Scan(
		&item.ID, &item.Code, &item.DiscountType, &item.DiscountValue,
		&item.Quota, &item.UsedCount, &item.ExpiresAt, &item.Status, &item.CreatedAt,
	)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("voucher not found"))
		return
	}
	a.auditFromRequest(r, "voucher.update", "voucher", item.ID, map[string]any{"code": item.Code})
	writeJSON(w, item)
}

func (a *app) deleteAdminVoucher(w http.ResponseWriter, r *http.Request) {
	voucherID := chi.URLParam(r, "id")
	tag, err := a.db.Exec(r.Context(), `delete from vouchers where id = $1::uuid`, voucherID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("voucher not found"))
		return
	}
	a.auditFromRequest(r, "voucher.delete", "voucher", voucherID, nil)
	w.WriteHeader(http.StatusNoContent)
}
