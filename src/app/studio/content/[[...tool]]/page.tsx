import { NextStudio } from "next-sanity/studio";
import config from "../../../../../sanity.config";
import { sanityConnected } from "@/sanity/env";

/* The content editor. Sanity Studio runs entirely in the browser, so the
   page itself is built once and never changes. */
export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function ContentPage() {
  if (!sanityConnected) {
    return (
      <div data-register="paper" className="ground-paper flex min-h-dvh items-center justify-center px-5 text-[var(--on-surface)]">
        <div className="max-w-[480px]">
          <p className="label" style={{ color: "var(--accent)" }}>
            Studio · content
          </p>
          <h1 className="mt-3 text-[26px]">Sanity is not connected yet.</h1>
          <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--on-surface-soft)" }}>
            Add NEXT_PUBLIC_SANITY_PROJECT_ID to the host&apos;s environment variables and redeploy.
            Until then the site uses its built-in colours, fabrics, prices and photographs.
          </p>
        </div>
      </div>
    );
  }
  return <NextStudio config={config} />;
}
