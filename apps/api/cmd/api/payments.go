package main

import (
	"errors"
	"net/http"
	"time"
)

type paymentRecord struct {
	ID          string     `json:"id"`
	Provider    string     `json:"provider"`
	OrderID     string     `json:"orderId"`
	Tier        string     `json:"tier"`
	AmountIDR   int        `json:"amountIdr"`
	Currency    string     `json:"currency"`
	Status      string     `json:"status"`
	CheckoutURL string     `json:"checkoutUrl"`
	PaidAt      *time.Time `json:"paidAt,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

func (a *app) listPayments(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select id::text, provider, provider_order_id, tier, amount_idr, currency, status,
			checkout_url, paid_at, created_at
		from payments
		where user_id = $1::uuid
		order by created_at desc
		limit 100
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []paymentRecord{}
	for rows.Next() {
		var item paymentRecord
		if err := rows.Scan(
			&item.ID, &item.Provider, &item.OrderID, &item.Tier, &item.AmountIDR,
			&item.Currency, &item.Status, &item.CheckoutURL, &item.PaidAt, &item.CreatedAt,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}

	writeJSON(w, items)
}
