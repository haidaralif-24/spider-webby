import { createHash } from "node:crypto";
import { requireEnv } from "@/lib/env";

/**
 * Cloudinary upload signing.
 *
 * **Server-only** — it imports `node:crypto` and reads the API secret. Kept
 * apart from `lib/cloudinary.ts` so that file stays importable by client
 * components (it builds delivery URLs from a public cloud name, which is the
 * only Cloudinary concern the browser is allowed to have).
 *
 * AGENTS.md §4.4: uploads are signed by a Server Action and the API secret never
 * reaches the browser. **No unsigned preset.** An unsigned preset is a public
 * write endpoint — anyone who reads the page source can fill your account.
 *
 * The shape here is deliberate: the server builds *every* parameter and signs
 * the whole set, then hands the browser a bag to POST verbatim. The browser
 * cannot change a value without invalidating the signature.
 *
 * ## The one thing that is not signed, and why
 *
 * Incoming-transformation parameters (`angle`, `crop`, `width`) are sent but
 * **excluded from the signature**. That is not an oversight — Cloudinary
 * requires it, and says so outright when it rejects a request:
 *
 *     Invalid Signature 27a3d792…. String to sign -
 *     'folder=spiderweb&timestamp=1789457058'.
 *
 * The string it wanted contained only the upload parameters. Signing the
 * transformation parameters too produced a 401 on every upload; signing only
 * `folder` and `timestamp` produced "Missing required parameter - file", which
 * is Cloudinary getting past the signature check and complaining about the file
 * instead. That is the test that settled it.
 *
 * The cost is real but small: a caller could tamper with `width` to skip the
 * size cap. Against the single trusted author this product has (AGENTS.md §4.1),
 * a client-side cap was never a security control anyway.
 */

/** Everything lands under one prefix, which makes the orphan sweep a prefix
 *  query rather than a table scan. */
export const UPLOAD_FOLDER = "spiderweb";

/**
 * Longest edge, in pixels, after upload.
 *
 * AGENTS.md §4.6 asks uploads to "auto-resize"; §4.4 says never transform on
 * upload. This is the reconciliation: a cap on the *original* is a sanity limit
 * on a 12MP phone photo (3–8MB, which is also what makes a direct-to-Cloudinary
 * upload necessary rather than proxying through a Server Action), not a
 * derivative. Nothing slot-specific is baked in — see `MEDIA_SLOTS`.
 */
const MAX_DIMENSION = 2400;

export type SignedUpload = {
  /** Where to POST. */
  endpoint: string;
  /** Public by design; it identifies the account, it does not authorise. */
  apiKey: string;
  /** Every field the browser must send. Only some of them are signed. */
  fields: Record<string, string>;
};

/**
 * Cloudinary's signature: the parameters sorted by name, joined as
 * `k=v&k=v`, with the API secret appended, SHA-1 hex.
 *
 * `file`, `api_key`, `cloud_name`, `resource_type` and `signature` are excluded
 * by Cloudinary's rules. So are incoming transformations — see the note above.
 */
function sign(params: Record<string, string | number>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(toSign + secret).digest("hex");
}

function toStrings(
  params: Record<string, string | number>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
}

export function buildSignedUpload(): SignedUpload {
  const cloudName = requireEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const secret = requireEnv("CLOUDINARY_API_SECRET");

  /* Signed. */
  const uploadParams = {
    timestamp: Math.floor(Date.now() / 1000),
    folder: UPLOAD_FOLDER,
  };

  /* Sent, but not part of the signature.
   *
   * `angle: exif` corrects orientation from EXIF — without it a photo taken in
   * portrait arrives sideways and nothing downstream can tell that it should
   * not be, because the orientation was in the metadata we stripped. */
  const incomingTransformation = {
    angle: "exif",
    crop: "limit",
    width: MAX_DIMENSION,
  };

  return {
    endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    apiKey,
    fields: {
      ...toStrings(uploadParams),
      ...toStrings(incomingTransformation),
      signature: sign(uploadParams, secret),
    },
  };
}
