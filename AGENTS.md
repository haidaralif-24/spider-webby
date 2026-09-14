# AGENTS.md — SpiderWeb

Operating instructions for any AI agent working in this repository.

**Read `docs/SpiderWeb-Technical-Brief.md` before making architectural changes.** It explains *why* every rule below exists. This file is the *what*; the brief is the *why*. If they ever disagree, the brief wins and this file should be updated.

---

## 1. What this is

An Indonesian-language science website for kids (roughly ages 6–14). Three fields — Physics, Chemistry, Biology. Each field page has an **Experiment** and a **Trivia** tab. Experiments follow a fixed shape: Title → Hook → Materials → Steps → Concepts. Steps render as a **derived flowchart plus a numbered list**.

Mascot is a purple spider named **Webby**.

**Current phase: P0.** See §5.

---

## 2. Locked stack

| Layer | Choice |
|---|---|
| Framework | Next.js, **App Router**, TypeScript in `strict` mode |
| Styling | Tailwind CSS |
| Backend | Supabase (Postgres, Auth, RLS, Edge Functions) — the system of record for everything |
| Images | Cloudinary — **image bytes only** |
| Hosting | Vercel |
| Package manager | npm (do not introduce a second lockfile) |

### Do NOT add these without asking

- **Any third-party CMS.** Authoring is a custom `/admin` dashboard. Payload, Sanity, Strapi and Supabase Studio are all explicitly rejected.
- **Any analytics or tracking.** Not Google Analytics, not Plausible, not Vercel Analytics, not a custom beacon. Decided: none.
- **Supabase Storage.** Do not provision a bucket. Cloudinary holds every image.
- **React Flow, Mermaid, or any diagram library.** The flowchart is hand-rolled SVG.
- **A component library** (MUI, Chakra, shadcn, etc.) or an animation library.
- **Any third-party embed or iframe.** Nothing loads into a page from a domain we don't control.
- **A state management library.** Server Components and Server Actions cover this.

---

## 3. Audience constraints — read before writing any user-facing copy

The audience includes 6-year-olds who are still learning to read.

- Sentences short. One idea per sentence. If a step needs a comma-spliced clause to make sense, it is two steps.
- Indonesian at **SD (elementary) level**. Everyday words over formal ones. Define any scientific term inline the first time it appears.
- No walls of text. Concepts/Theory is the only section with paragraphs — keep it to two or three short ones.
- **No time pressure, no streaks, no "you lost" states, no scarcity mechanics.** Ever.

---

## 4. Hard rules

Violating any rule in this section is a bug, not a style preference.

### 4.1 Privacy — non-negotiable

- **Collect zero PII.** No names, no emails at signup, no birthdays, no free-text display names. An under-13 audience means any PII collection triggers COPPA / GDPR-K parental-consent obligations.
- Display names must be **auto-generated or picked from a curated list**. Never a free-text input.
- **No user-generated content.** No comments, no forum, no uploads from kids. Do not add these.
- **No external links off-site.** If one is unavoidable, gate it behind a "you're leaving SpiderWeb" interstitial.
- **Cloudinary is delivery-only.** Do not enable AI tagging, face detection, or any feature that analyses images of children.
- Never add an upload UI anywhere except `/admin`.

### 4.2 Auth and roles

- Kids use **anonymous Supabase sign-in**. Never require an account to view content or play trivia. An optional email link-upgrade may be offered later — never required.
- **The admin role lives in `app_metadata`, never `user_metadata`.** `user_metadata` is user-editable; checking it is a self-serve admin button.
- **Never add an `is_admin` column to `profiles`.** That table is user-readable.
- Enforce admin access in **three places**: middleware (redirect — UX only), every Server Action (the real boundary), and RLS policies (the backstop).
- The public read policy on content tables is `status = 'published' OR is_admin()`.

```sql
-- the only correct admin check
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
```

### 4.3 Data and points

- **`points_balance` is derived, never authoritative.** `points_ledger` is the source of truth.
- **Points are only ever awarded through the `award_points()` Postgres RPC** (`SECURITY DEFINER`). Never award points in a Server Action or on the client.
- **Never `select *` on `trivia_options` from the client.** Fetch questions and options *without* `is_correct`; grade server-side. RLS will not save you if the column ships.
- Every content row carries `status`, `published_at`, `updated_by`.
- Content tables carry a `translations jsonb` column. Populate only the `id` key for now — English is a later data change, not a migration.

### 4.4 Media

