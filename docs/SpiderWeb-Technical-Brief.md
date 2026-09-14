# SpiderWeb — Project Summary & Technical Brief

> Source: `SpiderWeb-2.pdf` (4 pages, brief + reference screenshots)
> Scope of this doc: **product summary + technical/engineering brainstorm only**. No visual design decisions.
> Last updated: 2026-09-14 — decisions in §2 are locked.
>
> **Companion file:** `AGENTS.md` at the repo root turns the rules below into operating instructions for AI agents working in this repository. This document is the *why*; `AGENTS.md` is the *what*. Keep them in sync.

---

## 1. Project summary (from the brief)

**What it is.** A kid-facing interactive science learning website. Tagline: *Explore • Experiment • Discover*. Structural reference is **PhET** (phet.colorado.edu) — same shape of navigation, but narrowed from PhET's 5 categories down to **3 fields**.

**Brand.** Mascot is a purple cartoon spider — **"Webby"** — wearing safety goggles and holding a test tube. Palette is locked in the brief:

| Token | Hex | Name |
|---|---|---|
| Science Green | `#4CAF50` | primary action |
| Curious Blue | `#42A5F5` | Physics field |
| Discovery Yellow | `#FFD54F` | accent |
| Energy Orange | `#FF9F43` | accent / CTA |
| Fun Purple | `#8E7CFF` | Chemistry field |
| Cloud White | `#F8FBF7` | page background |
| Lab Mist | `#E8F5E9` | section background |
| Web Gray | `#808EC5` | borders |
| Deep Charcoal | `#263238` | body text |

> Note: the brief's mockup uses purple for Chemistry and green for Science/Biology. Field colours below follow the brief's text (*physics in blue, chem in purple, bio in green*) — flag this at handoff since the mockup's field cards are ambiguous.

**Pages / IA.**

