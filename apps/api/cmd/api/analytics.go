package main

import (
	"errors"
	"net/http"
	"strconv"
	"time"
)

type analyticsDayPoint struct {
	Day            string `json:"day"`
	PageViews      int    `json:"pageViews"`
	UniqueVisitors int    `json:"uniqueVisitors"`
	RSVPSubmits    int    `json:"rsvpSubmits"`
	ShareClicks    int    `json:"shareClicks"`
	Publishes      int    `json:"publishes"`
	UpgradeClicks  int    `json:"upgradeClicks"`
}

type analyticsTotals struct {
	PageViews      int `json:"pageViews"`
	UniqueVisitors int `json:"uniqueVisitors"`
	RSVPTotal      int `json:"rsvpTotal"`
	ShareClicks    int `json:"shareClicks"`
}

type analyticsTopInvitation struct {
	Slug      string `json:"slug"`
	Couple    string `json:"couple"`
	PageViews int    `json:"pageViews"`
	RSVPCount int    `json:"rsvpCount"`
}

type realtimeEvent struct {
	EventName string    `json:"eventName"`
	Slug      string    `json:"slug"`
	GuestName string    `json:"guestName"`
	CreatedAt time.Time `json:"createdAt"`
}

func (a *app) analyticsOverview(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	days := 30
	if raw := r.URL.Query().Get("days"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 365 {
			days = parsed
		}
	}

	rows, err := a.db.Query(r.Context(), `
		select to_char(date_trunc('day', e.created_at), 'YYYY-MM-DD') as day,
			count(*) filter (where e.event_name = 'page_view'),
			count(distinct e.visitor_id) filter (where e.event_name = 'page_view'),
			count(*) filter (where e.event_name = 'rsvp_submit'),
			count(*) filter (where e.event_name = 'share_click'),
			count(*) filter (where e.event_name = 'publish'),
			count(*) filter (where e.event_name = 'upgrade_click')
		from events e
		join invitations i on i.id = e.invitation_id
		where i.user_id = $1::uuid
			and e.created_at >= now() - ($2 || ' days')::interval
		group by 1
		order by 1
	`, user.ID, strconv.Itoa(days))
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	points := []analyticsDayPoint{}
	totals := analyticsTotals{}
	for rows.Next() {
		var point analyticsDayPoint
		if err := rows.Scan(
			&point.Day, &point.PageViews, &point.UniqueVisitors,
			&point.RSVPSubmits, &point.ShareClicks, &point.Publishes, &point.UpgradeClicks,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		points = append(points, point)
		totals.PageViews += point.PageViews
		totals.UniqueVisitors += point.UniqueVisitors
		totals.ShareClicks += point.ShareClicks
	}

	if err := a.db.QueryRow(r.Context(), `
		select count(*)
		from rsvps
		join invitations on invitations.id = rsvps.invitation_id
		where invitations.user_id = $1::uuid
	`, user.ID).Scan(&totals.RSVPTotal); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	topRows, err := a.db.Query(r.Context(), `
		select i.slug, i.couple,
			count(*) filter (where e.event_name = 'page_view'),
			(select count(*) from rsvps where rsvps.invitation_id = i.id)
		from invitations i
		left join events e on e.invitation_id = i.id
		where i.user_id = $1::uuid
		group by i.id
		order by 3 desc
		limit 5
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer topRows.Close()

	top := []analyticsTopInvitation{}
	for topRows.Next() {
		var item analyticsTopInvitation
		if err := topRows.Scan(&item.Slug, &item.Couple, &item.PageViews, &item.RSVPCount); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		top = append(top, item)
	}

	writeJSON(w, map[string]any{
		"days":           points,
		"totals":         totals,
		"topInvitations": top,
	})
}

func (a *app) analyticsRealtime(w http.ResponseWriter, r *http.Request) {
	user, ok := currentUserFromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, errors.New("authentication required"))
		return
	}

	rows, err := a.db.Query(r.Context(), `
		select e.event_name, coalesce(i.slug, ''),
			coalesce(e.properties->>'guestName', ''),
			e.created_at
		from events e
		join invitations i on i.id = e.invitation_id
		where i.user_id = $1::uuid
			and e.created_at >= now() - interval '30 minutes'
		order by e.created_at desc
		limit 25
	`, user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	items := []realtimeEvent{}
	for rows.Next() {
		var item realtimeEvent
		if err := rows.Scan(&item.EventName, &item.Slug, &item.GuestName, &item.CreatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		items = append(items, item)
	}
	writeJSON(w, items)
}
