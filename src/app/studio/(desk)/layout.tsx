import Link from "next/link";
import type { Metadata } from "next";
import { requireStudio } from "@/lib/studio-auth";
import { signOut } from "../actions";
import { DeskNav } from "./desk-nav";

export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio" },
  robots: { index: false, follow: false },
};

/*
 * The studio's desk: orders, customers, products and figures, for the
 * studio alone. Every page and action behind it checks the sign-in itself;
 * this frame only draws the way around.
 */
export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  await requireStudio();
  return (
    <div data-register="paper" className="ground-paper flex min-h-dvh flex-col text-[var(--on-surface)] lg:flex-row">
      <aside
        className="flex shrink-0 flex-col border-b lg:sticky lg:top-0 lg:h-dvh lg:w-[228px] lg:border-b-0 lg:border-r"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 lg:py-6">
          <Link href="/studio" className="label" style={{ color: "var(--on-surface)" }}>
            KAS THREADZ <span style={{ color: "var(--accent)" }}>· Studio</span>
          </Link>
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="label underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
              Sign out
            </button>
          </form>
        </div>
        <DeskNav />
        <div className="mt-auto hidden flex-col gap-3 px-6 py-6 lg:flex">
          <Link href="/" className="label underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
            View the site
          </Link>
          <form action={signOut}>
            <button type="submit" className="label underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 flex-1 px-[clamp(16px,3.5vw,44px)] py-[clamp(20px,3.5vw,40px)]">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
      </main>
    </div>
  );
}
