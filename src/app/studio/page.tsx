import Link from "next/link";
import type { Metadata } from "next";
import { naira } from "@/lib/catalogue";
import { PREORDER, type Tier } from "@/lib/preorder";
import { preorderStore } from "@/lib/preorder-store";
import { orderRow } from "@/lib/studio-orders";
import { signedIn, studioReady } from "@/lib/studio-auth";
import { ThreadCount } from "../loom/thread-count";
import { signIn, signOut } from "./actions";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

/*
 * The studio's own page: every paid preorder, who it is for and what to cut,
 * with the count of each size and what has been taken. Behind a password;
 * nothing here is linked from the site.
 */
export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { wrong } = await searchParams;

  return (
    <div data-register="paper" className="ground-paper flex min-h-dvh flex-col text-[var(--on-surface)]">
      <header
        className="flex items-center justify-between gap-4 border-b px-[clamp(16px,4vw,40px)] py-4"
        style={{ borderColor: "var(--line)" }}
      >
        <Link href="/" className="label" style={{ color: "var(--on-surface)" }}>
          KAS THREADZ <span style={{ color: "var(--accent)" }}>· Studio</span>
        </Link>
        {(await signedIn()) && (
          <form action={signOut}>
            <button type="submit" className="label underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
              Sign out
            </button>
          </form>
        )}
      </header>
      <main id="main" className="flex flex-1 flex-col">
        {!studioReady() ? (
          <Note title="The studio has no password yet.">
            Add <code className="text-[12px]">STUDIO_PASSWORD</code> to the host&apos;s environment
            variables, then redeploy. Until then this page stays locked.
          </Note>
        ) : !(await signedIn()) ? (
          <SignIn wrong={wrong === "1"} />
        ) : (
          <Orders />
        )}
      </main>
    </div>
  );
}

