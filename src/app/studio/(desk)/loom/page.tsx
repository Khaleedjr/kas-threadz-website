import Link from "next/link";
import { getContent } from "@/lib/content";
import { requireStudio } from "@/lib/studio-auth";
import { PageHead, Panel } from "../ui";
import { ColoursEditor, FabricsEditor } from "./list-editors";

export const metadata = { title: "Loom options" };

export default async function LoomOptionsPage() {
  await requireStudio();
  const cat = await getContent();
  return (
    <>
      <PageHead title="Loom options" note="The cloth colours and fabrics customers choose from in the Loom, in the order they are shown. Hide one to take it off the Loom without losing it." />
      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title={`Colours · ${cat.colours.filter((c) => !c.hidden).length} on offer`}>
          <ColoursEditor initial={cat.colours} />
        </Panel>
        <Panel title={`Fabrics · ${cat.fabrics.filter((f) => !f.hidden).length} on offer`}>
          <FabricsEditor initial={cat.fabrics} />
        </Panel>
      </div>
      <p className="mt-6 text-[13px] leading-relaxed" style={{ color: "var(--on-surface-soft)" }}>
        Prices and set counts are under{" "}
        <Link href="/studio/products/jallabiya" className="underline underline-offset-4" style={{ color: "var(--accent)" }}>
          Products
        </Link>
        . Neckline designs are processed for the stitching, so a new one is added by the developer.
      </p>
    </>
  );
}