- **Store the Cloudinary `public_id` in Supabase. Never the `secure_url`.**
- **`lib/cloudinary.ts` is the only place a delivery URL may be constructed.** No exceptions, anywhere in the codebase.
- **Never transform on upload.** Store originals; request `w_*, f_auto, q_auto` at render through the `next/image` custom loader.
- Uploads are **signed** by a Server Action. The Cloudinary API secret must never reach the browser. Do not use unsigned presets.
- **Mascot, icons and UI art are SVG files in the repo** — never Cloudinary, never raster.
- `media` RLS: admin-only writes; public read limited to assets referenced by a published experiment.

### 4.5 Content rendering

- **The experiment flowchart is derived from `experiment_steps`, never authored.** Never add a field asking the author to upload a diagram.
- `<ExperimentFlow>` is a **Server Component with inline SVG and zero client JS.** Do not use React Flow or Mermaid.
- Flowchart orientation: **vertical always on mobile**; horizontal only on desktop when the flow has **≤4 steps**.
- **Linear flows only.** No branching. Do not design for it.
- The flowchart is **supplementary**. The numbered `<ol>` of steps is the real content and must always be present and visible. The SVG gets `role="img"` with `<title>` and `<desc>`. Never hide the step list behind a toggle.
- **Every public content page is statically rendered (ISR) with zero client JS.** Only trivia, profile and `/admin` may be dynamic. Publishing calls `revalidatePath()`.
- `experiment_steps.flow_label` is optional, 2–4 words. Fall back to the truncated step title.

### 4.6 The admin dashboard

- **`/admin` is the only write surface in the product.** No exceptions.
- **Structured repeatable fields only. Never expose a markdown or raw HTML box.** Constrained rich text (bold, italic, link, list) is permitted inside a step body.
- All repeatable lists (materials, steps, concepts) must support **drag-to-reorder**.
- The experiment editor must show a **live flowchart preview** so the author sees what their steps produce.
- Preview must render **real components** with a **phone/desktop toggle** — never a mock approximation.
- The admin UI is **in Indonesian**.
- Uploads must auto-rotate from EXIF, auto-resize, **require alt text**, and apply a crop preset per slot (hero 16:9, step 4:3, thumbnail 1:1).
- Trivia authoring lives at `/admin/trivia?experiment=<id>` using the same form component. **Never nest the trivia form inside the experiment form.**
- Autosave drafts on blur with a "tersimpan" confirmation.
- Validation teaches: live character counters and inline hints, not a wall of red after submit.

### 4.7 Language

- **Indonesian is primary and serves at the root** (`/`, `/kimia`, `/eksperimen/...`). English goes under `/en/...` later.
- **Never hardcode a user-facing string in a component.** All UI strings live in `messages/id.json`.
- Code, identifiers, comments and commits are in **English**. Only user-facing content and the admin UI are Indonesian.
- Localized DB fields: `title`, `hook`, `body`, `label`, `flow_label`, `prompt`, `explanation`, `name`, `intro`. **Not** localized: `slug`, `color_token`, `is_correct`, `price`.

### 4.8 Design tokens

Field colours are fixed. Use them via Tailwind theme tokens, never as inline hex literals scattered through components.

| Field | Token | Hex |
|---|---|---|
| Physics | Curious Blue | `#42A5F5` |
| Chemistry | Fun Purple | `#8E7CFF` |
| Biology | Science Green | `#4CAF50` |

| Role | Token | Hex |
|---|---|---|
| Primary action | Science Green | `#4CAF50` |
| Accent | Discovery Yellow | `#FFD54F` |
| CTA | Energy Orange | `#FF9F43` |
| Page background | Cloud White | `#F8FBF7` |
| Section background | Lab Mist | `#E8F5E9` |
| Borders | Web Gray | `#808EC5` |
| Body text | Deep Charcoal | `#263238` |

**Never use a field colour as text colour on a light background.** All three sit at roughly 2.5–3.2:1 against white. Use them as fills, borders and chips with Deep Charcoal text on top.

### 4.9 Accessibility

- **Never let colour be the only signal.** Every field needs a distinct icon silhouette, because blue/purple is the pair most affected by colour vision deficiency.
- Every image requires meaningful alt text. The admin must require it.
- Touch targets ≥ 44px. No hover-only affordances — there is no hover on a phone.
- Body text must meet 4.5:1 contrast.

---

## 5. Build order

