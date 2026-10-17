package main

import (
	"bytes"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type midtransSnapRequest struct {
	TransactionDetails midtransTransactionDetails `json:"transaction_details"`
	CustomerDetails    midtransCustomerDetails    `json:"customer_details"`
	EnabledPayments    []string                   `json:"enabled_payments"`
	Items              []midtransItem             `json:"items"`
	Callbacks          *midtransCallbacks         `json:"callbacks,omitempty"`
	Expiry             *midtransExpiry             `json:"expiry,omitempty"`
}

type midtransTransactionDetails struct {
	OrderID     string `json:"order_id"`
	GrossAmount int    `json:"gross_amount"`
}

type midtransCustomerDetails struct {
	FirstName string `json:"first_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

type midtransItem struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Price int    `json:"price"`
	Qty   int    `json:"qty"`
}

type midtransCallbacks struct {
	Finish string `json:"finish"`
}

type midtransExpiry struct {
	Start       string `json:"start"`
	Duration    int    `json:"duration"`
	Unit        string `json:"unit"`
}

type midtransSnapResponse struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

type midtransNotification struct {
	TransactionType     string `json:"transaction_type"`
	OrderID             string `json:"order_id"`
	TransactionID       string `json:"transaction_id"`
	GrossAmount         string `json:"gross_amount"`
	StatusCode          string `json:"status_code"`
	TransactionStatus   string `json:"transaction_status"`
	FraudStatus         string `json:"fraud_status"`
	SignatureKey        string `json:"signature_key"`
	PaymentType         string `json:"payment_type"`
	TransactionTime     string `json:"transaction_time"`
	SettlementTime      string `json:"settlement_time"`
	StatusMessage       string `json:"status_message"`
	MerchantID          string `json:"merchant_id"`
	ChannelResponseCode string `json:"channel_response_code"`
}

type createPaymentRequest struct {
	InvitationSlug string `json:"invitationSlug"`
	Tier           string `json:"tier"`
	AmountIDR      int    `json:"amountIdr"`
	Email          string `json:"email"`
	Name           string `json:"name"`
	Phone          string `json:"phone"`
	VoucherCode    string `json:"voucherCode"`
}

type paymentLinkResponse struct {
	PaymentURL string `json:"paymentUrl"`
	OrderID    string `json:"orderId"`
	Token      string `json:"token"`
}

func midtransBaseURL() string {
	return env("MIDTRANS_BASE_URL", "https://app.sandbox.midtrans.com")
}

func midtransServerKey() string {
	return env("MIDTRANS_SERVER_KEY", "")
}

func midtransClientKey() string {
	return env("MIDTRANS_CLIENT_KEY", "")
}

func midtransWebhookSecret() string {
	return env("MIDTRANS_WEBHOOK_SECRET", "")
}

func midtransIsValid() bool {
	return midtransServerKey() != ""
}

func (a *app) createMidtransPayment(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	if !midtransIsValid() {
		writeError(w, http.StatusServiceUnavailable, errors.New("payment gateway not configured"))
		return
	}

	var payload createPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json payload"))
		return
	}

	payload.InvitationSlug = strings.TrimSpace(payload.InvitationSlug)
	payload.Tier = strings.TrimSpace(payload.Tier)
	payload.Email = strings.TrimSpace(payload.Email)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.Phone = strings.TrimSpace(payload.Phone)

	if payload.Tier == "" || payload.Tier == string(tierFree) {
		writeError(w, http.StatusBadRequest, errors.New("tier must be creator, pro, or business"))
		return
	}
	if payload.AmountIDR <= 0 {
		writeError(w, http.StatusBadRequest, errors.New("amountIdr must be greater than 0"))
		return
	}

	tn := tierName(payload.Tier)
	if tn != tierCreator && tn != tierPro && tn != tierBusiness {
		writeError(w, http.StatusBadRequest, errors.New("tier must be creator, pro, or business"))
		return
	}

	chargeAmount := payload.AmountIDR
	voucherID := ""
	voucherCode := ""
	discountAmount := 0
	if strings.TrimSpace(payload.VoucherCode) != "" {
		applied, vid, err := a.validateVoucherCode(r.Context(), payload.VoucherCode, payload.AmountIDR)
		if err != nil {
			writeError(w, http.StatusBadRequest, err)
			return
		}
		voucherID = vid
		voucherCode = applied.Code
		discountAmount = applied.DiscountAmount
		chargeAmount = applied.FinalAmount
	}
	if chargeAmount <= 0 {
		writeError(w, http.StatusBadRequest, errors.New("total pembayaran setelah voucher tidak valid"))
		return
	}

	orderID := fmt.Sprintf("LU-%s-%d", strings.ToUpper(string(tn)), time.Now().UnixNano())
	idempotency := paymentIdempotency("midtrans", orderID)

	rawPayload, _ := json.Marshal(map[string]any{
		"source":         "user_checkout",
		"tier":           payload.Tier,
		"originalAmount": payload.AmountIDR,
		"discountAmount": discountAmount,
		"voucherCode":    voucherCode,
	})

	// Save pending payment
	_, err := a.db.Exec(r.Context(), `
		insert into payments (user_id, provider, provider_order_id, idempotency_key, tier, amount_idr, status, raw_payload)
		values ($1::uuid, 'midtrans', $2, $3, $4, $5, 'pending', $6::jsonb)
	`, user.ID, orderID, idempotency, string(tn), chargeAmount, string(rawPayload))
	if err != nil {
		writeError(w, http.StatusInternalServerError, errors.New("failed to save payment record"))
		return
	}

	// Create Midtrans Snap transaction
	baseURL := midtransBaseURL()
	snapReq := midtransSnapRequest{
		TransactionDetails: midtransTransactionDetails{
			OrderID:     orderID,
			GrossAmount: chargeAmount,
		},
		CustomerDetails: midtransCustomerDetails{
			FirstName: payload.Name,
			Email:     payload.Email,
			Phone:     payload.Phone,
		},
		EnabledPayments: []string{"credit_card", "gopay", "shopeepay", "bank_transfer", "echannel", "qris"},
		Items: []midtransItem{
			{
				ID:    string(tn),
				Name:  fmt.Sprintf("LinkUndang %s Package", strings.Title(string(tn))),
				Price: chargeAmount,
				Qty:   1,
			},
		},
		Callbacks: &midtransCallbacks{
			Finish: env("MIDTRANS_CALLBACK_FINISH", "https://linkundang.web.id/dashboard"),
		},
		Expiry: &midtransExpiry{
			Duration: 24,
			Unit:     "hour",
		},
	}

	reqBody, _ := json.Marshal(snapReq)
	req, err := http.NewRequest("POST", baseURL+"/snap/v1/transactions", bytes.NewReader(reqBody))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(midtransServerKey(), "")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		writeError(w, http.StatusBadGateway, errors.New("failed to connect to payment gateway"))
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusCreated {
		log.Printf("midtrans snap error: status=%d body=%s", resp.StatusCode, string(respBody))
		writeError(w, http.StatusBadGateway, errors.New("payment gateway returned error"))
		return
	}

	var snapResp midtransSnapResponse
	if err := json.Unmarshal(respBody, &snapResp); err != nil {
		writeError(w, http.StatusInternalServerError, errors.New("invalid payment gateway response"))
		return
	}

	// Update payment with snap token
	_, err = a.db.Exec(r.Context(), `
		update payments
		set raw_payload = raw_payload || '{"snapToken": "' + $1 + '"}'::jsonb,
			updated_at = now()
		where provider_order_id = $2 and provider = 'midtrans'
	`, snapResp.Token, orderID)
	if err != nil {
		log.Printf("failed to update payment snap token: %v", err)
	}

	if voucherID != "" {
		if err := a.consumeVoucher(r.Context(), voucherID); err != nil {
			log.Printf("failed to consume voucher %s: %v", voucherCode, err)
		}
	}

	writeJSON(w, paymentLinkResponse{
		PaymentURL: snapResp.RedirectURL,
		OrderID:    orderID,
		Token:      snapResp.Token,
	})
}

func (a *app) midtransWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		writeError(w, http.StatusBadRequest, errors.New("cannot read body"))
		return
	}
	defer r.Body.Close()

	var notification midtransNotification
	if err := json.Unmarshal(body, &notification); err != nil {
		writeError(w, http.StatusBadRequest, errors.New("invalid json"))
		return
	}

	// Verify signature
	webhookSecret := midtransWebhookSecret()
	if webhookSecret != "" {
		signatureString := notification.OrderID + notification.StatusCode + notification.GrossAmount + webhookSecret
		hash := sha512.Sum512([]byte(signatureString))
		expectedSignature := hex.EncodeToString(hash[:])
		if !strings.EqualFold(notification.SignatureKey, expectedSignature) {
			log.Printf("midtrans webhook invalid signature: order=%s", notification.OrderID)
			writeError(w, http.StatusUnauthorized, errors.New("invalid signature"))
			return
		}
	}

	// Find payment
	var paymentID string
	var userID string
	var tier string
	var amountIDR int
	err = a.db.QueryRow(r.Context(), `
		select id::text, user_id::text, tier, amount_idr
		from payments
		where provider = 'midtrans' and provider_order_id = $1
	`, notification.OrderID).Scan(&paymentID, &userID, &tier, &amountIDR)
	if err != nil {
		log.Printf("midtrans webhook payment not found: order=%s", notification.OrderID)
		writeError(w, http.StatusNotFound, errors.New("payment not found"))
		return
	}

	// Determine status
	status := notification.TransactionStatus
	paymentStatus := "pending"
	if status == "capture" || status == "settlement" {
		if notification.FraudStatus == "accept" {
			paymentStatus = "paid"
		}
	} else if status == "deny" || status == "cancel" || status == "expire" {
		paymentStatus = "failed"
	}

	// Update payment record
	_, err = a.db.Exec(r.Context(), `
		update payments
		set status = $2,
			raw_payload = raw_payload || $3::jsonb,
			paid_at = case when $2 = 'paid' then coalesce(paid_at, now()) else paid_at end,
			updated_at = now()
		where id = $1::uuid
	`, paymentID, paymentStatus, string(body))
	if err != nil {
		log.Printf("midtrans webhook update payment error: %v", err)
		writeError(w, http.StatusInternalServerError, errors.New("failed to update payment"))
		return
	}

	// If paid, upgrade user tier
	if paymentStatus == "paid" {
		tn := tierName(tier)
		expiresAt := tierExpiry(tn, time.Now())
		_, err = a.db.Exec(r.Context(), `
			update users
			set tier = $2,
				tier_expires_at = $3,
				updated_at = now()
			where id = $1::uuid
		`, userID, tier, expiresAt)
		if err != nil {
			log.Printf("midtrans webhook upgrade user error: %v", err)
		} else {
			log.Printf("midtrans webhook: user %s upgraded to %s", userID, tier)
			// Send payment confirmation email (non-blocking)
			var userName, userEmail string
			_ = a.db.QueryRow(r.Context(), `select display_name, email from users where id = $1`, userID).Scan(&userName, &userEmail)
			if userEmail != "" {
				go emailPaymentConfirmation(userName, userEmail, tier, amountIDR)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

func (a *app) getMidtransConfig(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]any{
		"clientKey":  midtransClientKey(),
		"isEnabled":  midtransIsValid(),
		"baseURL":    midtransBaseURL(),
	})
}
