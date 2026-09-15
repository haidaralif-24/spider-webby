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
  /**
   * Slot aspect ratio, e.g. `"16:9"`. When given, the image is centre-cropped to
   * that ratio; when omitted it is scaled down and never cropped.
   *
   * **This is a reversal of an earlier reading of AGENTS.md §4.6**, which asks
   * for a per-slot crop preset "on upload". Baking crops into the stored asset
   * cannot work here: `media` has no slot column, so a cropped `public_id` would
   * arrive at the renderer unlabelled and unusable in any other slot. The whole
   * point of storing `public_id` and building the URL at render time (§3.2,
   * §4.4) is that one original serves every slot. The crop still happens per
   * slot — just at delivery, where the slot is actually known.
   */
  aspect?: string;
};

/**
 * The crop presets from AGENTS.md §4.6, as delivery-time ratios.
 *
 * Written out rather than computed so the aspect strings are greppable against
 * the rule that specifies them.
 */
export const MEDIA_SLOTS = {
  /** Experiment hero. */
  hero: { aspect: "16:9", width: 1200 },
  /** Illustration inside a numbered step. */
  step: { aspect: "4:3", width: 800 },
  /** Grid card thumbnail. */
  thumb: { aspect: "1:1", width: 400 },
} as const;

export type MediaSlot = keyof typeof MEDIA_SLOTS;

/**
 * Builds a delivery URL from a stored `public_id`.
 *
 * `f_auto,q_auto` typically cuts image weight 60–80%, and Cloudinary generates
 * and edge-caches each variant lazily, so you only pay for the sizes you
 * actually serve. Never pre-generate variants on upload (AGENTS.md §4.4).
 */
export function buildDeliveryUrl(
  publicId: string,
  { width, quality, aspect }: DeliveryOptions,
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
    aspect ? `c_fill,ar_${aspect}` : "c_limit",
  ].join(",");

  const id = publicId.replace(/^\/+/, "");

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${id}`;
}

/**
 * A loader bound to one slot's crop.
 *
 * `next/image` calls its loader with `{ src, width, quality }` and nothing else,
 * so a per-slot crop cannot be passed through as a prop — it has to be closed
 * over. Building the loader here keeps every Cloudinary URL decision in this
 * file rather than leaking the transform syntax into a component.
 */
export function makeCloudinaryLoader(aspect?: string) {
  return function loader({
    src,
    width,
    quality,
  }: {
    src: string;
    width: number;
    quality?: number;
  }): string {
    return buildDeliveryUrl(src, { width, quality, aspect });
  };
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
