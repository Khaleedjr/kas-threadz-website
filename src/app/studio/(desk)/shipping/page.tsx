import { getContent } from "@/lib/content";
import { requireStudio } from "@/lib/studio-auth";
import { PageHead } from "../ui";
import { ShippingEditor } from "./shipping-editor";

export const metadata = { title: "Shipping" };

export default async function ShippingPage() {
  await requireStudio();
  const { shipping } = await getContent();
  return (
    <>
      <PageHead
        title="Shipping"
        note="Where the studio delivers, what each place costs and how long it takes, as customers see them at checkout. They started as the fees quote.voltcraft.org.ng charges."
      />
      <ShippingEditor initial={shipping} />
    </>
  );
}
