"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { requestUploadSignature, saveMedia } from "@/app/admin/media/actions";
import { MediaImage } from "@/components/media-image";
import id from "@/messages/id.json";

/**
 * The admin upload form.
 *
 * The file does not pass through this app. A phone photo is 3–8MB, past Vercel's
 * serverless request-body limit, so the browser POSTs it straight to Cloudinary
 * with a signature the server produced (AGENTS.md §4.4). Nothing here is trusted:
 * the server signed every upload parameter, and `saveMedia` re-checks that the
 * `public_id` came from our own folder.
 *
 * A client component because a file input and a multi-step upload are genuinely
 * interactive. `/admin` is allowed to be dynamic (§4.5).
 */

type Uploaded = {
  publicId: string;
  width: number;
  height: number;
  alt: string;
};

/** The three crop presets from AGENTS.md §4.6, at display size for the preview. */
const SLOT_PREVIEWS = [
  {
    slot: "hero",
    label: id.admin.slotHero,
    size: "h-[135px] w-[240px]",
    hint: "240px",
  },
  {
    slot: "step",
    label: id.admin.slotStep,
    size: "h-[150px] w-[200px]",
    hint: "200px",
  },
  {
    slot: "thumb",
    label: id.admin.slotThumb,
    size: "h-[140px] w-[140px]",
    hint: "140px",
  },
] as const;

export function UploadForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<Uploaded | null>(null);

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    /* Checked here for the fast, inline message, and again in `saveMedia` —
     * the client is never the boundary. */
    if (!file) {
      setError(id.admin.uploadNoFile);
      return;
    }
    if (!alt.trim()) {
      setError(id.admin.uploadAltMissing);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const signed = await requestUploadSignature();

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signed.apiKey);
      for (const [key, value] of Object.entries(signed.fields)) {
        body.append(key, value);
      }

      const response = await fetch(signed.endpoint, { method: "POST", body });
      if (!response.ok) throw new Error(`upload failed: ${response.status}`);

      const result = (await response.json()) as {
        public_id: string;
        width: number;
        height: number;
        format: string;
        bytes: number;
      };

      const saved = await saveMedia({
        publicId: result.public_id,
        alt: alt.trim(),
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });

      if (saved.error) {
        setError(saved.error);
        return;
      }

      setUploaded({
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        alt: alt.trim(),
      });
      setFile(null);
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError(id.admin.uploadFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border-[3px] border-deep-charcoal bg-lab-mist p-5 sm:p-6">
      <h2 className="font-display text-xl font-extrabold text-deep-charcoal">
        {id.admin.uploadHeading}
      </h2>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="file"
            className="text-sm font-bold text-deep-charcoal"
          >
            {id.admin.uploadPick}
          </label>
          <input
            ref={fileRef}
            id="file"
            name="file"
            type="file"
            accept="image/*"
            onChange={onPick}
            className="min-h-touch w-full cursor-pointer rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-4 py-3 text-sm text-deep-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-deep-charcoal file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-cloud-white"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="alt" className="text-sm font-bold text-deep-charcoal">
            {id.admin.uploadAlt}
          </label>
          {/* A hint up front rather than a red message after submit — AGENTS.md
           * §4.6 asks validation to teach, not to punish. */}
          <p className="text-sm text-deep-charcoal/70">
            {id.admin.uploadAltHint}
          </p>
          <input
            id="alt"
            name="alt"
            type="text"
            value={alt}
            maxLength={160}
            onChange={(event) => setAlt(event.target.value)}
            className="min-h-touch rounded-2xl border-[3px] border-deep-charcoal bg-cloud-white px-4 py-3 text-base text-deep-charcoal outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep-charcoal"
          />
          <p className="self-end text-sm text-deep-charcoal/60">
            {alt.length}/160
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-2xl border-[3px] border-deep-charcoal bg-energy-orange px-4 py-3 text-base font-bold text-deep-charcoal"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="btn-playful inline-flex min-h-touch w-fit items-center justify-center rounded-2xl border-[3px] border-deep-charcoal bg-science-green px-6 py-3 text-lg font-bold text-deep-charcoal disabled:opacity-70"
        >
          {busy ? id.admin.uploadBusy : id.admin.uploadStart}
        </button>
      </form>

      {/* The crop preview. This is what AGENTS.md §4.6's "crop preset per slot"
       * actually needs: the author has to see how one upload will be cut for a
       * hero, a step and a thumbnail, because those are three different pictures
       * made from one file. */}
      {uploaded ? (
        <div className="mt-7 border-t-[3px] border-dashed border-deep-charcoal/30 pt-5">
          <p
            role="status"
            className="text-base font-bold text-deep-charcoal"
          >
            {id.admin.uploadDone}
          </p>
          <h3 className="mt-4 text-sm font-bold text-deep-charcoal">
            {id.admin.slotHeading}
          </h3>
          <ul className="mt-3 flex flex-wrap items-start gap-5">
            {SLOT_PREVIEWS.map((preview) => (
              <li key={preview.slot} className="flex flex-col gap-2">
                <MediaImage
                  publicId={uploaded.publicId}
                  alt={uploaded.alt}
                  width={uploaded.width}
                  height={uploaded.height}
                  slot={preview.slot}
                  sizes={preview.hint}
                  className={`rounded-xl border-[3px] border-deep-charcoal object-cover ${preview.size}`}
                />
                <span className="text-sm text-deep-charcoal/75">
                  {preview.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
