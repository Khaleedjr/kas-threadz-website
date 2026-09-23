import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { getCatalogue } from "@/lib/content";
import { CatalogueProvider } from "../loom/catalogue-context";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const catalogue = await getCatalogue();
  return (
    <div data-register="paper" className="ground-paper flex min-h-dvh flex-1 flex-col text-[var(--on-surface)]">
      <SiteNav />
      <main id="main" className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-[clamp(28px,5vw,56px)]">
        <p className="label" style={{ color: "var(--accent)" }}>
          The Loom
        </p>
        <h1 className="mb-[clamp(20px,3vw,32px)] mt-2 text-[clamp(26px,3.6vw,38px)]">Checkout.</h1>
        <CatalogueProvider value={catalogue}>
          <CheckoutForm />
        </CatalogueProvider>
      </main>
      <SiteFooter />
    </div>
  );
}
