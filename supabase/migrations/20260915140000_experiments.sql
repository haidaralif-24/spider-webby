-- The experiment content tables.
-- Rationale: AGENTS.md §4.2/§4.6, brief §6.

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- experiments — the aggregate root
--
-- Deviations from brief §6, all deliberate:
--
-- * `field_id` becomes `field_slug text`. There is no `fields` table; the three
--   fields are fixed and live in `content/fields.json`. A one-column table with
--   three rows would be indirection for its own sake, and a CHECK constraint
--   gives the same guarantee. `lib/content.ts` makes the same substitution.
-- * `order` becomes `order_index`. `order` is reserved in SQL and would need
--   quoting at every use site forever.
-- * `status`, `published_at` and `updated_by` live here and NOT on the three
--   child tables, despite brief §6 saying "every content row" carries them. A
--   step cannot be published independently of its experiment, so a status on
--   each child would be a second source of truth for one fact — and the two
--   would drift.
-- ---------------------------------------------------------------------------
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  field_slug text not null
    constraint experiments_field_check
    check (field_slug in ('fisika', 'kimia', 'biologi')),
  title text not null,
  hook text not null,
  difficulty text not null
    constraint experiments_difficulty_check
    check (difficulty in ('mudah', 'sedang', 'sulit')),
  est_minutes integer not null
    constraint experiments_minutes_check
    check (est_minutes between 1 and 240),
  hero_media_id uuid references public.media (id) on delete set null,
  order_index integer not null default 0,
  status text not null default 'draft'
    constraint experiments_status_check
    check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_by uuid references auth.users (id) on delete set null,
  translations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.experiments is
  'One experiment. The public read policy is status = published OR is_admin() (AGENTS.md §4.2).';

comment on column public.experiments.updated_by is
  'The admin who last saved. This is the uploader name shown in the editor — the authenticated identity, not a free-text field.';

comment on column public.experiments.translations is
  'Localised fields keyed by locale. Only the id key is populated today; English is a data change, not a migration (brief §3.1).';

create trigger experiments_touch_updated_at
  before update on public.experiments
  for each row
  execute function public.touch_updated_at();

create index experiments_field_idx on public.experiments (field_slug, order_index);
create index experiments_status_idx on public.experiments (status);

-- ---------------------------------------------------------------------------
-- The three repeatable lists
-- ---------------------------------------------------------------------------
create table public.experiment_materials (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null
    references public.experiments (id) on delete cascade,
  order_index integer not null default 0,
  label text not null,
  icon_svg text
);

create table public.experiment_steps (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null
    references public.experiments (id) on delete cascade,
  order_index integer not null default 0,
  title text not null,
  -- Optional, 2-4 words. The only field the flowchart feature adds to the
  -- author's form. Falls back to the truncated step title (AGENTS.md §4.5).
  flow_label text,
  body text not null,
  media_id uuid references public.media (id) on delete set null
);

create table public.experiment_concepts (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid not null
    references public.experiments (id) on delete cascade,
  order_index integer not null default 0,
  title text not null,
  body text not null
);

create index experiment_materials_experiment_idx
  on public.experiment_materials (experiment_id, order_index);
create index experiment_steps_experiment_idx
  on public.experiment_steps (experiment_id, order_index);
create index experiment_concepts_experiment_idx
  on public.experiment_concepts (experiment_id, order_index);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.experiments enable row level security;
alter table public.experiment_materials enable row level security;
alter table public.experiment_steps enable row level security;
alter table public.experiment_concepts enable row level security;

-- Admin: full access to everything.
create policy "experiments: admin full access"
  on public.experiments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "experiment_materials: admin full access"
  on public.experiment_materials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "experiment_steps: admin full access"
  on public.experiment_steps for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "experiment_concepts: admin full access"
  on public.experiment_concepts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Public: published rows only. This is the exact shape AGENTS.md §4.2 asks for,
-- and it is what lets the public site read content while drafts stay invisible.
create policy "experiments: public read published"
  on public.experiments for select to anon, authenticated
  using (status = 'published' or public.is_admin());

-- Children are readable when their parent is published. The subquery is itself
-- subject to the experiments policy above, which is what makes the two agree.
create policy "experiment_materials: read when published"
  on public.experiment_materials for select to anon, authenticated
  using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_id and (e.status = 'published' or public.is_admin())
    )
  );

create policy "experiment_steps: read when published"
  on public.experiment_steps for select to anon, authenticated
  using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_id and (e.status = 'published' or public.is_admin())
    )
  );

create policy "experiment_concepts: read when published"
  on public.experiment_concepts for select to anon, authenticated
  using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_id and (e.status = 'published' or public.is_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- The media policy that was deferred
--
-- The media migration left this out because AGENTS.md §4.4 scopes public reads
-- to "assets referenced by a published experiment" and there was no experiments
-- table to join. There is now.
-- ---------------------------------------------------------------------------
create policy "media: public read of published experiment assets"
  on public.media for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.experiments e
      where e.hero_media_id = media.id and e.status = 'published'
    )
    or exists (
      select 1
      from public.experiment_steps s
      join public.experiments e on e.id = s.experiment_id
      where s.media_id = media.id and e.status = 'published'
    )
  );

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.experiments to authenticated;
grant select, insert, update, delete on public.experiment_materials to authenticated;
grant select, insert, update, delete on public.experiment_steps to authenticated;
grant select, insert, update, delete on public.experiment_concepts to authenticated;

grant select on public.experiments to anon;
grant select on public.experiment_materials to anon;
grant select on public.experiment_steps to anon;
grant select on public.experiment_concepts to anon;
grant select on public.media to anon;
