"use client";

import Image from "next/image";
import cloudinaryLoader, {
  makeCloudinaryLoader,
  MEDIA_SLOTS,
  type MediaSlot,
} from "@/lib/cloudinary";

/**
 * Renders a Cloudinary asset from its stored `public_id`.
 *
 * The only path from a `media` row to a pixel. Do not import `next/image` with a
 * Cloudinary `src` anywhere else — the loader must stay attached (AGENTS.md §4.4).
 *
 * ## Why this is a client component
 *
 * `next/image` is itself a client component, so the `loader` prop is a function
 * being handed across the server/client boundary — which React refuses, with
 * "Functions cannot be passed directly to Client Components". That only surfaced
 * when the first *server* component rendered this: until then every caller was
 * inside `/admin`, where the whole subtree is already client-side.
 *
 * Marking this `"use client"` puts the loader on the client, where it is created
 * rather than serialised, and the cost is close to nil — `next/image`'s runtime
 * is in the bundle the moment `<Image>` appears in a tree at all.
 *
 * The alternative, if strict zero client JS on public pages matters more than the
 * `next/image` rule in AGENTS.md §4.4, is a plain `<img>` with a `srcSet` built
 * here from `buildDeliveryUrl`. That is a real option, not a worse one — it just
 * trades the documented image pipeline for a smaller bundle.
 *
 * The slot's crop is bound into the loader rather than passed as a prop, because
 * `next/image` only ever hands its loader `{ src, width, quality }`.
 */

type MediaImageProps = {
  /** The Cloudinary `public_id` stored in `media.public_id` — NEVER a URL. */
  publicId: string;
  /**
   * Required, not optional. The admin also enforces it (AGENTS.md §4.6), but
   * making the prop non-optional means a missing alt text is a type error rather
   * than a production a11y bug (AGENTS.md §4.9).
   */
  alt: string;
  /** Intrinsic dimensions from the `media` row, used to reserve layout space. */
  width: number;
  height: number;
  /**
   * Which crop preset this image is used in (AGENTS.md §4.6). Omit to serve the
   * whole original, scaled down and never cropped.
   */
  slot?: MediaSlot;
  /**
   * Real `sizes` string for the slot this image fills. Defaults to `100vw`,
   * which is right for a hero and wrong for a grid card — pass it explicitly.
   */
  sizes?: string;
  /** Above-the-fold images only. Everything else stays lazy. */
  priority?: boolean;
  className?: string;
};

/**
 * Renders a Cloudinary asset from its stored `public_id`.
 *
 * The only path from a `media` row to a pixel. Do not import `next/image` with a
 * Cloudinary `src` anywhere else — the loader must stay attached (AGENTS.md §4.4).
 */
export function MediaImage({
  publicId,
  alt,
  width,
  height,
  slot,
  sizes = "100vw",
  priority = false,
  className,
}: MediaImageProps) {
  return (
    <Image
      loader={
        slot ? makeCloudinaryLoader(MEDIA_SLOTS[slot].aspect) : cloudinaryLoader
      }
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
