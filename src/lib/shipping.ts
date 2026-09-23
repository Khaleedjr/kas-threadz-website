/*
 * Delivery: where the studio sends to and what it costs, or collecting from
 * the atelier. The zones and fees are the ones quote.voltcraft.org.ng
 * charges, copied in, since that site keeps them in its own code rather
 * than anywhere they can be read from. The studio changes them in its desk.
 * Plain data, for the server and the page alike.
 */

export type Zone = {
  id: string;
  label: string;
  /** in naira */
  fee: number;
  /** how long it takes, in words */
  eta: string;
  hidden?: boolean;
};

export type Shipping = {
  zones: Zone[];
  pickup: {
    /** whether customers may collect instead */
    on: boolean;
    label: string;
    note: string;
  };
  /** an order worth this much or more is delivered free; 0 never */
  freeFrom: number;
};

const eta = "2 to 5 business days";

export const DEFAULT_SHIPPING: Shipping = {
  zones: [
    { id: "abuja-jabi-zuba", label: "Abuja (Jabi/Zuba)", fee: 2000, eta },
    { id: "adamawa-yola", label: "Adamawa (Yola)", fee: 2000, eta },
    { id: "bauchi", label: "Bauchi", fee: 2000, eta },
    { id: "benue-makurdi", label: "Benue (Makurdi)", fee: 3000, eta },
    { id: "borno-maiduguri", label: "Borno (Maiduguri)", fee: 2000, eta },
    { id: "cross-river-calabar", label: "Cross River (Calabar)", fee: 4000, eta },
    { id: "gombe", label: "Gombe", fee: 2000, eta },
    { id: "jigawa-dutse", label: "Jigawa (Dutse)", fee: 3000, eta },
    { id: "kano-naibawa-kanoline", label: "Kano (Naibawa/Kanoline)", fee: 1500, eta },
    { id: "katsina", label: "Katsina", fee: 2000, eta },
    { id: "kebbi-birnin-kebbi", label: "Kebbi (Birnin Kebbi)", fee: 2000, eta },
    { id: "kogi-lokoja", label: "Kogi (Lokoja)", fee: 3000, eta },
    { id: "kwara-ilorin", label: "Kwara (Ilorin)", fee: 4000, eta },
    { id: "lagos-iddo-agege", label: "Lagos (Iddo/Agege)", fee: 4000, eta },
    { id: "nasarawa-keffi-lafia", label: "Nasarawa (Keffi/Lafia)", fee: 2000, eta },
    { id: "niger-minna", label: "Niger (Minna)", fee: 1500, eta },
    { id: "plateau-jos", label: "Plateau (Jos)", fee: 2000, eta },
    { id: "rivers-portharcourt", label: "Rivers (Port Harcourt)", fee: 4000, eta },
    { id: "sokoto", label: "Sokoto (Sokoto)", fee: 2000, eta },
    { id: "taraba-jalingo", label: "Taraba (Jalingo)", fee: 2000, eta },
    { id: "yobe-damaturu", label: "Yobe (Damaturu)", fee: 2000, eta },
    { id: "zamfara-gusau", label: "Zamfara (Gusau)", fee: 1500, eta },
    { id: "zaria", label: "Zaria", fee: 1500, eta },
  ],
  pickup: {
    on: true,
    label: "Collect from the atelier",
    note: "Collect from the studio in Abuja. We message you on WhatsApp as soon as it is ready.",
  },
  freeFrom: 100000,
};

export type DeliveryChoice = { method: "delivery"; zone: string } | { method: "pickup" };

/**
 * What delivery costs for an order: the zone's fee, nothing to collect, and
 * nothing for an order at or above the free delivery line. Null when the
 * choice is not one on offer.
 */
export function deliveryFor(
  s: Shipping,
  choice: DeliveryChoice,
  subtotal: number,
): { method: "delivery" | "pickup"; zone: string | null; label: string; eta: string; fee: number; free: boolean } | null {
  if (choice.method === "pickup") {
    if (!s.pickup.on) return null;
    return { method: "pickup", zone: null, label: s.pickup.label, eta: "When it is ready", fee: 0, free: false };
  }
  const zone = s.zones.find((z) => z.id === choice.zone && !z.hidden);
  if (!zone) return null;
  const free = s.freeFrom > 0 && subtotal >= s.freeFrom;
  return { method: "delivery", zone: zone.id, label: zone.label, eta: zone.eta, fee: free ? 0 : zone.fee, free };
}
