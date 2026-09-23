import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { Loom } from "./loom";

export const metadata: Metadata = {
  title: "The Loom",
  description:
    "Preorder the jallabiya: choose the cloth, colour, neckline embroidery and size, and pay in full. The first run is 100 sets, adult and children's.",
};

/** Whether the request comes from a phone, so the Loom opens on the phone's default from the first paint. */
async function fromPhone() {
  const h = await headers();
  return h.get("sec-ch-ua-mobile") === "?1" || /Mobi|Android|iPhone/i.test(h.get("user-agent") ?? "");
}

export default async function LoomPage() {
  const phone = await fromPhone();
  return (
    <div data-register="paper" className="ground-paper flex-1 flex flex-col text-[var(--on-surface)]">
      <SiteNav />
      <Loom phone={phone} />
      <SiteFooter />
    </div>
  );
}
