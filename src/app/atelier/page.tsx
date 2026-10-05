import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { getCatalogue } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "How a KAS THREADZ piece is made in Abuja: talk it through, choose the fabric and design, we sew it, then you try it on.",
};

const PROCESS = [
  { n: "01", title: "Talk to us", body: "Tell us the occasion, show us pictures, set a budget. On WhatsApp or at our shop." },
  { n: "02", title: "Fabric & colour", body: "Pick from our five fabrics in any colour, or bring your own." },
  { n: "03", title: "Design & measurements", body: "Pick one of our designs, or we can turn your own idea into one." },
  { n: "04", title: "We make it", body: "Cut, embroidered, sewn and finished. We send you a photo at every step." },
  { n: "05", title: "Fitting & delivery", body: "Try it on at our shop in Abuja, or we deliver anywhere in Nigeria and abroad." },
];

export default async function AtelierPage() {
  const { photos } = await getCatalogue();
  return (
    <div data-register="cloth" className="ground-cloth flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />

      <div className="grid flex-1 md:grid-cols-2">
        <section id="main" className="px-8 py-12">
          <p className="label" style={{ color: "var(--accent)" }}>
            About Us · Abuja
          </p>
          <h1 className="mt-3 text-[clamp(28px,3.6vw,40px)]">
            Made by machine.
            <br />
            Finished by hand.
          </h1>
          <p className="mt-4 max-w-[48ch] text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
            Every piece starts as plain fabric and one of our designs. The embroidery
            machine sews the design. Everything after that is done by hand: the seams, the
            edges, the cord, the tassel and the ironing.
          </p>

          <ol className="mt-8">
            {PROCESS.map((step) => (
              <li key={step.n} className="flex gap-4 border-t border-[var(--line)] py-[13px]">
                <span className="min-w-[26px] font-mono text-[11px] text-[var(--color-thread-dim)]">
                  {step.n}
                </span>
                <div>
                  <h2 className="text-[13.5px] font-semibold">{step.title}</h2>
                  <p className="mt-[2px] text-[11.5px]" style={{ color: "var(--on-surface-soft)" }}>
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href="/loom"
            className="mt-8 inline-block rounded-sm px-6 py-[14px] text-[10.5px] font-medium uppercase tracking-[0.2em]"
            style={{ background: "var(--action)", color: "var(--on-action)" }}
          >
            Start your order
          </Link>
        </section>

        <section className="relative min-h-[340px]">
          <Image
            src={photos.atelier?.url ?? "/img/work/jallab-maroon.jpg"}
            alt={photos.atelier?.alt ?? "A maroon jallabiya with a cream embroidered neckline and a gold tassel"}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            style={{ objectPosition: "center 20%" }}
          />
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
