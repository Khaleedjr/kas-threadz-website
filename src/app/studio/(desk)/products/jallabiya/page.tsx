import Link from "next/link";
import { getContent } from "@/lib/content";
import { preorderStore } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";
import { saveJallabiya, startNewRun } from "../../actions";
import { Field, PageHead, Panel, Saved, SubmitButton, dateOnly, fieldClass } from "../../ui";

export const metadata = { title: "Jallabiya preorder" };

export default async function JallabiyaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const { saved, reset } = await searchParams;
  const cat = await getContent();
  const store = preorderStore();
  const [tally, run] = store ? await Promise.all([store.tally(cat.terms), store.runStarted()]) : [undefined, null];
  const input = { className: fieldClass, style: { borderColor: "var(--line-dashed)" } };

  return (
    <>
      <Link href="/studio/products" className="label mb-4 inline-block underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
        Products
      </Link>
      <PageHead title="Jallabiya preorder" note="The prices customers pay in full, how many sets of each size the run has, and whether it is taking orders." />
      <Saved show={saved === "1"} />
      <Saved show={reset === "1"}>A new run has started. Every size is back to its full count.</Saved>

      <form action={saveJallabiya} className="grid gap-3">
        <div className="grid gap-3 lg:grid-cols-2">
          {(["adult", "children"] as const).map((t) => (
            <Panel key={t} title={cat.terms[t].name}>
              <div className="grid gap-4">
                <Field label="Price, naira" hint="Paid in full at checkout. Changes the price shown and the price charged.">
                  <input name={`${t}Price`} inputMode="numeric" defaultValue={cat.terms[t].price} required {...input} />
                </Field>
                <Field
                  label="Sets in the run"
                  hint={`The whole run, sold ones included.${tally ? ` ${tally[t].sold} sold so far${tally[t].held ? `, ${tally[t].held} being paid for now` : ""}.` : ""} Setting it to what is sold closes this size.`}
                >
                  <input name={`${t}Sets`} inputMode="numeric" defaultValue={cat.terms[t].total} required {...input} />
                </Field>
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="On the Loom">
          <div className="grid gap-4">
            <label className="flex items-start gap-3">
              <input type="checkbox" name="open" defaultChecked={cat.preorder.open} className="mt-[3px] h-4 w-4" />
              <span className="text-[14px] leading-snug">
                Taking orders
                <span className="block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                  Untick to close the preorder. The Loom still builds a jallabiya, but the pay button is turned off.
                </span>
              </span>
            </label>
            <Field label="Line under the heading" hint="A sentence or two under “See it before we sew it.”">
              <textarea name="description" rows={3} defaultValue={cat.preorder.description} maxLength={300} {...input} />
            </Field>
          </div>
        </Panel>

        <div>
          <SubmitButton>Save</SubmitButton>
        </div>
      </form>

      {store && (
        <form action={startNewRun} className="mt-[clamp(24px,4vw,40px)]">
          <Panel title="Reset the count">
            <div className="grid gap-4">
              <p className="max-w-[62ch] text-[14px] leading-relaxed">
                Starts a new run: every size goes back to its full count, with none sold.
                <span className="mt-2 block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                  Paid orders stay under Orders as the record of what was taken. Cancelling one from an earlier run no longer
                  changes the count. Sets someone is paying for right now stay held until they pay or the half hour runs out.
                  {run ? ` This run started on ${dateOnly(run)}.` : ""}
                </span>
              </p>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="confirm" required className="mt-[3px] h-4 w-4" />
                <span className="text-[14px] leading-snug">
                  Yes, start the count again from nought
                  {reset === "unticked" && (
                    <span role="alert" className="block text-[12px]" style={{ color: "var(--accent)" }}>
                      Tick the box first. Nothing was reset.
                    </span>
                  )}
                </span>
              </label>
              <div>
                <SubmitButton>Reset the count</SubmitButton>
              </div>
            </div>
          </Panel>
        </form>
      )}

      <p className="mt-6 text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
        Colours and fabrics are under{" "}
        <Link href="/studio/loom" className="underline underline-offset-4" style={{ color: "var(--accent)" }}>
          Loom options
        </Link>
        .
      </p>
    </>
  );
}
