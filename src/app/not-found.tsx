import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export default function NotFound() {
  return (
    <div
      data-register="cloth"
      className="ground-cloth flex h-dvh flex-col overflow-hidden text-[var(--on-surface)]"
    >
      <SiteNav />

      <section
        id="main"
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center"
      >
        <p className="label" style={{ color: "var(--accent)" }}>
          Nothing on this thread
        </p>
        <h1 className="mt-3 text-[clamp(26px,4vw,40px)]">This one was never cut.</h1>
        <p
          className="mt-3 max-w-[46ch] text-[14px] leading-[1.7]"
          style={{ color: "var(--on-surface-soft)" }}
        >
          The page you asked for is not in the house. The collection and the design library are
          both a click away.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/collection"
            className="rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            The collection
          </Link>
          <Link
            href="/library"
            className="rounded-sm border px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface)" }}
          >
            The design library
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
