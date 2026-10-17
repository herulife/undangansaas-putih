package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

func migrate(ctx context.Context, db *pgxpool.Pool) error {
	_, err := db.Exec(ctx, `
		create extension if not exists pgcrypto;

		create table if not exists templates (
			id uuid primary key default gen_random_uuid(),
			name text not null,
			slug text not null unique,
			category text not null default 'premium',
			created_at timestamptz not null default now()
		);

		create table if not exists invitations (
			id uuid primary key default gen_random_uuid(),
			template_id uuid not null references templates(id),
			slug text not null unique,
			couple text not null,
			event_date date not null,
			status text not null default 'draft',
			content jsonb not null default '{}'::jsonb,
			created_at timestamptz not null default now()
		);

		create table if not exists rsvps (
			id uuid primary key default gen_random_uuid(),
			invitation_id uuid not null references invitations(id) on delete cascade,
			name text not null,
			message text not null default '',
			status text not null default 'pending',
			guests integer not null default 1,
			created_at timestamptz not null default now()
		);

		create table if not exists users (
			id uuid primary key default gen_random_uuid(),
			email text not null,
			password_hash text,
			display_name text not null default '',
			role text not null default 'user',
			tier text not null default 'free',
			status text not null default 'active',
			tier_expires_at timestamptz,
			is_b2b boolean not null default false,
			client_limit integer not null default 1,
			created_at timestamptz not null default now(),
			updated_at timestamptz not null default now()
		);

		alter table users add column if not exists password_hash text;
		alter table users add column if not exists display_name text not null default '';
		alter table users add column if not exists role text not null default 'user';
		alter table users add column if not exists tier text not null default 'free';
		alter table users add column if not exists status text not null default 'active';
		alter table users add column if not exists tier_expires_at timestamptz;
		alter table users add column if not exists is_b2b boolean not null default false;
		alter table users add column if not exists client_limit integer not null default 1;
		alter table users add column if not exists token_version integer not null default 0;
		alter table users add column if not exists updated_at timestamptz not null default now();
		alter table users add column if not exists email_verified boolean not null default false;
		alter table users add column if not exists email_verified_at timestamptz;

		create unique index if not exists users_email_lower_unique on users (lower(email));
		create index if not exists users_tier_expires_at_idx on users (tier, tier_expires_at);

		do $$
		begin
			if not exists (select 1 from pg_constraint where conname = 'users_role_check') then
				alter table users add constraint users_role_check
					check (role in ('user', 'admin', 'reseller', 'client'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'users_tier_check') then
				alter table users add constraint users_tier_check
					check (tier in ('free', 'creator', 'pro', 'business'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'users_status_check') then
				alter table users add constraint users_status_check
					check (status in ('active', 'suspended'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'users_client_limit_check') then
				alter table users add constraint users_client_limit_check
					check (client_limit >= 0);
			end if;
		end $$;

		create table if not exists auth_tokens (
			id uuid primary key default gen_random_uuid(),
			user_id uuid not null references users(id) on delete cascade,
			token_hash text not null,
			purpose text not null,
			expires_at timestamptz not null,
			used_at timestamptz,
			created_at timestamptz not null default now()
		);

		create unique index if not exists auth_tokens_hash_unique on auth_tokens (token_hash);
		create index if not exists auth_tokens_user_purpose_idx on auth_tokens (user_id, purpose, created_at desc);
		create index if not exists auth_tokens_expires_idx on auth_tokens (expires_at);

		do $$
		begin
			if not exists (select 1 from pg_constraint where conname = 'auth_tokens_purpose_check') then
				alter table auth_tokens add constraint auth_tokens_purpose_check
					check (purpose in ('email_verification', 'password_reset'));
			end if;
		end $$;

		alter table templates add column if not exists config_schema jsonb not null default '{}'::jsonb;
		alter table templates add column if not exists tier_access text[] not null default array['free', 'creator', 'pro', 'business'];
		alter table templates add column if not exists assets_url text not null default '';
		alter table templates add column if not exists preview_url text not null default '';
		alter table templates add column if not exists is_active boolean not null default true;
		alter table templates add column if not exists updated_at timestamptz not null default now();

		create index if not exists templates_active_category_idx on templates (is_active, category);
		create index if not exists templates_tier_access_gin_idx on templates using gin (tier_access);

		alter table invitations add column if not exists user_id uuid references users(id) on delete set null;
		alter table invitations add column if not exists title text not null default '';
		alter table invitations add column if not exists config jsonb not null default '{}'::jsonb;
		alter table invitations add column if not exists custom_domain text;
		alter table invitations add column if not exists dynamic_og_enabled boolean not null default false;
		alter table invitations add column if not exists watermark_enabled boolean not null default true;
		alter table invitations add column if not exists published_at timestamptz;
		alter table invitations add column if not exists updated_at timestamptz not null default now();
		alter table invitations add column if not exists deleted_at timestamptz;

		update invitations
		set title = couple
		where title = '';

		create index if not exists invitations_user_created_at_idx on invitations (user_id, created_at desc);
		create index if not exists invitations_status_idx on invitations (status);
		create index if not exists invitations_deleted_at_idx on invitations (deleted_at);
		create unique index if not exists invitations_custom_domain_unique
			on invitations (lower(custom_domain))
			where custom_domain is not null and custom_domain <> '';

		create table if not exists payments (
			id uuid primary key default gen_random_uuid(),
			user_id uuid not null references users(id) on delete cascade,
			provider text not null,
			provider_order_id text not null,
			idempotency_key text not null,
			tier text not null,
			amount_idr integer not null,
			currency char(3) not null default 'IDR',
			status text not null,
			raw_payload jsonb not null default '{}'::jsonb,
			paid_at timestamptz,
			created_at timestamptz not null default now(),
			updated_at timestamptz not null default now()
		);

		create unique index if not exists payments_provider_order_unique on payments (provider, provider_order_id);
		create unique index if not exists payments_idempotency_unique on payments (idempotency_key);
		create index if not exists payments_user_created_at_idx on payments (user_id, created_at desc);

		alter table payments add column if not exists checkout_url text not null default '';
		alter table payments add column if not exists refunded_at timestamptz;
		alter table payments add column if not exists proof_url text not null default '';
		alter table payments add column if not exists verified_at timestamptz;
		alter table payments add column if not exists manual_note text not null default '';

		do $$
		begin
			if not exists (select 1 from pg_constraint where conname = 'payments_provider_check') then
				alter table payments add constraint payments_provider_check
					check (provider in ('midtrans', 'xendit', 'manual'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'payments_status_check') then
				alter table payments add constraint payments_status_check
					check (status in ('pending', 'settlement', 'paid', 'failed', 'expired', 'refunded', 'cancelled'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'payments_tier_check') then
				alter table payments add constraint payments_tier_check
					check (tier in ('creator', 'pro', 'business'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'payments_amount_check') then
				alter table payments add constraint payments_amount_check
					check (amount_idr >= 0);
			end if;
		end $$;

		create table if not exists vouchers (
			id uuid primary key default gen_random_uuid(),
			code text not null unique,
			discount_type text not null default 'percent',
			discount_value integer not null default 0,
			quota integer not null default 0,
			used_count integer not null default 0,
			expires_at timestamptz,
			status text not null default 'active',
			created_at timestamptz not null default now(),
			updated_at timestamptz not null default now()
		);

		create index if not exists vouchers_status_expires_idx on vouchers (status, expires_at);

		do $$
		begin
			if not exists (select 1 from pg_constraint where conname = 'vouchers_discount_type_check') then
				alter table vouchers add constraint vouchers_discount_type_check
					check (discount_type in ('percent', 'fixed'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'vouchers_status_check') then
				alter table vouchers add constraint vouchers_status_check
					check (status in ('active', 'paused', 'expired'));
			end if;
			if not exists (select 1 from pg_constraint where conname = 'vouchers_value_check') then
				alter table vouchers add constraint vouchers_value_check
					check (discount_value >= 0 and quota >= 0 and used_count >= 0);
			end if;
		end $$;

		create table if not exists guests (
			id uuid primary key default gen_random_uuid(),
			user_id uuid not null references users(id) on delete cascade,
			invitation_id uuid not null references invitations(id) on delete cascade,
			name text not null,
			phone text not null default '',
			status text not null default 'draft',
			personal_url text not null default '',
			sent_at timestamptz,
			opened_at timestamptz,
			created_at timestamptz not null default now(),
			updated_at timestamptz not null default now()
		);

		create index if not exists guests_user_created_idx on guests (user_id, created_at desc);
		create index if not exists guests_invitation_status_idx on guests (invitation_id, status);
		create unique index if not exists guests_invitation_phone_unique
			on guests (invitation_id, phone)
			where phone <> '';

		do $$
		begin
			if not exists (select 1 from pg_constraint where conname = 'guests_status_check') then
				alter table guests add constraint guests_status_check
					check (status in ('draft', 'sent', 'opened', 'failed'));
			end if;
		end $$;

		alter table rsvps add column if not exists guest_id uuid references guests(id) on delete set null;
		create index if not exists rsvps_guest_id_idx on rsvps (guest_id);

		create table if not exists media_assets (
			id uuid primary key default gen_random_uuid(),
			user_id uuid references users(id) on delete set null,
			file_name text not null,
			url text not null,
			media_type text not null,
			provider text not null default 'local',
			size_bytes bigint not null default 0,
			created_at timestamptz not null default now()
		);

		create index if not exists media_assets_created_idx on media_assets (created_at desc);
		create index if not exists media_assets_user_type_idx on media_assets (user_id, media_type);

		create table if not exists audit_logs (
			id uuid primary key default gen_random_uuid(),
			actor_id uuid references users(id) on delete set null,
			actor_email text,
			action text not null,
			target_type text,
			target_id text,
			metadata jsonb,
			ip text,
			created_at timestamptz not null default now()
		);

		create index if not exists audit_logs_created_idx on audit_logs (created_at desc);
		create index if not exists audit_logs_actor_idx on audit_logs (actor_id);

		create table if not exists custom_domains (
			id uuid primary key default gen_random_uuid(),
			user_id uuid not null references users(id) on delete cascade,
			domain text not null,
			invitation_id uuid references invitations(id) on delete set null,
			status text not null default 'pending',
			verified_at timestamptz,
			created_at timestamptz not null default now(),
			updated_at timestamptz not null default now()
		);

		create unique index if not exists custom_domains_domain_unique on custom_domains (lower(domain));
		create index if not exists custom_domains_user_status_idx on custom_domains (user_id, status);

		do $$
		begin
			if not exists (select 1 from pg_constraint where conname = 'custom_domains_status_check') then
				alter table custom_domains add constraint custom_domains_status_check
					check (status in ('pending', 'verified', 'active', 'failed'));
			end if;
		end $$;

		create table if not exists events (
			id uuid primary key default gen_random_uuid(),
			user_id uuid references users(id) on delete set null,
			invitation_id uuid references invitations(id) on delete cascade,
			event_name text not null,
			visitor_id text,
			ip_hash text,
			user_agent text,
			properties jsonb not null default '{}'::jsonb,
			created_at timestamptz not null default now()
		);

		create index if not exists events_invitation_created_at_idx on events (invitation_id, created_at desc);
		create index if not exists events_user_created_at_idx on events (user_id, created_at desc);
		create index if not exists events_name_created_at_idx on events (event_name, created_at desc);

		alter table events drop constraint if exists events_name_check;
		alter table events add constraint events_name_check
			check (event_name in ('page_view', 'rsvp_submit', 'share_click', 'upgrade_click', 'publish', 'export_csv', 'guest_opened', 'payment_checkout', 'payment_success', 'whatsapp_send'));

		create table if not exists app_settings (
			key text primary key,
			value text not null default '',
			is_secret boolean not null default false,
			updated_at timestamptz not null default now()
		);

		create index if not exists app_settings_updated_at_idx on app_settings (updated_at desc);

		insert into app_settings (key, value, is_secret)
		values
			('payment.manual.instructions', 'Transfer sesuai nominal invoice, lalu upload bukti pembayaran. Admin akan memverifikasi dan mengaktifkan paket setelah dana masuk.', false),
			('payment.manual.bank_name', '', false),
			('payment.manual.account_number', '', false),
			('payment.manual.account_name', '', false),
			('payment.manual.qris_url', '', false),
			('payment.manual.whatsapp', '', false)
		on conflict (key) do nothing;

		update users
		set tier = 'free',
			tier_expires_at = null,
			updated_at = now()
		where tier <> 'free'
			and tier_expires_at is not null
			and tier_expires_at < now() - interval '3 days';

		insert into users (email, display_name, password_hash, role, tier, tier_expires_at, is_b2b, client_limit, status, email_verified, email_verified_at)
		values
			('demo@linkundang.web.id', 'Demo User', '$2a$10$I02QIHEtdAg8OlZRnQp35uZz80GxryhJR.H3x99gl9x.x4Kuqme1K', 'user', 'creator', now() + interval '12 months', false, 1, 'active', true, now()),
			('admin@linkundang.web.id', 'Demo Admin', '$2a$10$g0owyT3cTlWNOCfK/NZDlefxnIgLAV1VOJ6tltY150bsO4pZRh5dK', 'admin', 'business', now() + interval '12 months', true, 50, 'active', true, now())
		on conflict ((lower(email))) do update
		set display_name = excluded.display_name,
			password_hash = excluded.password_hash,
			role = excluded.role,
			tier = excluded.tier,
			tier_expires_at = excluded.tier_expires_at,
			is_b2b = excluded.is_b2b,
			client_limit = excluded.client_limit,
			status = excluded.status,
			email_verified = excluded.email_verified,
			email_verified_at = excluded.email_verified_at,
			updated_at = now();

		insert into templates (name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active)
		values
			(
				'Adat Jawa Klasik',
				'adat-jawa',
				'wedding',
				'{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['free', 'creator', 'pro', 'business'],
				'/template-assets/adat-jawa-alyssa-rayhan-katsudoto',
				'/preview/template-adat-jawa',
				true
			),
			(
				'Adat Jawa Cepat',
				'adat-jawa-lottie',
				'wedding',
				'{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/adat-jawa-alyssa-rayhan-optimized',
				'/preview/template-adat-jawa-lottie',
				true
			),
			(
				'Klasik Hijau Emas',
				'klasik-hijau-emas',
				'wedding',
				'{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"}}}'::jsonb,
				array['free', 'creator', 'pro', 'business'],
				'/assets/templates/klasik-hijau-emas',
				'/templates',
				true
			),
			(
				'Premium 042 - Wayang Batik',
				'premium-042',
				'wedding',
				'{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"music":{"type":"string"}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/wedding-premium042-wayang-batik',
				'/preview/template-042',
				true
			),
			(
				'Premium 074 - Indonesia Editorial',
				'premium-074',
				'wedding',
				'{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"music":{"type":"string"}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/wedding-premium074-indonesia-editorial',
				'/preview/template-074',
				true
			)
		on conflict (slug) do update
		set name = excluded.name,
			category = excluded.category,
			config_schema = excluded.config_schema,
			tier_access = excluded.tier_access,
			assets_url = excluded.assets_url,
			preview_url = excluded.preview_url,
			is_active = excluded.is_active,
			updated_at = now();

		insert into vouchers (code, discount_type, discount_value, quota, expires_at, status)
		values
			('LAUNCH20', 'percent', 20, 500, now() + interval '90 days', 'active'),
			('WO-BUSINESS', 'fixed', 50000, 200, now() + interval '180 days', 'active')
		on conflict (code) do update
		set discount_type = excluded.discount_type,
			discount_value = excluded.discount_value,
			quota = excluded.quota,
			expires_at = excluded.expires_at,
			status = excluded.status,
			updated_at = now();

		insert into invitations (template_id, slug, couple, event_date, status)
		select id, 'joko-cikita', 'Joko & Cikita', '2026-06-20', 'published'
		from templates
		where slug = 'adat-jawa'
		on conflict (slug) do nothing;

		insert into invitations (template_id, slug, couple, event_date, status)
		select id, 'rama-shinta', 'Rama & Shinta', '2026-08-12', 'published'
		from templates
		where slug = 'klasik-hijau-emas'
		on conflict (slug) do nothing;

		insert into templates (name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active)
		values
			('Wedding Premium 050', 'wedding-premium050-pixel-clean', 'Wedding', '{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"city":{"type":"string"},"gift":{"type":"object"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb, array['creator', 'pro', 'business'], '/template-assets/wedding-premium050-pixel-clean', '/preview/template-pixel-clean', true)
		on conflict (slug) do update
		set name = excluded.name,
			category = excluded.category,
			config_schema = excluded.config_schema,
			tier_access = excluded.tier_access,
			assets_url = excluded.assets_url,
			preview_url = excluded.preview_url,
			is_active = excluded.is_active,
			updated_at = now();

		insert into templates (name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active)
		values
			(
				'Adat Jawa 050 Klasik',
				'adat-jawa-050-klasik',
				'Wedding',
				'{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/adat-jawa-050-klasik-alyssa-rayhan',
				'/preview/template-adat-jawa-050-klasik',
				true
			),
			(
				'Adat Sunda 050 Pro',
				'adat-sunda-050-pro',
				'Wedding',
				'{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/adat-sunda-050-pro-raras-danis',
				'/preview/template-adat-sunda-050-pro',
				true
			),
			(
				'Adat Sunda 050 Style',
				'adat-sunda-050-style',
				'Wedding',
				'{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/adat-sunda-050-style-adapted',
				'/preview/template-adat-sunda-050-style',
				true
			),
			(
				'Minang 050 Klasik',
				'adat-minang-050-klasik',
				'Wedding',
				'{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/adat-minang-050-klasik-zahra-fadli',
				'/preview/template-adat-minang-050-klasik',
				true
			),
			(
				'Wedding Premium 050 Floral',
				'wedding-premium050-floral-elegant',
				'Wedding',
				'{"type":"object","required":["bride","groom","eventDate","venue"],"properties":{"bride":{"type":"string"},"groom":{"type":"string"},"eventDate":{"type":"string","format":"date"},"venue":{"type":"string"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
				array['creator', 'pro', 'business'],
				'/template-assets/wedding-premium050-floral-elegant',
				'/preview/template-floral-elegant',
				true
			)
		on conflict (slug) do update
		set name = excluded.name,
			category = excluded.category,
			config_schema = excluded.config_schema,
			tier_access = excluded.tier_access,
			assets_url = excluded.assets_url,
			preview_url = excluded.preview_url,
			is_active = excluded.is_active,
			updated_at = now();

		insert into invitations (template_id, slug, title, couple, event_date, status, config)
		select id, 'rara-dimas', 'Rara & Dimas', 'Rara Wijaya & Dimas Putra', '2026-06-12', 'published',
			'{"bride":"Rara Wijaya","groom":"Dimas Putra","venue":"Hotel Mulia, Jakarta","city":"Jakarta","akadTime":"08.00 WIB","receptionTime":"11.00 WIB","gift":{"bank":"BCA","account":"1234567890"}}'::jsonb
		from templates
		where slug = 'wedding-premium050-pixel-clean'
		on conflict (slug) do update
		set title = excluded.title,
			couple = excluded.couple,
			event_date = excluded.event_date,
			status = excluded.status,
			config = excluded.config,
			updated_at = now();

		insert into invitations (template_id, slug, title, couple, event_date, status, config)
		select id, 'sari-bagus', 'Sari & Bagus', 'Sari Dewi & Bagus Aditya', '2026-08-01', 'published',
			'{"bride":"Sari Dewi","groom":"Bagus Aditya","venue":"Pangeran Beach Hotel","city":"Padang","akadTime":"09.00 WIB","receptionTime":"12.00 WIB","gift":{"bank":"Mandiri","account":"9876543210"}}'::jsonb
		from templates
		where slug = 'wedding-premium050-pixel-clean'
		on conflict (slug) do update
		set title = excluded.title,
			couple = excluded.couple,
			event_date = excluded.event_date,
			status = excluded.status,
			config = excluded.config,
			updated_at = now();

		insert into invitations (template_id, slug, title, couple, event_date, status, config)
		select id, 'alyssa-rayhan', 'Alyssa & Rayhan', 'Alyssa Kirana & Rayhan Pradipta', '2026-05-20', 'published',
			'{"bride":"Alyssa Kirana","groom":"Rayhan Pradipta","venue":"Pendopo Agung Royal Ambarrukmo","city":"Yogyakarta","akadTime":"08.00 WIB","receptionTime":"11.00 WIB","gift":{"bank":"BCA","account":"5550012345"}}'::jsonb
		from templates
		where slug = 'wedding-premium050-pixel-clean'
		on conflict (slug) do update
		set title = excluded.title,
			couple = excluded.couple,
			event_date = excluded.event_date,
			status = excluded.status,
			config = excluded.config,
			updated_at = now();

		update invitations
		set template_id = (select id from templates where slug = 'adat-jawa'),
			updated_at = now()
		where slug = 'joko-cikita'
			and exists (select 1 from templates where slug = 'adat-jawa');
	`)
	return err
}