1. **Home** — hero ("Science is an Adventure!"), 3 field cards (Physics / Chemistry / Biology), *"Get to know more about our mascot"* (this **replaces** PhET's "Explore our sims"), featured experiments, Today's Challenge, Badge Corner.
2. **Field page** (e.g. `/kimia`) — landing on it immediately shows an **introduction to that field**, then tabs. PhET's `Browse / Filter / Customize` tabs are **replaced by `Experiment` and `Trivia`**.
3. **Experiments tab** — browsable/filterable grid of experiments, user picks one.
4. **Experiment detail** — fixed structure:
   - Title
   - Hook
   - Materials
   - Steps — rendered as a **simple flowchart plus a numbered list** (see §5.4)
   - Concepts / Theory
5. **Trivia tab** — **general trivia across all three subjects**, identical content regardless of which field you're in. Levels **1–3**.
6. **Mascot page** — "get to know more about our mascot."

**Gamification.** Answering trivia awards **points**. Points are spent on **mascot outfits / cosmetics**. The brief marks this as **nice-to-have, not required** (`klo gabisa yaa gausah` = "if you can't, no need").

---

## 2. Locked decisions

| # | Decision | Locked value | Architectural consequence |
|---|---|---|---|
| 1 | **Primary language** | **Indonesian** | Route with a `[locale]` segment from day one. Indonesian serves at the root; English is added later as content work, not a refactor. See §3.1. |
| 2 | **Authoring** | **Custom admin-only dashboard** | Built in Next.js inside the same app — not a third-party CMS. Forms with explicit fields, signed Cloudinary upload, draft → preview → publish. See §5.1. |
| 3 | **Target devices** | **Mobile + desktop** | Mobile-first responsive. See §5.2. |
| 4 | **Audience tone** | **Family friendly** | No ads, no third-party trackers, no user-generated content, no free-text display names, anonymous-first auth. See §5.3. |
| 5 | **Interactive experiments** | **Dropped — replaced by a simple flowchart** | Removes the tiered interactive registry, PhET embeds, canvas components, and all touch-interaction work. The flowchart is **derived from the steps**, so the author gains no new field to fill in. See §5.4. |
| 6 | **Backend split** | **Supabase = auth + data. Cloudinary = image bytes only.** | Supabase holds the image **`public_id`**, not the URL. Cloudinary URLs are built at render time. See §3.2. |
| 7 | **Upload surface** | **Admin only — there is no public upload path anywhere** | No upload UI for kids or parents, so no rate limiting, no abuse handling, no moderation queue, no per-user quota. Supabase Storage is therefore unused. See §3.2. |
| 8 | Stack | Next.js + Supabase + Cloudinary | Confirmed and locked. |
| 9 | **Audience age** | **Broad, focused on pre-high-school (roughly 6–14)** | Drives reading level, tone, and makes anonymous-first auth a **requirement** rather than a preference. See §5.9. |
| 10 | **Analytics** | **None — deliberately** | No third-party analytics, no tracking. The platform is an admin-published experiment library, not a funnel. Accept that completion rates go unmeasured. |
| 11 | **Field colours** *(provisional)* | **Physics = Curious Blue · Chemistry = Fun Purple · Biology = Science Green** | Default adopted on your delegation; reversible until tokens are locked in P0. Never use these as text colour on light backgrounds. See §5.10. |
| 12 | Gamification | **Deferred** | Points → cosmetics. Not decided, and not needed until P2. See §9. |

**Deferred:** trivia scope and the gamification loop — parked deliberately, each with a trigger for when it must be resolved. See §9. **Nothing in P0 depends on them.**

---

## 3. Verdict on the stack

**Next.js + Supabase + Cloudinary is right, and the boundaries are now settled.** Supabase is the system of record for everything — auth, content, progress, points, and every image *reference*. Cloudinary stores image *bytes* and nothing else. The authoring layer is a custom admin dashboard in the same Next.js app.

| Layer | Your pick | Verdict |
|---|---|---|
| Framework | Next.js | ✅ App Router. Content pages are static/ISR, only trivia + profile are dynamic. Ideal Next.js workload. |
| Backend | Supabase | ✅ Postgres + Auth + RLS + Edge Functions. System of record for everything. **Critical:** put the points logic behind RLS + an RPC, never trust the client. **Storage is unused** — Cloudinary holds every image (see §3.2). |
| Images | Cloudinary | ✅ Locked: **image bytes only** — experiment photos, step illustrations, hero art. Do **not** put the mascot, icons, or UI art there; those are **SVG in the repo** (§5.6). Chosen over Supabase Storage for headroom — but the free plan's credits are a **shared pool**, so budget them (§3.2). |
| Authoring | **Custom admin dashboard** | ✅ Locked. Admin-only, in-app, Indonesian UI. You own drafts, preview, media library and role checks. See §5.1. |

**Also missing:** testing for the points logic, and email (only if you ever add password reset). Analytics is deliberately out of scope — see §9.

### 3.1 Language architecture

Indonesian is primary, so:

- **Routing.** Use `next-intl` with a `[locale]` segment. Serve Indonesian at the root (`/`, `/kimia`, `/eksperimen/...`) and English at `/en/...`. Cleanest SEO for an Indonesian-primary product, and the English site doesn't exist until you want it.
- **UI strings** live in message catalogs (`id.json`, `en.json`) — never hardcoded in components. This is the cheap part if you do it now.
- **Content** lives in the database and needs its own translation strategy. Since the admin is custom, the cheapest future-proof move is a `translations jsonb` column on each content table, keyed by locale — populated with only an `id` key at MVP:

  ```jsonc
  // experiments.translations
  { "id": { "title": "Slime Ajaib", "hook": "..." } }
  ```

  Slightly more verbose than plain columns today, but adding English becomes a data change instead of a schema migration across six tables.
- **Pragmatic call:** ship MVP **Indonesian-only**, but with the `[locale]` routing and message catalogs already wired. Adding English then costs translation time and zero engineering. Retrofitting i18n after launch costs a refactor of every route and component.

### 3.2 Media pipeline: Cloudinary ↔ Supabase

Your split is correct. One refinement matters a lot: **store the `public_id`, not the `secure_url`.**

**First, the premise, stated explicitly: the admin is the only uploader.** There is no public upload path anywhere in the product — no kid uploads a photo, no parent submits an image, no avatar upload, no "share your result" feature. Every asset in Cloudinary was placed there by the author through `/admin`. That single fact removes a surprising amount of machinery:

- No rate limiting, abuse detection, or upload moderation queue
- No per-user quota or storage accounting
- No public `insert` policy on the `media` table
- No upload UI to design, localise, or protect outside `/admin`

```
Author's browser
   │ 1. request signature
   ▼
Next.js Server Action ──2. signs with the Cloudinary secret──▶ Cloudinary
   │                                                                ▲
   │ 3. returns signature + timestamp                                │
   ▼                                                                │ 4. direct upload
Author's browser ───────────────────────────────────────────────────┘
   │ 5. returns public_id
   ▼
Supabase  media.public_id  ◀── experiment_steps.media_id (FK)
   │
   │ 6. public site reads public_id
   ▼
next/image + custom Cloudinary loader ──▶ builds w_*/f_auto/q_auto URL at render
```

**Why `public_id` and not the URL:**

- A `secure_url` bakes in your **cloud name**. Change cloud name, or move CDN later, and you're rewriting every row.
- Delivery URLs carry transformation params (`w_800,f_auto,q_auto`). Those belong to the **render**, not the record. The same image is a 400px card in the grid and a 1200px hero on the detail page — storing one URL means storing the wrong one for half your surfaces.
- `public_id` is stable and immutable; the URL is derived. **Derive, don't store** — same principle as the flowchart (§5.4).

If you want a URL visible in the database for debugging or SQL reports, make it a **generated column** so it can never drift:

```sql
url text generated always as (
  'https://res.cloudinary.com/' || current_setting('app.cloud_name')
  || '/image/upload/' || public_id
) stored
```

**Uploads go direct to Cloudinary with a server-generated signature.** A Server Action signs the request with the Cloudinary SDK and hands the signature to the browser; the browser then uploads straight to Cloudinary. Two reasons, and neither is about stopping strangers:

- **The API secret never reaches the client.** An unsigned preset puts a write endpoint on the public internet, and you'd have to lock it down by folder, size and format to make that safe. Signed is barely more work and strictly better.
- **It dodges the serverless body limit.** Vercel caps request bodies at roughly 4.5MB, and phone photos are routinely 3–8MB. Proxying the file through a Server Action would fail on exactly the uploads your author will make.

If you'd rather skip the signature flow, the alternative is resize-then-proxy: downscale in the browser to under 4MB and POST it through a Server Action. Simpler plumbing, but now you're doing image resizing in the browser, which is worse than letting Cloudinary do it. **Take the signed direct upload.**

**Never transform on upload.** Store the original once; request `w_*, f_auto, q_auto` at render through a `next/image` custom loader. Cloudinary generates and edge-caches each variant lazily, so you only pay for the sizes you actually serve. Pre-generating variants on upload means guessing your breakpoints in advance and paying for images nobody views.

**Orphaned uploads — a minor concern, not a priority.** With one author and low volume, an abandoned upload costs cents. Worth doing eventually; don't let it block P1.

1. `media.status` (`draft` | `in_use` | `orphaned`) plus a scheduled Supabase Edge Function that marks assets unreferenced for 30 days and deletes them. **Post-MVP.**
2. Accept the waste. At admin-only volume it's a few dollars a year — but *know* it's happening rather than discovering it on a bill.

**RLS on `media` follows from admin-only uploads.** Only an admin can `insert` / `update` / `delete`. Public read is limited to assets referenced by a published experiment, so a draft-only image can't be fetched by walking row ids. One caveat: a Cloudinary delivery URL is unlisted but **not secret** — anyone holding it can load the image. That's fine for photos of baking-soda volcanoes; just don't treat `public_id` as access control for anything sensitive.

**Delivery only.** On a kids' site, don't use Cloudinary's AI tagging, face detection, or any feature that analyses images of children. Set the account so nothing is auto-analysed.

### 3.3 Free-tier budget — why Cloudinary, and the one trap

Your reasoning holds: Cloudinary's free plan gives far more headroom than Supabase Storage. But the shape of it matters.

| | Supabase Storage (free) | Cloudinary (free) |
|---|---|---|
| Storage | 1 GB, hard cap | up to 25 GB — but shared |
| Bandwidth | 5 GB egress, **separate pool** | drawn from the **same 25 credits** |
| Transformations | none | 1,000 per credit, same pool |
| Next tier up | $25/mo (Pro) | $89–99/mo (Plus) |

**The trap: the 25 credits are interchangeable, not additive.** One credit = 1 GB storage *or* 1 GB bandwidth *or* 1,000 transformations. So every credit spent storing an original is a credit you cannot spend delivering one. It is not 25 GB of storage *plus* 25 GB of bandwidth.

**Cloudinary is still the right call for you**, for three reasons:

1. **Supabase's 1 GB is genuinely tight.** Phone photos run 3–8 MB, so 1 GB is roughly 150–300 originals. You'd hit the cap partway through the content build, and a hard cap mid-build is the worst time to discover it.
2. **Transformations are what make delivery cheap.** `f_auto,q_auto` typically cuts image weight 60–80%, so the *same* 25 credits of bandwidth serve several times more page views than unoptimised originals would. Cloudinary isn't merely more storage — it's what makes your bandwidth budget stretch.
3. **Your Supabase egress stays untouched.** Images never pass through Supabase, so its 5 GB covers only JSON and RSC payloads — kilobytes per request. The two services aren't competing for the same resource.

**Budget it explicitly.** Rough shape for ~300 experiments at ~2 images each:

- **4–6 credits** — originals in storage
- **1–3 credits** — derived variants (transformations count once per *unique derived asset*, not per request)
- **the rest** — bandwidth, ~1 credit per GB delivered

That leaves roughly **18 GB/month of delivery on the free plan**. Comfortable for a long time.

**Watch the upgrade cliff.** Cloudinary's free tier is generous, but the next step is $89–99/mo against Supabase Pro's $25/mo. If you ever outgrow it, the cheaper move is Supabase Storage behind a CDN — *not* Cloudinary Plus. And this is where the derive-don't-store rule (§3.2) pays off: because the database holds `public_id` and the URL is built at render time, that migration is **one URL-builder function plus a data migration**. Had you stored `secure_url`, it would be a rewrite of every row and every component.

**One operational gotcha, unrelated to images:** Supabase pauses free-plan projects after **7 days of low activity**. If you take a break mid-build, expect to un-pause the project before your next session. Not a reason to avoid the free tier — just don't debug a "broken" connection that's actually a paused project.

---

## 4. Architecture

```
Kid / parent browser (mobile + desktop)
  │
  ├── Next.js on Vercel
  │     ├── RSC + ISR  ── public content (home, fields, experiments)
  │     ├── Server Actions ── trivia submit, cosmetic equip, signed uploads
  │     └── next/image + Cloudinary loader ── builds URLs from public_id
  │
  ├── Supabase  (system of record)
  │     ├── Postgres  ── content + progress + points + media references
  │     ├── RLS       ── per-user scope; admin writes gated on the role claim
  │     ├── Auth      ── ANONYMOUS sign-in for kids; admin role in app_metadata
  │     └── Edge Fn / RPC ── award_points(), orphaned-media sweep
  │
  ├── Cloudinary  (image bytes only — never data)
  │     └── originals + on-demand transforms
  │
  └── /admin  (authoring — same Next.js app, admin-only)
        ├── forms with explicit fields, repeatable + drag-reorder
        ├── signed upload → Cloudinary; public_id → Supabase
        ├── draft → preview (phone/desktop) → publish
        ├── Indonesian UI, no markdown or HTML exposed
        └── role from app_metadata, enforced in middleware + actions + RLS
```

**Rendering strategy per route type:**

| Route | Strategy | Why |
|---|---|---|
| `/`, `/fields/[field]`, `/experiments/[slug]`, `/mascot` | Static + `revalidate` (ISR) | Content changes rarely; must be fast on mobile data |
| `/fields/[field]?tab=trivia`, `/profile`, `/badges` | Dynamic / client | Per-user state |
| `/admin/**` | Dynamic, admin-gated, `noindex` | Authoring |

Do **not** make experiment pages fully dynamic. They are your SEO surface and your performance budget's best friend. When the author hits Publish, trigger an on-demand `revalidatePath()` so the page updates instantly instead of waiting for the next revalidation window.

**Note:** with the interactive dropped (§5.4), *every* experiment page is fully static. There is no longer any public route that needs client JS for content. Your performance budget just got a lot of headroom.

---

## 5. The hard parts

### 5.1 The admin dashboard — your biggest scope item

Locked: a **custom admin-only dashboard** inside the Next.js app. Not Payload, not Supabase Studio.

That's a defensible call — full brand control, no third-party dependency. What it costs is that you now own drafts, preview, media library, reordering, validation, and role checks yourself. So keep the scope tight and resist creep.

**What it must do (and nothing more at MVP):**

| Screen | Purpose |
|---|---|
| `/admin` | Content list — filter by field + status, search by title, see last-edited |
| `/admin/eksperimen/[id]` | The experiment editor (below) |
| `/admin/trivia` | Question bank editor |
| `/admin/media` | Image library — browse, search, see what references each asset |
| `/admin/webby` | Cosmetics + mascot parts |

**The experiment editor is the one that matters.** Field list, in order:

| Field | Type | Notes |
|---|---|---|
| Judul | text | required |
| Slug | text, auto-generated from title | editable, uniqueness-checked |
| Bidang | select | fisika / kimia / biologi |
| Hook | textarea, 200-char counter | required — the kid's first line |
| Tingkat kesulitan | select | mudah / sedang / sulit |
| Estimasi waktu | number, minutes | |
| Gambar utama (hero) | media picker | 16:9 crop preset, alt text required |
| **Alat & bahan** | repeatable: label + optional icon | drag to reorder |
| **Langkah** | repeatable: **label singkat** + teks + optional image | drag to reorder — **this drives the flowchart** |
| **Konsep** | repeatable: judul + teks | drag to reorder |
| Status | draft / published | publish is a separate action |

That's it. Everything the kid sees on the experiment page is editable here, and nothing else is.

**`/admin` is the only write surface in the entire product.** No kid-facing upload, no avatar upload, no parent submission, no "share your experiment" feature. That's why §3.2 needs no abuse handling — the only account that can create an asset is the author's.

**Rules I'd hold firm on:**

1. **No markdown or HTML box anywhere.** Structured repeatables only. If the author can write broken content, they will, and it renders broken. Rich text is acceptable *inside* a step body, but through a constrained editor (bold, italic, link, list) — never a raw source view.
2. **The step's short label is the flowchart node.** Two to four words. **Show a live flowchart preview inside the editor** so the author sees what their steps produce. This is the single highest-value thing in the whole admin — it makes the derived diagram legible to a non-technical person.
3. **Drag to reorder, always.** Pedagogical order is content, and typing numbers into an `order` field is exactly where non-technical authors make mistakes.
4. **Draft → preview → publish.** The preview must render the **real components** at the real breakpoints, with a phone/desktop toggle — not a fake approximation. If preview and production can differ, they will.
5. **Upload UX handles real files.** Auto-rotate from EXIF, auto-resize, **require alt text**, apply a crop preset per slot (hero 16:9, step 4:3, thumbnail 1:1). Non-technical authors upload 4000px phone photos, sideways, with no alt text.
6. **Validation that teaches.** Live character counters and inline hints, not a wall of red after submit.
7. **Admin UI in Indonesian.** The author reads Indonesian.
8. **Trivia gets its own screen, but the same component.** Question + options + mark the correct one + explanation + level. **Don't nest it inside the experiment form** — a repeatable-within-a-repeatable (experiment → questions → options) makes the post editor unusable. Instead, the experiment editor links to `/admin/trivia?experiment=<id>`, which uses the identical trivia form. Same UX, separate screen.
9. **Autosave drafts.** Non-technical authors lose work by closing tabs. Autosave on blur, show a "tersimpan" confirmation.

**Role enforcement — the part people get wrong.**

Put the role in **`app_metadata`, never `user_metadata`**. `user_metadata` is editable by the user themselves, so a `user_metadata.is_admin` check is a self-serve admin button.

```sql
-- admin role lives in app_metadata, which only the service role can write
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
```

Enforce it in **three** places, because one is never enough:

1. **Middleware** — redirect non-admins away from `/admin/**`. This is UX, not security.
2. **Every Server Action** — re-check server-side. This is the actual security boundary.
3. **RLS policies** — `insert`/`update`/`delete` on content tables require the admin claim. This is the backstop that survives a bug in your action layer.

The public site gets `select` only, and the read policy is `status = 'published' OR is_admin()` — so drafts are invisible to anonymous visitors.

### 5.2 Mobile + desktop

Most of the site is easy responsive work now that the interactive is gone. What's left:

- **Experiment detail** is the one page with a real layout decision. Recommended vertical order: hero illustration → flowchart → numbered steps with images → concepts/theory. Single column on mobile; on desktop, two columns with concept/theory sticky beside the steps.
- **The flowchart must reflow.** Vertical on mobile; horizontal only when it's short (≤4 steps) and the viewport is wide. See §5.4.
- **Touch targets ≥ 44px**, and no hover-only affordances — there is no hover on a phone.
- **Desktop gets the extra width**: 3–4 column experiment grid, wider media in steps.
- **Test on a real mid-range Android**, not just Chrome DevTools. DevTools on a laptop lies about image-heavy scrolling.

### 5.3 Family friendly — concrete engineering rules

"Family friendly" is a set of constraints, not a colour choice. Encode them:

- **No ads, no third-party trackers, no analytics that fingerprint.** If you need analytics, use a privacy-first, cookieless option. Don't drop Google Analytics on a kids' site.
- **No user-generated content at MVP.** No comments, no forum, **no uploads from kids** — the admin is the only uploader in the entire product (§3.2). This eliminates the whole moderation surface. Explicitly decide *not* to add it, and write that down so it doesn't creep in.
- **No free-text display names.** If kids can name themselves, you get profanity and PII. Either auto-generate a fun name, or pick from a curated list. Cheap now, painful later.
- **No external links off-site**, or gate them behind a "you're leaving SpiderWeb" interstitial. Kids shouldn't be one tap from YouTube.
- **No third-party embeds at all.** Dropping the interactive (§5.4) also drops iframes — nothing loads into your page from a domain you don't control. That's a privacy and performance win for free.
- **No image analysis on children.** Cloudinary is delivery-only; no AI tagging or face detection (§3.2).
- **Anonymous-first auth (§5.7)** — this is what keeps you out of COPPA/GDPR-K parental-consent territory.
- **Content review before publish.** The draft/publish workflow in §5.1 is your gate.

### 5.4 Experiment flowchart — replacing the interactive

The original brief asked for an interactive element beside the steps, with an image/illustration as fallback. **Locked decision: drop the interactive, render a simple flowchart instead.** This is the single biggest scope reduction available, and it's the right call:

- No interactive registry, no tiered components, no canvas, no iframes, no per-sim licensing checks
- No touch-native interaction requirements, no mobile interaction layout problem
- Authoring stays a plain repeatable text list — no interactive picker, no embed URL to paste
- One reusable component serves every experiment on the site

**The critical design rule: the flowchart is derived, not authored.**

The author writes the steps. The flowchart renders from them. **Never ask the author to upload a flowchart image** — they'd have to draw it in Canva, it wouldn't match the brand, it wouldn't be accessible, and it would go stale the moment they edit a step. Deriving it means the diagram is always correct, always on-brand, and costs the author zero extra work.

```
<ExperimentFlow steps={steps} />
```

- **Server component, inline SVG, zero client JS.**
- **Do not reach for React Flow or Mermaid.** React Flow is an interactive graph library you don't need. Mermaid renders client-side, ships JS, and gives you no control over the brand palette. A linear chain is a few dozen lines of SVG.
- **Orientation:** vertical on mobile, always. Horizontal on desktop *only* when the flow has ≤4 steps; longer flows stay vertical because horizontal nodes get too narrow to read. Compute this from `steps.length` plus a breakpoint.

**Node labels.** A flowchart node can't hold a paragraph. Each step has an **optional `flow_label`** — 2–4 words, e.g. "Aduk perlahan". Fall back to the step title, auto-truncated. It's the only field this feature adds to the author's form, and the editor previews the diagram live so they can see it working (§5.1, rule 2).

**Linear only at MVP.** Real kid experiments are sequences. Some have decision points ("did it turn blue? if yes → …"). Resist building branching: it complicates the author form immediately and the layout engine substantially. Ship linear. If you later need a single branch, add an optional `branch_label` + `branch_target` to a step — but don't design for it now.

**Accessibility — the flowchart is supplementary, not the content.**

Render the numbered step list as the real, accessible content: an `<ol>` with full text and images. The flowchart sits above it as a visual overview, marked `role="img"` with a `<title>`/`<desc>` summary. Screen readers get the list. **Don't hide the list behind a toggle** or make the SVG the only representation of the procedure.

This also happens to be the best UX for kids: flowchart as a glanceable summary, numbered steps for the detail. Same content, two reading speeds.

**Step illustrations still exist.** Each step keeps its optional image, rendered inside the numbered list. That was the brief's "fallback illustration" — it's now simply the normal case.

**What this costs you.** The brief's original vision was a PhET-style manipulable simulation. A flowchart is not that. You're trading interactivity for shippability, and that's a legitimate trade for a content site with one non-technical author — but it's worth saying out loud, because if the interactive feel *is* the product's differentiator, a flowchart won't carry it. If you want it back later, it comes back as an optional per-experiment enhancement, not a structural requirement.

### 5.5 Trivia integrity

Kids will find the `is_correct` flag if you ship it to the client. Options, in order of preference:

1. **Best:** fetch question + options *without* `is_correct`, submit the choice to the RPC, get the verdict back. One round-trip per question, no leaked answers.
2. Acceptable: fetch a whole level's questions minus the answers, grade the level server-side in one call at the end.

Never `select *` on `trivia_options` from the client. RLS alone won't save you if the column ships.

### 5.6 Mascot customization → layered SVG, not raster

The reward loop is "change Webby's outfit." If cosmetics are PNGs you need an asset per combination and they'll look wrong at every size. Instead:

- One **base SVG** for Webby with named layers: `body`, `eyes`, `outfit`, `headwear`, `held-item`, `background`.
- Each cosmetic is a small **SVG fragment** with a known anchor.
- `profiles.mascot_config` is just JSON: `{ outfit: 'jas-lab', headwear: 'goggles', bg: 'nebula' }`.
- Rendering is a pure client component with zero network cost, and it's crisp on every screen.

This also makes the cosmetics shop trivially cheap — a new cosmetic is one file + one DB row. And since cosmetics are content, the non-technical author can add them through the same admin. Note that cosmetic SVGs go in the **repo**, not Cloudinary — they're UI art, not media (§3).

### 5.7 Privacy — anonymous-first

Don't collect names, emails, or birthdays at signup.

**Recommended: anonymous-first auth.** Supabase supports anonymous sign-ins. The kid gets a real `auth.uid()`, progress and points persist immediately, and **zero PII is collected**. Later, if a parent wants to move progress between devices, offer an *optional* email-link upgrade that attaches credentials to the existing anonymous user. You keep the account system and skip the compliance headache — which matters more now that "family friendly" is a locked requirement.

### 5.8 Performance

Your audience is on phones on mobile data. Budget accordingly:

- **No client-side JS for content pages.** RSC-render everything static. With the interactive gone, every public page qualifies.
- **Cloudinary responsive transforms** on every image, with `loading="lazy"` below the fold and a real `sizes` attribute.
- **SVG for all UI art** — mascot, icons, field illustrations, dividers, and the flowchart itself. Zero raster weight.
- **Fonts:** the mockup's chunky rounded display face should be `next/font` self-hosted, subset, `display: swap`, and **only for headings** — body text in a system stack.
- PWA/offline is a **lower priority** — your target is home mobile and desktop, not school tablets on flaky wifi. Revisit post-MVP.

### 5.9 Audience: pre-high-school kids (roughly 6–14)

Confirmed: broad range, focused on kids below high school. That has concrete consequences.

**Reading level drives the content rules.** The youngest end is around 6 and still learning to read:

- **Short sentences.** One idea per sentence. If a step needs a comma-spliced clause to make sense, it's two steps.
- **Indonesian at SD level.** Everyday words over formal ones. Where a scientific term is unavoidable, define it inline the first time.
- **The Hook's 200-character limit is well calibrated** — keep it. It forces one clear sentence.
- **Images carry the load.** For a 6-year-old a step is mostly the picture; text is support. Consider a **warning (not a block)** in the admin when a step is published with no image.
- **No walls of text.** Concepts/Theory is the only place with paragraphs — keep it to two or three short ones.

**Navigation and interaction:**

- Big touch targets, minimal nested navigation. A 6-year-old shouldn't have to understand what a tab is.
- Field colours must never be the only signal (§5.10) — a kid who can't distinguish blue from purple still needs to find biology.
- **Nothing time-pressured, no streaks, no "you lost" states.** This constrains the gamification design (§9) more than it constrains anything else.

**Privacy — anonymous-first is now required, not preferred.**

An explicitly under-13 audience sits squarely in COPPA territory in the US, and GDPR-K sets the digital-consent age at 13–16 depending on the country. Collecting *any* PII — even a first name — would mean parental-consent flows before launch. The anonymous-first design (§5.7) avoids that entirely. **Don't let anyone "just add a name field" later** — that single field is what converts a simple site into a compliance project.

### 5.10 Field colours — decision, and one accessibility rule

The brief's text says *physics in blue, chem in purple, bio in green*; the mockup's cards are ambiguous. **Decision: follow the text** — adopted as a **default, reversible until design tokens are locked in P0.** The palette's own names corroborate it: Curious Blue, Fun Purple and Science Green map one-to-one onto the three fields, which is strong evidence the text is authoritative and the mockup is just a rough PhET reference.

| Field | Token | Hex |
|---|---|---|
| Physics | Curious Blue | `#42A5F5` |
| Chemistry | Fun Purple | `#8E7CFF` |
| Biology | Science Green | `#4CAF50` |

**The rule that matters: never use a field colour as text colour on a light background.** All three sit at roughly 2.5–3.2:1 against white — below the 4.5:1 needed for body text, and below even the 3:1 threshold for large text. Use them as **fills, borders, chips and illustration accents**, with Deep Charcoal `#263238` as the text on top. Charcoal-on-blue is readable; blue-on-white is not. Where a field colour must appear as text, use a darkened variant and check it.

**And never let colour be the only differentiator.** Around 1 in 12 boys has some colour vision deficiency, and blue/purple is precisely the pair that gets confused. Every field needs a **distinct shape or icon silhouette** alongside its colour, so the colour reinforces rather than carries the signal. This matters most in the experiment grid, where a coloured tag may otherwise be the only thing distinguishing cards.

---

## 6. Data model

The content model is genuinely simple, which is good — the complexity lives in the **progress/points** tables, the **media references**, and the **localization** strategy.

**Content** (all rows carry `status` draft/published, `published_at`, `updated_by`, `translations jsonb`)

```
fields            id, slug, name, color_token, intro_md, icon_svg, order
experiments       id, slug, field_id, title, hook, difficulty,
                  hero_media_id, est_minutes, order
experiment_materials  id, experiment_id, order, label, icon_svg
experiment_steps      id, experiment_id, order, title, flow_label,
                      body, media_id
experiment_concepts   id, experiment_id, order, title, body
```

**Media — the join between the two systems**

```
media             id, public_id, alt, width, height, format, bytes,
                  uploaded_by, created_at, status ('draft'|'in_use'|'orphaned')
```

`public_id` is the Cloudinary handle. **No `secure_url` column** — the delivery URL is built at render time (§3.2). `uploaded_by` is effectively a constant today (there is one admin), but keep it for the audit trail. Note what else is **absent**: no `interactive_kind`, no `interactive_ref`, no `media_kind` enum. The flowchart is derived from `experiment_steps` at render time, so it has no storage at all. `flow_label` is the only field that whole feature adds.

**Trivia — one table, one nullable FK, both behaviours.**

Your latest note says trivia lives *in each post*, which reads differently from the original brief's "general trivia, same content in every subject." Rather than force the choice now, one nullable FK covers both:

```
trivia_levels     id, level (1|2|3), label, unlock_rule
trivia_questions  id, level, prompt, explanation_md, difficulty,
                  experiment_id   -- NULL = general pool; set = this post's own trivia
trivia_options    id, question_id, label, is_correct
```

- `experiment_id IS NULL` → **general trivia**, shown in the Trivia tab on every field page, identical everywhere. This is the original brief's behaviour.
- `experiment_id = <id>` → **that experiment's trivia**, shown on the experiment page.

Supporting both costs one nullable column. Guessing wrong costs a migration plus a rewrite of every trivia query. Populate whichever you actually want at MVP and leave the other empty — but build the authoring form to handle both, because it's the same form either way.

**Resolve which you mean before P2**, because it changes what the field-page Trivia tab renders: the general pool, or an aggregate of that field's experiments' questions.

**Progress & gamification**

```
profiles          id (=auth.uid), display_name, mascot_config jsonb,
                  points_balance int, created_at
trivia_attempts   id, user_id, question_id, chosen_option_id, is_correct, answered_at
points_ledger     id, user_id, delta, reason, ref_id, created_at
cosmetics         id, slug, kind ('outfit'|'accessory'|'background'),
                  name, price, rarity, svg_layer_ref
user_cosmetics    user_id, cosmetic_id, acquired_at, equipped
badges            id, slug, name, rule_json
user_badges       user_id, badge_id, earned_at
```

> **Admin role is not in `profiles`.** It lives in `auth.users.raw_app_meta_data` → `app_metadata.role`, which only the service role can write (§5.1). Do not add an `is_admin` boolean to `profiles` — that table is user-readable and you'd be handing out admin.

**Four rules I'd hold firm on:**

1. **`points_balance` is derived, never authoritative.** Keep `points_ledger` as the source of truth and recompute. If you store a bare counter *and* a ledger, they will drift.
2. **Awarding points happens in a Postgres function**, not in a Server Action the client can replay. A `SECURITY DEFINER` RPC that (a) checks the user hasn't already answered this question, (b) inserts the attempt, (c) inserts the ledger row, (d) returns the new balance — all in one transaction.
3. **Store `public_id`, derive the URL.** Never persist a Cloudinary delivery URL (§3.2).
4. **Localizable fields are declared, not inferred.** Decide the list up front: `title`, `hook`, `body`, `label`, `flow_label`, `prompt`, `explanation`, `name`, `intro`. `slug`, `color_token`, `is_correct`, and `price` are **not** localized.

---

## 7. Route map

Indonesian at the root, English under `/en` when it exists:

```
/                                 home
/kimia | /fisika | /biologi       field pages  (?tab=eksperimen|trivia)
/eksperimen/[slug]                experiment detail
/trivia                           general trivia (same content as field tabs)
/webby                            get to know the mascot
/tantangan/[slug]                 today's challenge
/lencana                          badge corner
/profil                           points, owned cosmetics, equip
/masuk                            optional link-upgrade
/admin/**                         authoring (admin-gated, noindex)
```

SEO: `/eksperimen/[slug]` at the root level (flat, no field prefix) is better for search and simpler to share. Either works — just pick one and be consistent.

---

## 8. Suggested build order

| Phase | Deliverable | Notes |
|---|---|---|
| **P0 — Shell** | Next.js + Tailwind, design tokens from the palette, `[locale]` routing scaffold with Indonesian at root, home, field pages, experiment detail rendered from **local seed data**, including the flowchart component. Cloudinary wired. No database. | You can demo the whole site with zero backend. Fastest way to validate the IA. |
| **P1 — Admin dashboard** | Custom `/admin` on Supabase Postgres: experiment editor, media library, trivia editor, role enforcement. Migrate seed data in. Author publishes a real experiment end-to-end, with signed upload and mobile preview. | **The critical path.** Everything downstream depends on the author publishing. Budget the most time here. |
| **P2 — Trivia + points** | Anonymous auth, trivia tables + editor, `award_points()` RPC, points ledger, profile page. | The genuinely risky phase now. Write tests here. |
| **P3 — Gamification** | Layered-SVG mascot, cosmetics shop, equip flow, badges. | The brief's nice-to-have. Ship it last. |
| **P4 — Polish** | English locale, teacher view, PWA. | No analytics by design (§2). |

**The single highest-leverage decision:** do P0 entirely without Supabase. If the shell doesn't feel good with fake data, no amount of backend will fix it.

**The second:** get the author into the admin UI during P1 and watch them use it. Every form they hesitate on is a bug.

---

## 9. Deferred decisions

Parked deliberately — you said you'd rather decide these later, and that's fine. None of them blocks P0, so **you can start building the static shell today on seed data.** Each one carries a trigger, so parking them can't silently stall the build.

| Decision | Resolve before | Why it's safe to wait | What breaks if it slips |
|---|---|---|---|
| **Trivia scope** — per-post questions, or one general pool surfaced on every post? | **P2** | The schema carries both via a nullable `experiment_id` (§6), and the authoring form is identical either way. | The field-page Trivia tab has nothing defined to render. |
| **Gamification** — full points + cosmetics loop, trivia without the economy, or none at all? | **P2** | It's the last feature in the build order, sitting behind everything else. | P2's scope is undefined, so the phase can't be estimated or started. |
| **Field colours** | Already defaulted to the brief's text (§5.10) — revisit only if you decide the mockup wins | Reversible until design tokens are locked in P0. | Nothing. The default is wired. |

**The one hard rule: don't let the first two drift past P1.** Both of them define what P2 *is*, and you can't start a phase whose scope is a question mark.

**If you want a single forcing function**, put them on the agenda for the moment the author publishes their first real experiment through the admin. By then you'll know how the content actually reads — how long steps run, whether trivia fits naturally inside a post — which is better information than you have today. Deciding now would be guessing.

**For when you do decide — the gamification fork, in brief:**

- **Full loop.** Trivia + points + ledger + cosmetics. Costs P2 and P3.
- **Trivia without the economy.** Questions and answers, no points, no ledger, no cosmetics. Roughly a third of the work, keeps the interactive element.
- **None.** Home → field → experiment. Ships soonest, no points-integrity risk, no mascot asset pipeline. Webby still exists as a character, just not as a dress-up system.

The failure mode to avoid: building it because the first brief mentioned it, then spending two phases on something you deliberately decided not to measure.

**And "no analytics" doesn't mean no visibility.** A single count query in your own admin — `select count(*) from trivia_attempts` — tells you whether anyone is playing, with no third-party tool and no tracking. Worth having whichever fork you take.

---

## 10. One-paragraph summary

SpiderWeb is a Next.js + Supabase science site for kids, in Indonesian, modelled on PhET but reduced to three fields (Physics, Chemistry, Biology). Each field page shows an intro plus two tabs: Experiments and Trivia. Experiments have a fixed content shape — Title → Hook → Materials → Steps → Concepts — where Steps render as a **simple flowchart plus a numbered list**, with the flowchart derived automatically from the step rows rather than authored. That removes the interactive-experiment subsystem entirely: no canvas components, no iframes, no per-sim licensing, no touch-interaction layout problem, and no new fields for the author beyond an optional short node label. Supabase is the system of record for auth, content, progress, points, and every image reference; Cloudinary stores image bytes only, and Supabase holds the **`public_id`** while delivery URLs are built at render time. Authoring is a **custom admin-only dashboard** inside the same Next.js app, and it is the **only upload surface in the product** — structured repeatable forms (never markdown), signed direct-to-Cloudinary uploads, drag-to-reorder, a live flowchart preview, and draft → preview → publish. Admin access is a role in `app_metadata`, enforced in middleware, Server Actions, and RLS — never a flag on a user-readable table. Indonesian is primary, so the `[locale]` routing scaffold goes in at P0 even though English ships later. Targets are mobile and desktop, and the audience is pre-high-school kids (roughly 6–14) — which makes anonymous-first auth a **requirement rather than a preference**, since an under-13 audience means collecting any PII at all would trigger parental-consent flows. Field colours follow the brief's text (Physics blue, Chemistry purple, Biology green), but are never used as text on light backgrounds, and every field carries a distinct icon so colour is never the only signal. Family friendly is enforced through engineering: anonymous-first auth with no PII, no ads, no trackers, **no analytics at all**, no third-party embeds, no image analysis, no user-generated content, and a publish gate. The remaining risks are narrower than before — the authoring UX itself, the mobile experiment layout, and making points server-authoritative through a Postgres RPC and a ledger *if the gamification survives*. Two questions still sit open: whether trivia is per-post or a general pool, and whether the points-and-cosmetics loop earns its cost now that nothing is measured. Build the static shell first, on seed data, with no database at all — then build the admin, because everything downstream depends on the author being able to publish.
