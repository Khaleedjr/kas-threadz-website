"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CONTENT_TAG, getContent, saveContent } from "@/lib/content";
import type { Catalogue, Colour, LoomFabric, ShopPiece } from "@/lib/content-defaults";
import { ORDER_STATUSES, preorderStore, type OrderStatus } from "@/lib/preorder-store";
import { requireStudio } from "@/lib/studio-auth";

/*
 * Every change the studio makes from its desk. Each one checks the sign-in
 * first: an action can be called directly, without the page that shows it.
 */

const str = (form: FormData, name: string, max = 400) => String(form.get(name) ?? "").trim().slice(0, max);
const int = (form: FormData, name: string) => {
  const n = Number(String(form.get(name) ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** After saving content: the site shows it from the next page load. */
async function publish(change: Partial<Catalogue>) {
  await saveContent(change);
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}

/* ---------------------------------------------------------------- orders */

export async function updateOrder(reference: string, form: FormData) {
  await requireStudio();
  const status = str(form, "status") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) throw new Error("Unknown status.");
  await preorderStore()?.annotate(reference, { status, note: str(form, "note", 2000) });
  revalidatePath("/studio", "layout");
  // the count on the Loom moves when an order is cancelled or restored
  revalidatePath("/loom");
  redirect(`/studio/orders/${encodeURIComponent(reference)}?saved=1`);
}

/* ------------------------------------------------------------- jallabiya */

export async function saveJallabiya(form: FormData) {
  await requireStudio();
  const current = await getContent();
  await publish({
    terms: {
      adult: { ...current.terms.adult, price: int(form, "adultPrice"), total: int(form, "adultSets") },
      children: { ...current.terms.children, price: int(form, "childrenPrice"), total: int(form, "childrenSets") },
    },
    preorder: { open: form.get("open") === "on", description: str(form, "description", 300) },
  });
  redirect("/studio/products/jallabiya?saved=1");
}

/* ------------------------------------------------------------ collection */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export async function savePiece(original: string | null, form: FormData) {
  await requireStudio();
  const { pieces } = await getContent();
  const name = str(form, "name", 60);
  const slug = original ?? slugOf(str(form, "slug", 60) || name);
  if (!name || !SLUG.test(slug)) redirect(`/studio/products/${original ?? "new"}?error=name`);
  // "new" and "jallabiya" are pages of the desk themselves
  if (!original && (pieces.some((p) => p.slug === slug) || slug === "new" || slug === "jallabiya")) {
    redirect("/studio/products/new?error=taken");
  }
  const image = str(form, "image", 500);
  if (!image) redirect(`/studio/products/${original ?? "new"}?error=photo`);

  const piece: ShopPiece = {
    slug,
    name,
    garment: (str(form, "garment") || "kaftan") as ShopPiece["garment"],
    design: str(form, "design", 30),
    designNote: str(form, "designNote", 80),
    detail: str(form, "detail", 400),
    fromPrice: int(form, "fromPrice"),
    leadDays: Math.max(1, int(form, "leadDays") || 14),
    image,
    alt: str(form, "alt", 200) || name,
    hidden: form.get("hidden") === "on",
  };
  const next = original ? pieces.map((p) => (p.slug === original ? piece : p)) : [...pieces, piece];
  await publish({ pieces: next });
  redirect("/studio/products?saved=1");
}

export async function deletePiece(slug: string) {
  await requireStudio();
  const { pieces } = await getContent();
  await publish({ pieces: pieces.filter((p) => p.slug !== slug) });
  redirect("/studio/products?deleted=1");
}

/** Move a piece up or down the collection's order. */
export async function movePiece(slug: string, by: -1 | 1) {
  await requireStudio();
  const pieces = [...(await getContent()).pieces];
  const i = pieces.findIndex((p) => p.slug === slug);
  const j = i + by;
  if (i < 0 || j < 0 || j >= pieces.length) return;
  [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  await publish({ pieces });
  revalidatePath("/studio/products");
}

/* ----------------------------------------------------------- loom options */

/** The colour and fabric lists come whole from the editor; they are checked again as they are saved. */
export async function saveColours(colours: Colour[]): Promise<{ ok: boolean; message: string }> {
  await requireStudio();
  if (!Array.isArray(colours) || !colours.some((c) => !c.hidden)) {
    return { ok: false, message: "Keep at least one colour on offer." };
  }
  await publish({ colours });
  return { ok: true, message: "Saved. The Loom shows it from the next page load." };
}

export async function saveFabrics(fabrics: LoomFabric[]): Promise<{ ok: boolean; message: string }> {
  await requireStudio();
  if (!Array.isArray(fabrics) || !fabrics.some((f) => !f.hidden)) {
    return { ok: false, message: "Keep at least one fabric on offer." };
  }
  // a new cloth takes a key from its name, never one already in use
  const used = new Set(fabrics.map((f) => f.id).filter(Boolean));
  const keyed = fabrics.map((f) => {
    if (f.id) return f;
    let id = slugOf(f.name) || "fabric";
    for (let n = 2; used.has(id); n++) id = `${slugOf(f.name) || "fabric"}-${n}`;
    used.add(id);
    return { ...f, id };
  });
  await publish({ fabrics: keyed });
  return { ok: true, message: "Saved. The Loom shows it from the next page load." };
}

/* ---------------------------------------------------------------- photos */

export async function savePhotos(form: FormData) {
  await requireStudio();
  const photo = (name: string) => {
    const url = str(form, `${name}Url`, 500);
    return url ? { url, alt: str(form, `${name}Alt`, 200) } : null;
  };
  await publish({ photos: { homeLoom: photo("homeLoom"), atelier: photo("atelier") } });
  redirect("/studio/photos?saved=1");
}
