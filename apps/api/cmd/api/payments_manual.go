package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
)

type manualProofRequest struct {
	Tier      string `json:"tier"`
	AmountIDR int    `json:"amountIdr"`
	ProofURL  string `json:"proofUrl"`
	Note      string `json:"note"`
}

type adminPaymentRecord struct {
	ID         string     `json:"id"`
	UserID     string     `json:"userId"`
	UserEmail  string     `json:"userEmail"`
	UserName   string     `json:"userName"`
	Provider   string     `json:"provider"`
	OrderID    string     `json:"orderId"`
	Tier       string     `json:"tier"`
	AmountIDR  int        `json:"amountIdr"`
	Currency   string     `json:"currency"`
	Status     string     `json:"status"`
	ProofURL   string     `json:"proofUrl"`
	ManualNote string     `json:"manualNote"`
	VerifiedAt *time.Time `json:"verifiedAt,omitempty"`
	PaidAt     *time.Time `json:"paidAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
}

func (a *app) submitManualPayment(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	var payload manualProofRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	tn := tierName(strings.TrimSpace(payload.Tier))
	if tn != tierCreator && tn != tierPro && tn != tierBusiness {
		writeError(w, http.StatusBadRequest, errors.New("tier must be creator, pro, or business"))
		return
	}
	if payload.AmountIDR <= 0 {
		writeError(w, http.StatusBadRequest, errors.New("amountIdr must be greater than 0"))
		return
	}
	proofURL := strings.TrimSpace(payload.ProofURL)
	if proofURL == "" {
		writeError(w, http.StatusBadRequest, errors.New("proofUrl is required"))
		return
	}

	orderID := fmt.Sprintf("MANUAL-%s-%d", strings.ToUpper(string(tn)), time.Now().UnixNano())
	idempotency := paymentIdempotency("manual", orderID)
	rawPayload, _ := json.Marshal(map[string]any{
		"source": "user_manual_proof",
		"note":   strings.TrimSpace(payload.Note),
	})

	_, err := a.db.Exec(r.Context(), `
		insert into payments (user_id, provider, provider_order_id, idempotency_key, tier, amount_idr, status, proof_url, raw_payload)
		values ($1::uuid, 'manual', $2, $3, $4, $5, 'pending', $6, $7::jsonb)
	`, user.ID, orderID, idempotency, string(tn), payload.AmountIDR, proofURL, string(rawPayload))
	if err != nil {
		writeError(w, http.StatusInternalServerError, errors.New("failed to save manual payment"))
		return
	}

	writeJSON(w, map[string]any{
		"orderId": orderID,
		"status":  "pending",
	})
}

func (a *app) listAdminPayments(w http.ResponseWriter, r *http.Request) {
	rows, err := a.db.Query(r.Context(), `
		select payments.id::text, payments.user_id::text,
			coalesce(users.email, ''), coalesce(users.display_name, ''),
			payments.provider, payments.provider_order_id, payments.tier, payments.amount_idr,
			payments.currency, payments.status, payments.proof_url, payments.manual_note,
			payments.verified_at, payments.paid_at, payments.created_at
		from payments
		left join users on users.id = payments.user_id
		order by payments.created_at desc
		limit 200
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []adminPaymentRecord{}
	for rows.Next() {
		var item adminPaymentRecord
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.UserEmail, &item.UserName,
			&item.Provider, &item.OrderID, &item.Tier, &item.AmountIDR,
			&item.Currency, &item.Status, &item.ProofURL, &item.ManualNote,
			&item.VerifiedAt, &item.PaidAt, &item.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}
	writeJSON(w, items)
}

func (a *app) verifyManualPayment(w http.ResponseWriter, r *http.Request) {
	paymentID := chi.URLParam(r, "paymentId")

	var userID, tier string
	err := a.db.QueryRow(r.Context(), `
		select user_id::text, tier
		from payments
		where id = $1::uuid
	`, paymentID).Scan(&userID, &tier)
	if err != nil {
		writeError(w, http.StatusNotFound, errors.New("payment not found"))
		return
	}

	tn := tierName(tier)
	expiresAt := tierExpiry(tn, time.Now())

	tx, err := a.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer tx.Rollback(r.Context())

	if _, err := tx.Exec(r.Context(), `
		update payments
		set status = 'paid',
			verified_at = now(),
			paid_at = coalesce(paid_at, now()),
			updated_at = now()
		where id = $1::uuid
	`, paymentID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if _, err := tx.Exec(r.Context(), `
		update users
		set tier = $2,
			tier_expires_at = $3,
			updated_at = now()
		where id = $1::uuid
	`, userID, string(tn), expiresAt); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	var amountIDR int
	var userName, userEmail string
	_ = a.db.QueryRow(r.Context(), `select display_name, email from users where id = $1`, userID).Scan(&userName, &userEmail)
	_ = a.db.QueryRow(r.Context(), `select amount_idr from payments where id = $1::uuid`, paymentID).Scan(&amountIDR)
	if userEmail != "" {
		go emailPaymentConfirmation(userName, userEmail, string(tn), amountIDR)
	}

	a.auditFromRequest(r, "payment.verify", "payment", paymentID, map[string]any{"tier": string(tn), "userId": userID})

	writeJSON(w, map[string]any{
		"id":            paymentID,
		"tier":          tn,
		"status":        "paid",
		"tierExpiresAt": expiresAt,
	})
}

func (a *app) rejectManualPayment(w http.ResponseWriter, r *http.Request) {
	paymentID := chi.URLParam(r, "paymentId")

	var payload struct {
		Note string `json:"note"`
	}
	_ = json.NewDecoder(r.Body).Decode(&payload)

	tag, err := a.db.Exec(r.Context(), `
		update payments
		set status = 'failed',
			manual_note = $2,
			updated_at = now()
		where id = $1::uuid and status = 'pending'
	`, paymentID, strings.TrimSpace(payload.Note))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, errors.New("pending payment not found"))
		return
	}
	a.auditFromRequest(r, "payment.reject", "payment", paymentID, map[string]any{"note": strings.TrimSpace(payload.Note)})
	writeJSON(w, map[string]any{"id": paymentID, "status": "failed"})
}

func (a *app) downgradeExpiredTiers(ctx context.Context) (int64, error) {
	tag, err := a.db.Exec(ctx, `
		update users
		set tier = 'free',
			tier_expires_at = null,
			updated_at = now()
		where tier <> 'free'
			and tier_expires_at is not null
			and tier_expires_at < now()
	`)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}
