import Link from "next/link";
import { notFound } from "next/navigation";
import { GARMENT_LABEL, type Garment } from "@/lib/catalogue";
import { getContent } from "@/lib/content";
import { requireStudio } from "@/lib/studio-auth";
import { deletePiece, savePiece } from "../../actions";
import { ConfirmButton } from "../../confirm-button";
import { PhotoField } from "../../photo-field";
import { Field, PageHead, Panel, SubmitButton, fieldClass } from "../../ui";

export const metadata = { title: "Piece" };

const ERRORS: Record<string, string> = {
  name: "Give the piece a name.",
  taken: "There is already a piece with that name. Choose another.",
  photo: "Add a photo of the piece.",
};

export default async function PiecePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const { slug } = await params;
  const { error } = await searchParams;
  const isNew = slug === "new";
  const { pieces } = await getContent();
  const piece = isNew ? null : pieces.find((p) => p.slug === slug);
  if (!isNew && !piece) notFound();
  const input = { className: fieldClass, style: { borderColor: "var(--line-dashed)" } };

  return (
    <>
      <Link href="/studio/products" className="label mb-4 inline-block underline underline-offset-4" style={{ color: "var(--on-surface-soft)" }}>
        Products
      </Link>
      <PageHead
        title={piece?.name ?? "A new piece"}
        note={piece ? `On the site at /collection/${piece.slug}.` : "A made-to-order piece for the collection. It appears on the site as soon as it is saved."}
      />
      {typeof error === "string" && ERRORS[error] && (
        <p role="alert" className="mb-4 text-[13px]" style={{ color: "var(--accent)" }}>
          {ERRORS[error]}
        </p>
      )}

      <form action={savePiece.bind(null, piece?.slug ?? null)} className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Panel title="The piece">
          <div className="grid gap-4">
            <Field label="Name">
              <input name="name" defaultValue={piece?.name} required maxLength={60} {...input} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Garment">
                <select name="garment" defaultValue={piece?.garment ?? "kaftan"} {...input}>
                  {(Object.keys(GARMENT_LABEL) as Garment[]).map((g) => (
                    <option key={g} value={g}>
                      {GARMENT_LABEL[g]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Design code" hint="The file's name on the machine, exactly, like LD 115.">
                <input name="design" defaultValue={piece?.design} required maxLength={30} {...input} className={`${fieldClass} font-mono`} />
              </Field>
            </div>
            <Field label="About the design" hint="A few words, like “Gold chain border down the placket”.">
              <input name="designNote" defaultValue={piece?.designNote} maxLength={80} {...input} />
            </Field>
            <Field label="Description">
              <textarea name="detail" rows={4} defaultValue={piece?.detail} maxLength={400} {...input} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From price, naira">
                <input name="fromPrice" inputMode="numeric" defaultValue={piece?.fromPrice} required {...input} />
              </Field>
              <Field label="Days to make">
                <input name="leadDays" inputMode="numeric" defaultValue={piece?.leadDays ?? 14} required {...input} />
              </Field>
            </div>
            <label className="flex items-start gap-3">
              <input type="checkbox" name="hidden" defaultChecked={piece?.hidden} className="mt-[3px] h-4 w-4" />
              <span className="text-[14px] leading-snug">
                Hide from the site
                <span className="block text-[12px]" style={{ color: "var(--on-surface-soft)" }}>
                  Keeps it here to bring back later.
                </span>
              </span>
            </label>
          </div>
        </Panel>

        <div className="grid content-start gap-3">
          <Panel title="Photo">
            <PhotoField
              label="Shown on the home page, the collection and its own page"
              urlName="image"
              altName="alt"
              url={piece?.image ?? null}
              alt={piece?.alt ?? ""}
              required
            />
          </Panel>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton>{isNew ? "Add to the collection" : "Save"}</SubmitButton>
          </div>
        </div>
      </form>

      {piece && (
        <form action={deletePiece.bind(null, piece.slug)} className="mt-8 border-t pt-6" style={{ borderColor: "var(--line-dashed)" }}>
          <ConfirmButton message={`Delete ${piece.name} from the collection? This cannot be undone. To take it off the site for now, hide it instead.`}>
            Delete this piece
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
