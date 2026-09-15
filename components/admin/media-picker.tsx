"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { requestUploadSignature, saveMedia } from "@/app/admin/media/actions";
import { MediaImage } from "@/components/media-image";
import type { MediaSlot } from "@/lib/cloudinary";
import id from "@/messages/id.json";

/**
 * Pick an image for one slot, or upload a new one without leaving the form.
 *
 * The upload path is the same signed flow as `/admin/media` — the server builds
 * and signs every parameter, the browser posts the bytes straight to Cloudinary
 * (AGENTS.md §4.4). Nothing here is trusted: `saveMedia` re-checks the role and
 * re-checks that the `public_id` came from our own folder.
 *
 * The slot decides the crop, and the crop is applied at delivery rather than
 * baked into the upload, so one photo can serve a hero, a step and a thumbnail.
 */

export type MediaItem = {
  id: string;
  public_id: string;
  alt: string;
  width: number;
  height: number;
};

type MediaPickerProps = {
  label: string;
  /** Which crop preset this slot uses (AGENTS.md §4.6). */
  slot: MediaSlot;
  /** The selected `media.id`, or null. */
  value: string | null;
  items: readonly MediaItem[];
  onChange: (id: string | null) => void;
};

export function MediaPicker({
  label,
  slot,
  value,
  items,
  onChange,
}: MediaPickerProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((item) => item.id === value) ?? null;

  async function upload() {
    const file = fileRef.current?.files?.[0];
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
      for (const [key, field] of Object.entries(signed.fields)) {
        body.append(key, field);
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

      /* Select it straight away rather than making the author hunt for it in the
       * library. */
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      onChange(saved.id);
      router.refresh();
    } catch {
      setError(id.admin.uploadFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-deep-charcoal">{label}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-2">
          {selected ? (
            <MediaImage
              publicId={selected.public_id}
              alt={selected.alt}
              width={selected.width}
              height={selected.height}
              slot={slot}
              sizes="200px"
              className="h-[120px] w-[200px] rounded-xl border-[3px] border-deep-charcoal object-cover"
            />
          ) : (
            <div className="flex h-[120px] w-[200px] items-center justify-center rounded-xl border-[3px] border-dashed border-deep-charcoal/40 text-sm text-deep-charcoal/60">
              {id.admin.pickerNone}
            </div>
          )}

          {selected ? (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="self-start text-sm font-bold text-deep-charcoal underline"
            >
              {id.admin.pickerClear}
            </button>
          ) : null}
        </div>

        <div className="flex min-w-[240px] flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              aria-label={id.admin.uploadPick}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setError(event.target.files?.[0] ? null : error)
              }
              className="min-h-touch flex-1 cursor-pointer rounded-xl border-[3px] border-deep-charcoal bg-cloud-white px-3 py-2 text-sm text-deep-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-deep-charcoal file:px-3 file:py-1 file:text-sm file:font-bold file:text-cloud-white"
            />
            <input
              type="text"
              value={alt}
              maxLength={160}
              placeholder={id.admin.uploadAlt}
              aria-label={id.admin.uploadAlt}
              onChange={(event) => setAlt(event.target.value)}
              className="min-h-touch flex-1 rounded-xl border-[3px] border-deep-charcoal bg-cloud-white px-3 py-2 text-sm text-deep-charcoal"
            />
            <button
              type="button"
              onClick={upload}
              disabled={busy}
              className="btn-playful inline-flex min-h-touch items-center rounded-xl border-[3px] border-deep-charcoal bg-science-green px-4 py-2 text-sm font-bold text-deep-charcoal disabled:opacity-70"
            >
              {busy ? id.admin.uploadBusy : id.admin.uploadStart}
            </button>
          </div>

          {error ? (
            <p role="alert" className="text-sm font-bold text-deep-charcoal">
              {error}
            </p>
          ) : null}

          {items.length > 0 ? (
            <ul className="flex max-h-[150px] flex-wrap gap-2 overflow-y-auto rounded-xl border-[3px] border-deep-charcoal/20 p-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onChange(item.id)}
                    aria-pressed={item.id === value}
                    className={`block rounded-lg border-[3px] p-0.5 ${
                      item.id === value
                        ? "border-deep-charcoal bg-discovery-yellow"
                        : "border-transparent"
                    }`}
                  >
                    <MediaImage
                      publicId={item.public_id}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      slot="thumb"
                      sizes="64px"
                      className="h-16 w-16 rounded object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