| Phase | Scope | Status |
|---|---|---|
| **P0 — Shell** | Routing scaffold with `[locale]`, design tokens, home, field pages, experiment detail, **`<ExperimentFlow>`**, rendered from **local seed data**. Cloudinary wired. **No database.** | **← current** |
| **P1 — Admin dashboard** | Custom `/admin` on Supabase Postgres. Experiment editor, media library, trivia editor, role enforcement. Migrate seed data in. | |
| **P2 — Trivia + points** | Anonymous auth, trivia engine, `award_points()` RPC, ledger, profile. *(Scope depends on deferred decisions — see §6.)* | |
| **P3 — Gamification** | Layered-SVG mascot, cosmetics, badges. | |
| **P4 — Polish** | English locale, teacher view, PWA. | |

**Do not skip ahead.** Specifically:

- **P0 must be built with no Supabase dependency at all.** If the shell doesn't feel good with fake data, no amount of backend fixes it.
- **Seed data lives in `content/` as typed JSON that mirrors the eventual DB schema**, so P1 is a mapping exercise rather than a rewrite. Do not use MDX for seed data — the content is structured repeatables, not prose.

---

## 6. Deferred decisions — do not decide these

These are parked deliberately. **If a task requires one of them, stop and ask. Do not invent an answer.**

| Decision | Resolve before | How to avoid committing to an answer |
|---|---|---|
| **Trivia scope** — per-post questions vs one general pool surfaced everywhere | P2 | The schema carries both: `trivia_questions.experiment_id` is **nullable**. `NULL` = general pool, set = that post's trivia. Build the authoring form to handle both. |
| **Gamification** — full points + cosmetics loop / trivia without the economy / none at all | P2 | Do not build any of it before P2. Do not add a `points_ledger`, cosmetics table, or mascot layering system in P0 or P1. |
| **Field colours** | Already defaulted to the brief's text; reversible until tokens lock in P0 | Use the tokens in §4.8. Do not hardcode hex values that would be painful to change. |

**Hard rule: the first two must not drift past P1**, because they define what P2 *is*.

---

## 7. Repository structure

```
app/
  [locale]/
    page.tsx                          home
    [field]/page.tsx                  fisika | kimia | biologi  (?tab=eksperimen|trivia)
    eksperimen/[slug]/page.tsx        experiment detail
    trivia/page.tsx                   general trivia
    webby/page.tsx                    mascot
    tantangan/[slug]/page.tsx         today's challenge
    lencana/page.tsx                  badge corner
    profil/page.tsx                   points, cosmetics, equip
  admin/
    page.tsx                          content list
    eksperimen/[id]/page.tsx          experiment editor
    trivia/page.tsx                   question bank (?experiment=<id>)
    media/page.tsx                    image library
    webby/page.tsx                    cosmetics + mascot parts
components/
  experiment-flow.tsx                 DERIVED flowchart — server component, inline SVG
  experiment-steps.tsx                the accessible numbered <ol>
  media-image.tsx                     next/image + Cloudinary loader
lib/
  cloudinary.ts                       public_id → URL. THE ONLY place URLs are built.
  supabase/{client,server,admin}.ts
  auth.ts                             role checks (app_metadata)
content/                              P0 seed data (typed JSON, mirrors DB schema)
messages/{id,en}.json                 UI strings
supabase/migrations/                  SQL migrations, committed
docs/SpiderWeb-Technical-Brief.md     the rationale for everything above
```

**Conventions:**

- Server Components by default. Add `"use client"` only when interactivity genuinely requires it, and keep those components as leaves.
- Name files `kebab-case.tsx`, components `PascalCase`, DB tables and columns `snake_case`.
- Validate all input at the Server Action boundary with Zod.
- Never construct a Cloudinary URL outside `lib/cloudinary.ts`.
- Migrations are committed SQL files. Never mutate the schema by hand in a dashboard.

---

## 8. Commands

```bash
npm run dev          # local dev
npm run build        # must pass before any task is called done
npm run lint         # must pass
npm run typecheck    # must pass — strict mode, no suppressions
```

Do not suppress TypeScript errors with `@ts-ignore` or `any`. If a type is genuinely unknown, use `unknown` and narrow it.

---

## 9. Definition of done

A task is not complete until:

1. `npm run build`, `npm run lint` and `npm run typecheck` all pass.
2. No rule in §4 is violated.
3. Nothing from §6 has been decided unilaterally.
4. The change is verified in a real browser at **both mobile and desktop widths** — not just by reading the code.
5. No user-facing string is hardcoded (it lives in `messages/id.json`).
6. Any new user-facing copy passes the reading-level rules in §3.

---

## 10. When in doubt

**Ask.** This project has a small number of decisions that are expensive to reverse — the data model, the auth model, the media pipeline, and anything in §6. Guessing at those costs far more than asking.

For anything else, use judgement, keep it simple, and prefer the option that ships.
