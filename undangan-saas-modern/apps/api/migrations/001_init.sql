create table if not exists users (
  id text primary key,
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists workspaces (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  name text not null,
  plan text not null default 'starter',
  created_at timestamptz not null default now()
);

create table if not exists invitations (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  couple_name text not null,
  event_date timestamptz not null,
  venue text not null,
  theme text not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_public_slug_idx on invitations(slug) where is_published = true;

create table if not exists rsvps (
  id text primary key,
  invitation_id text not null references invitations(id) on delete cascade,
  guest_name text not null,
  attendance text not null,
  message text,
  party_size int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id bigserial primary key,
  invitation_id text references invitations(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

