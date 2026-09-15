-- Who wrote the experiment, as a name.
--
-- `updated_by` already records the account, but the admin account is shared
-- across the team, so the account does not identify the person. Both are kept
-- and they answer different questions: `updated_by` is the audit trail (an
-- authenticated uuid, impossible to forge), `author_name` is the byline (who
-- actually typed it, impossible to derive from the account).
--
-- Nullable, because the nine imported experiments predate it and because a
-- shared login should not be blocked on filling a field in.
--
-- Admin-only. This is not a public byline: it is never rendered on the site, so
-- it is not a new public data surface, and the zero-PII rule in AGENTS.md §4.1
-- is about the audience rather than about staff.

alter table public.experiments
  add column author_name text;

alter table public.experiments
  add constraint experiments_author_name_length
  check (author_name is null or char_length(author_name) <= 80);

comment on column public.experiments.author_name is
  'Byline. Who typed it, as opposed to which shared account was signed in. Admin-only.';
