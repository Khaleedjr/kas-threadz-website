/**
 * The studio's own details, in one place.
 *
 * Everything here is customer-facing and is repeated across metadata, the
 * footer, structured data and the WhatsApp handoff. Change it once.
 */

export const SITE = {
  name: "KAS THREADZ",
  /** Set this to the real domain once it exists. */
  url: "https://kasthreadz.com",
  description:
    "Kaftan, agbada, jallabiya and senator wear, machine-embroidered from the house design library and finished by hand at the Abuja atelier.",
  city: "Abuja",
  country: "NG",
  /** digits only, country code first, no spaces or plus sign */
  whatsapp: "2349121942684",
  phoneDisplay: "+234 912 194 2684",
  instagram: "https://www.instagram.com/kasthreadz",
  /** Mon to Sat, 09:00 to 19:00 WAT */
  openingHours: "Mo-Sa 09:00-19:00",
  currency: "NGN",
} as const;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${SITE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
