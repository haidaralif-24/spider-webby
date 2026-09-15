"use server";

import { requireAdmin } from "@/lib/auth";
import { buildSignedUpload, UPLOAD_FOLDER } from "@/lib/cloudinary-sign";
import { createClient } from "@/lib/supabase/server";
import id from "@/messages/id.json";

/**
 * The two halves of an admin upload.
 *
 * The file itself never passes through this app. A phone photo is 3–8MB, which
 * is past Vercel's serverless request-body limit, so the browser POSTs straight
 * to Cloudinary with a signature this app produced (AGENTS.md §4.4). Two round
 * trips, no bytes:
 *
 *   1. `requestUploadSignature` — the server builds every parameter and signs
 *      the whole set. The browser cannot change a value without invalidating the
 *      signature, so "resize to whatever the client asks for" is not an attack
 *      that exists.
 *   2. `saveMedia` — the browser reports back what Cloudinary stored, and this
 *      records the `public_id`.
 *
 * Both call `requireAdmin()` themselves. The middleware redirect is UX; an
 * action is reachable by anyone who can POST to it, so it has to be its own
 * boundary (AGENTS.md §4.2).
 */

export async function requestUploadSignature() {
  await requireAdmin();
  return buildSignedUpload();
}

export type SaveMediaInput = {
  publicId: string;
  alt: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export type SaveMediaResult = {
  error: string | null;
  /** The new `media.id`, so a caller can select it immediately. */
  id: string | null;
};

export async function saveMedia(
  input: SaveMediaInput,
): Promise<SaveMediaResult> {
  const admin = await requireAdmin();

  const alt = input.alt.trim();
  if (!alt) return { error: id.admin.uploadAltMissing, id: null };
  if (!input.publicId) return { error: id.admin.uploadFailed, id: null };

  /* Only assets that came through our own signing endpoint. Without this, a
   * caller could record a `public_id` pointing at anything in the Cloudinary
   * account — including something they uploaded by other means. */
  if (!input.publicId.startsWith(`${UPLOAD_FOLDER}/`)) {
    return { error: id.admin.uploadFailed, id: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media")
    .insert({
      public_id: input.publicId,
      alt,
      width: Math.round(input.width),
      height: Math.round(input.height),
      format: input.format,
      bytes: Math.round(input.bytes),
      uploaded_by: admin.id,
      /* `draft` until something references it. The orphaned-upload sweep moves
       * unreferenced rows on from here (brief §3.2). */
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    /* Same reasoning as the experiment save: the author gets a friendly
     * message, the operator gets the PostgREST error. */
    console.error("[admin/media] insert media", error);
    return { error: id.admin.uploadFailed, id: null };
  }

  /* No `revalidatePath`: /admin/media reads cookies, so it is dynamic and always
   * fresh. The client calls `router.refresh()` after this resolves. */
  return { error: null, id: data.id };
}
