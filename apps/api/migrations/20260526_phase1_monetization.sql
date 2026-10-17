begin;

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text,
  display_name text not null default '',
  role text not null default 'user',
  tier text not null default 'free',
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
alter table users add column if not exists tier_expires_at timestamptz;
alter table users add column if not exists is_b2b boolean not null default false;
alter table users add column if not exists client_limit integer not null default 1;
alter table users add column if not exists created_at timestamptz not null default now();
alter table users add column if not exists updated_at timestamptz not null default now();

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
  if not exists (select 1 from pg_constraint where conname = 'users_client_limit_check') then
    alter table users add constraint users_client_limit_check
      check (client_limit >= 0);
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

update invitations
set title = couple
where title = '';

create index if not exists invitations_user_created_at_idx on invitations (user_id, created_at desc);
create index if not exists invitations_status_idx on invitations (status);
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

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'events_name_check') then
    alter table events add constraint events_name_check
      check (event_name in ('page_view', 'rsvp_submit', 'share_click', 'upgrade_click', 'publish', 'export_csv'));
  end if;
end $$;

insert into users (email, display_name, role, tier, tier_expires_at, is_b2b, client_limit)
values ('demo@linkundang.local', 'Demo User', 'user', 'free', null, false, 1)
on conflict do nothing;

insert into templates (name, slug, category, config_schema, tier_access, assets_url, preview_url, is_active)
values
  (
    'Adat Jawa Klasik',
    'adat-jawa',
    'wedding',
    '{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
    array['free', 'creator', 'pro', 'business'],
    '/template-assets/adat-jawa',
    '/preview/template-adat-jawa',
    true
  ),
  (
    'Adat Jawa Cepat',
    'adat-jawa-lottie',
    'wedding',
    '{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"gallery":{"type":"array","items":{"type":"string"}}}}'::jsonb,
    array['creator', 'pro', 'business'],
    '/template-assets/adat-jawa-lottie',
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
    '/template-assets/042',
    '/preview/template-042',
    true
  ),
  (
    'Premium 074 - Indonesia Editorial',
    'premium-074',
    'wedding',
    '{"type":"object","required":["couple","eventDate"],"properties":{"couple":{"type":"string","minLength":1},"eventDate":{"type":"string","format":"date"},"music":{"type":"string"}}}'::jsonb,
    array['creator', 'pro', 'business'],
    '/template-assets/074',
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

commit;