function SignIn({ wrong }: { wrong: boolean }) {
  return (
    <section className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center px-5 py-16">
      <p className="label" style={{ color: "var(--accent)" }}>
        Studio
      </p>
      <h1 className="mt-3 text-[28px]">The preorder book.</h1>
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
        {wrong && (
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
    </section>
  );
}

async function Orders() {
  const store = preorderStore();
  if (!store) {
    return (
      <Note title="The preorder database is not connected.">
        Connect Upstash Redis in the host&apos;s Storage settings and redeploy; the orders and the
        count live there.
      </Note>
    );
  }
  const [orders, tally] = await Promise.all([store.orders(), store.tally()]);
  const rows = orders.map(orderRow);
  const taken = rows.reduce((sum, r) => sum + r.paidNaira, 0);
  const tiers = Object.keys(PREORDER) as Tier[];

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[clamp(20px,3vw,32px)] px-[clamp(16px,4vw,40px)] py-[clamp(20px,4vw,40px)]">
      <section>
        <p className="label" style={{ color: "var(--accent)" }}>
          Preorder · first run of {tiers.reduce((n, t) => n + PREORDER[t].total, 0)} sets
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiers.map((t) => {
            const { total, sold, held } = tally[t];
            const left = Math.max(0, total - sold - held);
            return (
              <div key={t} className="col-span-2 rounded-sm border px-4 py-3 sm:col-span-1" style={{ borderColor: "var(--line-dashed)" }}>
                <p className="flex items-baseline justify-between gap-2">
                  <span className="label" style={{ color: "var(--on-surface-soft)" }}>
                    {PREORDER[t].name} · {naira(PREORDER[t].price)}
                  </span>
                  <span className="font-mono text-[12px] tabular-nums">
                    {left} of {total} left
                  </span>
                </p>
                <ThreadCount left={left} total={total} active={t === "adult"} failed={false} />
                <p className="label mt-2" style={{ color: "var(--on-surface-soft)" }}>
                  {sold} sold{held ? ` · ${held} being paid for now` : ""}
                </p>
              </div>
            );
          })}
          <Figure label="Paid orders" value={String(rows.length)} />
          <Figure label="Taken" value={naira(taken)} />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px]">Orders</h1>
          {rows.length > 0 && (
            <a
              href="/studio/orders.csv"
              className="rounded-sm border px-4 py-[10px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
              style={{ borderColor: "var(--on-surface)", color: "var(--on-surface)" }}
            >
              Download spreadsheet
            </a>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 text-[14px]" style={{ color: "var(--on-surface-soft)" }}>
            No paid preorders yet. Each one appears here as soon as Paystack confirms it.
          </p>
        ) : (
          <>
            {/* a wide screen: one line an order, in a pane that scrolls on its own */}
            <div
              className="mt-4 hidden max-h-[calc(100dvh-120px)] overflow-auto rounded-sm border lg:block"
              style={{ borderColor: "var(--line-dashed)" }}
            >
              <table className="w-full border-collapse text-left text-[13px]">
                <thead className="sticky top-0" style={{ background: "var(--surface)" }}>
                  <tr>
                    {["Date", "Customer", "Size", "Cloth", "Neckline", "Paid"].map((h) => (
                      <th key={h} className="label border-b px-3 py-3 font-normal" style={{ borderColor: "var(--line-dashed)", color: "var(--on-surface-soft)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.reference} className="align-top">
                      <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                        {r.date}
                        <span className="code mt-1 block text-[10px]" style={{ color: "var(--on-surface-soft)" }}>
                          {r.reference}
                        </span>
                      </td>
                      <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                        <Customer r={r} />
                      </td>
                      <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>{r.size}</td>
                      <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                        {r.colour} {r.fabric.toLowerCase()}
                      </td>
                      <td className="border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>
                        <span className="code text-[12px]">{r.design}</span>
                        <span className="mt-1 block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                          {r.thread === "As designed" ? "Thread as designed" : `${r.thread} thread`}
                        </span>
                      </td>
                      <td className="price border-b px-3 py-3" style={{ borderColor: "var(--line)" }}>{r.paid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* a phone: one card an order */}
            <ul className="mt-4 grid gap-3 lg:hidden">
              {rows.map((r) => (
                <li key={r.reference} className="rounded-sm border px-4 py-3" style={{ borderColor: "var(--line-dashed)" }}>
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="label" style={{ color: "var(--on-surface-soft)" }}>{r.date}</span>
                    <span className="price text-[14px]">{r.paid}</span>
                  </p>
                  <div className="mt-2">
                    <Customer r={r} />
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed">
                    {r.size} · {r.colour} {r.fabric.toLowerCase()}
                    <br />
                    <span className="code text-[12px]">{r.design}</span>
                    {" · "}
                    {r.thread === "As designed" ? "thread as designed" : `${r.thread.toLowerCase()} thread`}
                  </p>
                  <p className="code mt-2 text-[10px]" style={{ color: "var(--on-surface-soft)" }}>{r.reference}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function Customer({ r }: { r: ReturnType<typeof orderRow> }) {
  return (
    <>
      <span className="block font-medium">{r.name || "No name given"}</span>
      {r.whatsapp ? (
        <a href={r.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-1 block underline underline-offset-4" style={{ color: "var(--accent)" }}>
          {r.phone} · WhatsApp
        </a>
      ) : (
        r.phone && <span className="mt-1 block">{r.phone}</span>
      )}
      {r.email && (
        <a href={`mailto:${r.email}`} className="mt-1 block break-all text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
          {r.email}
        </a>
      )}
    </>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between rounded-sm border px-4 py-3" style={{ borderColor: "var(--line-dashed)" }}>
      <span className="label" style={{ color: "var(--on-surface-soft)" }}>{label}</span>
      <span className="price mt-2 text-[24px] font-bold">{value}</span>
    </div>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center px-5 py-16">
      <p className="label" style={{ color: "var(--accent)" }}>Studio</p>
      <h1 className="mt-3 text-[26px]">{title}</h1>
      <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "var(--on-surface-soft)" }}>{children}</p>
    </section>
  );
}
