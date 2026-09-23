import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signedIn, studioReady } from "@/lib/studio-auth";
import { signIn } from "../actions";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/* The way into the studio's dashboard. Nothing on the site links here. */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (await signedIn()) redirect("/studio");
  const { wrong } = await searchParams;

  return (
    <div data-register="paper" className="ground-paper flex min-h-dvh flex-col text-[var(--on-surface)]">
      <header className="border-b px-[clamp(16px,4vw,40px)] py-4" style={{ borderColor: "var(--line)" }}>
        <Link href="/" className="label" style={{ color: "var(--on-surface)" }}>
          KAS THREADZ <span style={{ color: "var(--accent)" }}>· Studio</span>
        </Link>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center px-5 py-16">
        <p className="label" style={{ color: "var(--accent)" }}>
          Studio
        </p>
        {studioReady() ? (
          <>
            <h1 className="mt-3 text-[28px]">The studio desk.</h1>
            <form action={signIn} className="mt-6 grid gap-3">
              <label className="grid gap-1">
                <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  required
                  autoFocus
                  autoComplete="current-password"
                  className="rounded-sm border bg-transparent px-3 py-[11px] text-[14px] outline-none focus:border-[var(--accent)]"
                  style={{ borderColor: "var(--line-dashed)" }}
                />
              </label>
              {wrong === "1" && (
                <p role="alert" className="text-[13px]" style={{ color: "var(--accent)" }}>
                  That is not the password.
                </p>
              )}
              <button
                type="submit"
                className="rounded-sm px-6 py-[13px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
                style={{ background: "var(--action)", color: "var(--on-action)" }}
              >
                Sign in
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-[26px]">The studio has no password yet.</h1>
            <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--on-surface-soft)" }}>
              Add <code className="text-[12px]">STUDIO_PASSWORD</code> to the host&apos;s environment
              variables, then redeploy. Until then the desk stays locked.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
