import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "The Atelier",
  description:
    "How a KAS THREADZ piece is made in Abuja: consultation, cloth, digitised design, the make, and the final fitting.",
};

const PROCESS = [
  { n: "01", title: "Consultation", body: "Occasion, references, budget. On WhatsApp or in the studio." },
  { n: "02", title: "Fabric & colour", body: "Five house materials, any colour. Or bring your own cloth." },
  { n: "03", title: "Design & measurements", body: "A file from the library, or a custom digitisation of your own motif." },
  { n: "04", title: "The make", body: "Cut, embroidered, sewn, finished. A photo lands at every stage." },
  { n: "05", title: "Fitting & delivery", body: "Fittings in the Abuja studio. Nationwide and diaspora by courier." },
];

export default function AtelierPage() {
  return (
    <div data-register="cloth" className="ground-cloth flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />

      <div className="grid flex-1 md:grid-cols-2">
        <section id="main" className="px-8 py-12">
          <p className="label" style={{ color: "var(--accent)" }}>
            The Atelier · Abuja
          </p>
          <h1 className="mt-3 text-[clamp(28px,3.6vw,40px)]">
            Machine precision.
            <br />
            Hand finish.
          </h1>
          <p className="mt-4 max-w-[48ch] text-[14px] leading-[1.72]" style={{ color: "var(--on-surface-soft)" }}>
            Every piece begins as cloth on the cutting table and a file in the library. The
            embroidery head runs the code. Everything after that is hands: seams, facing, cord,
            tassel, press.
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
            Start a commission
          </Link>
        </section>

        <section className="relative min-h-[340px]">
          <Image
            src="/img/work/kaftan-cream-detail.jpg"
            alt="Close view of cocoa cross-stitch embroidery on a cream kaftan placket"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            style={{ objectPosition: "center 30%" }}
          />
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
