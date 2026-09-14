import Image from "next/image";
import cloudinaryLoader from "@/lib/cloudinary";

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
  sizes = "100vw",
  priority = false,
  className,
}: MediaImageProps) {
  return (
    <Image
      loader={cloudinaryLoader}
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
