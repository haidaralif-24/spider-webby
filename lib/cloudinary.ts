/**
 * Cloudinary delivery-URL builder.
 *
 * AGENTS.md §4.4 — THIS IS THE ONLY PLACE IN THE CODEBASE THAT MAY CONSTRUCT A
 * CLOUDINARY URL. Never build one inline in a component, never store one, never
 * build one in SQL.
 *
 * Supabase stores `media.public_id` and nothing else. The URL is derived at
 * render time, which is what keeps the cloud name and the transform out of the
 * database (brief §3.2). If the account is ever outgrown, migrating off
 * Cloudinary is one URL-builder change plus a data migration — storing
 * `secure_url` would have made it a rewrite (brief §3.3).
 *
 * There is deliberately no Cloudinary SDK import here. Building a delivery URL
 * is string concatenation, and the SDK is only needed server-side for signed
 * uploads (P1). That also keeps P0 free of any credentialed dependency.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * True once `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set. P0 renders from local
 * seed data and does not require it; P1 does.
 */
export function isCloudinaryConfigured(): boolean {
  return typeof CLOUD_NAME === "string" && CLOUD_NAME.length > 0;
}

type DeliveryOptions = {
  /** Rendered width in CSS pixels. Required — requesting the right size is what
   * makes delivery cheap (brief §3.3). */
  width: number;
  /** Emitted as `q_*`. Omit to let Cloudinary choose (`q_auto`). */
  quality?: number;
};

/**
 * Builds a delivery URL from a stored `public_id`.
 *
 * `f_auto,q_auto` typically cuts image weight 60–80%, and Cloudinary generates
 * and edge-caches each variant lazily, so you only pay for the sizes you
 * actually serve. Never pre-generate variants on upload (AGENTS.md §4.4).
 */
export function buildDeliveryUrl(
  publicId: string,
  { width, quality }: DeliveryOptions,
): string {
  if (!CLOUD_NAME) {
    throw new Error(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set. See .env.example.",
    );
  }

  const transforms = [
    "f_auto",
    quality === undefined ? "q_auto" : `q_${quality}`,
    `w_${Math.round(width)}`,
    // c_limit: never upscale past the original, never crop here. Cropping is an
    // upload-time concern with a per-slot preset (AGENTS.md §4.6), not a
    // delivery-time one.
    "c_limit",
  ].join(",");

  const id = publicId.replace(/^\/+/, "");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${id}`;
}

/**
 * `next/image` custom loader (brief §3.2).
 *
 * Attached PER IMAGE by `components/media-image.tsx` rather than configured as a
 * global `loaderFile`, because a global loader would also swallow the repo's own
 * SVG art (Webby, icons), which never goes through Cloudinary.
 *
 * This is the default export so it can also be wired as `images.loaderFile` if
 * the site ever becomes Cloudinary-only.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  return buildDeliveryUrl(src, { width, quality });
}
