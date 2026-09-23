"use client";

import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useId, useState } from "react";

/**
 * A photograph for the site: the one there now, a way to upload another,
 * and what it shows, for people who cannot see it. The upload goes straight
 * to Vercel Blob; the form only carries its address.
 */
export function PhotoField({
  label,
  hint,
  urlName,
  altName,
  url,
  alt,
  required = false,
}: {
  label: string;
  hint?: string;
  urlName: string;
  altName: string;
  url: string | null;
  alt: string;
  required?: boolean;
}) {
  const id = useId();
  const [src, setSrc] = useState(url ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const name = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
      const blob = await upload(`studio/${name}`, file, { access: "public", handleUploadUrl: "/studio/upload" });
      setSrc(blob.url);
    } catch {
      setError(
        "The photo could not be uploaded. Check that a Blob store is connected in Vercel's Storage tab, and that the file is a JPEG, PNG or WebP under 15 MB.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="label" style={{ color: "var(--on-surface-soft)" }}>
        {label}
      </span>
      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="relative aspect-[4/5] w-full max-w-[160px] overflow-hidden rounded-sm border" style={{ borderColor: "var(--line-dashed)" }}>
          {src ? (
            <Image src={src} alt="" fill unoptimized sizes="160px" className="object-cover" />
          ) : (
            <span className="label absolute inset-0 grid place-items-center text-center" style={{ color: "var(--on-surface-soft)" }}>
              No photo
            </span>
          )}
        </div>
        <div className="grid content-start gap-2">
          <input type="hidden" name={urlName} value={src} required={required} />
          <label
            htmlFor={id}
            className="label inline-block w-fit cursor-pointer rounded-sm border px-4 py-[10px]"
            style={{ borderColor: "var(--on-surface)", opacity: busy ? 0.5 : 1 }}
          >
            {busy ? "Uploading" : src ? "Replace photo" : "Upload photo"}
          </label>
          <input id={id} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
          {src && !required && (
            <button type="button" onClick={() => setSrc("")} className="label w-fit underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
              Remove, and use the site&apos;s own photo
            </button>
          )}
          <input
            name={altName}
            defaultValue={alt}
            placeholder="What it shows, in a sentence"
            className="w-full rounded-sm border bg-transparent px-3 py-[10px] text-[14px] outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line-dashed)" }}
          />
          {hint && (
            <span className="text-[12px] leading-snug" style={{ color: "var(--on-surface-soft)" }}>
              {hint}
            </span>
          )}
          {error && (
            <p role="alert" className="text-[12px] leading-snug" style={{ color: "var(--accent)" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
