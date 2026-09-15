-- The media table, its admin check, and its policies.
-- Rationale: AGENTS.md §4.4 and §4.2, brief §3.2 and §6.

-- ---------------------------------------------------------------------------
-- The admin check, in one place.
--
-- AGENTS.md §4.2: the role lives in `app_metadata`, which only the service role
-- can write. Never `user_metadata` (self-editable, so checking it is a
-- self-serve admin button), and never a column on `profiles` (that table is
-- user-readable, so a column there is a self-serve admin button too).
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

comment on function public.is_admin() is
  'The only correct admin check (AGENTS.md §4.2). Read from the verified JWT, so it cannot be forged by the client.';

-- ---------------------------------------------------------------------------
-- media
--
-- `public_id` is the Cloudinary handle and the only image reference stored.
-- There is deliberately no `secure_url` column: the delivery URL is built at
-- render time by `lib/cloudinary.ts`, which is what keeps the cloud name and
-- every transform out of the database, and what would make a future migration
-- off Cloudinary a URL-builder change instead of a data rewrite (brief §3.2/§3.3).
-- ---------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  -- Not nullable on purpose. AGENTS.md §4.6 requires alt text, and a NOT NULL
  -- constraint is the only version of that rule a future code path cannot skip.
  alt text not null,
  width integer not null,
  height integer not null,
  format text not null,
  bytes integer not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null default 'draft'
    constraint media_status_check
    check (status in ('draft', 'in_use', 'orphaned'))
);

comment on table public.media is
  'Image references. public_id only — never a delivery URL (AGENTS.md §4.4).';

comment on column public.media.status is
  'draft | in_use | orphaned. Drives the orphaned-upload sweep in brief §3.2.';

comment on column public.media.uploaded_by is
  'Effectively a constant today — the admin is the only uploader in the product (AGENTS.md §4.1). Kept for the audit trail.';

create index media_status_idx on public.media (status);
create index media_uploaded_by_idx on public.media (uploaded_by);

alter table public.media enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- Admin-only everything. This is the backstop of the three-place rule: the
-- middleware redirect is UX, `requireAdmin()` in each Server Action is the real
-- boundary, and this is what catches a mistake in either.
create policy "media: admin full access"
  on public.media
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- No public read policy yet, deliberately.
--
-- AGENTS.md §4.4 scopes public reads to "assets referenced by a published
-- experiment", and there is no experiments table until P1 migrates the content
-- out of content/*.json. Until then the public site reads public_ids from JSON
-- and never touches this table, so a permissive read policy would be added risk
-- with no consumer. It arrives with the experiments table, as a join.

grant select, insert, update, delete on public.media to authenticated;
