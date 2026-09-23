import Link from "next/link";
import { getContent } from "@/lib/content";
import { preorderStore } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";
import { saveJallabiya } from "../../actions";
import { Field, PageHead, Panel, Saved, SubmitButton, fieldClass } from "../../ui";

export const metadata = { title: "Jallabiya preorder" };

export default async function JallabiyaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const { saved } = await searchParams;
  const cat = await getContent();
  const tally = await preorderStore()?.tally(cat.terms);
  const input = { className: fieldClass, style: { borderColor: "var(--line-dashed)" } };

  return (
    <>
      <Link href="/studio/products" className="label mb-4 inline-block underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
        Products
      </Link>
      <PageHead title="Jallabiya preorder" note="The prices customers pay in full, how many sets of each size the run has, and whether it is taking orders." />
      <Saved show={saved === "1"} />

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
            <Field label="Line under the heading" hint="A sentence or two under “Build it before we cut it.”">
              <textarea name="description" rows={3} defaultValue={cat.preorder.description} maxLength={300} {...input} />
            </Field>
          </div>
        </Panel>

        <div>
          <SubmitButton>Save</SubmitButton>
        </div>
      </form>

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
