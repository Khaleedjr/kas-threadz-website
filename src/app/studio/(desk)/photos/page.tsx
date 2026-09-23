import Link from "next/link";
import { getContent } from "@/lib/content";
import { requireStudio } from "@/lib/studio-auth";
import { savePhotos } from "../actions";
import { PhotoField } from "../photo-field";
import { PageHead, Panel, Saved, SubmitButton } from "../ui";

export const metadata = { title: "Photos" };

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireStudio();
  const { saved } = await searchParams;
  const { photos } = await getContent();
  return (
    <>
      <PageHead title="Photos" note="The photographs on the site's pages. Leave one empty to keep the site's own." />
      <Saved show={saved === "1"} />
      <form action={savePhotos} className="grid gap-3">
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Home page">
            <PhotoField
              label="Beside “Build it before we cut it”"
              hint="A tall photograph works best."
              urlName="homeLoomUrl"
              altName="homeLoomAlt"
              url={photos.homeLoom?.url ?? null}
              alt={photos.homeLoom?.alt ?? ""}
            />
          </Panel>
          <Panel title="Atelier page">
            <PhotoField
              label="Beside the studio's story"
              urlName="atelierUrl"
              altName="atelierAlt"
              url={photos.atelier?.url ?? null}
              alt={photos.atelier?.alt ?? ""}
            />
          </Panel>
        </div>
        <div>
          <SubmitButton>Save</SubmitButton>
        </div>
      </form>
      <p className="mt-6 text-[13px]" style={{ color: "var(--on-surface-soft)" }}>
        Each collection piece&apos;s photo is on its own page under{" "}
        <Link href="/studio/products" className="underline underline-offset-4" style={{ color: "var(--accent)" }}>
          Products
        </Link>
        .
      </p>
    </>
  );
}
