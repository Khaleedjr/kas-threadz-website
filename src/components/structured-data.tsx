import { PIECES, naira } from "@/lib/catalogue";
import { SITE } from "@/lib/site";

/**
 * Structured data for search.
 *
 * A bespoke studio lives or dies on being found locally, and Google will not
 * infer "tailor in Abuja, open Mon to Sat, reachable on WhatsApp" from prose.
 * This states it plainly.
 */
export function StudioSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    image: `${SITE.url}/img/work/agbada-maroon.jpg`,
    telephone: SITE.phoneDisplay,
    priceRange: "₦₦₦",
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE.city,
      addressCountry: SITE.country,
    },
    openingHours: SITE.openingHours,
    sameAs: [SITE.instagram],
    makesOffer: PIECES.map((piece) => ({
      "@type": "Offer",
      name: piece.name,
      description: `${piece.detail} Embroidered with ${piece.design}.`,
      url: `${SITE.url}/collection/${piece.slug}`,
      priceCurrency: SITE.currency,
      price: piece.fromPrice,
      availability: "https://schema.org/MadeToOrder",
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/** A single made-to-order piece. */
export function PieceSchema({ slug }: { slug: string }) {
  const piece = PIECES.find((p) => p.slug === slug);
  if (!piece) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: piece.name,
    description: `${piece.detail} Embroidered with ${piece.design}, ${piece.designNote.toLowerCase()}. Cut to measure in ${SITE.city}.`,
    image: `${SITE.url}${piece.image}`,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      priceCurrency: SITE.currency,
      price: piece.fromPrice,
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/MadeToOrder",
      url: `${SITE.url}/collection/${piece.slug}`,
      description: `From ${naira(piece.fromPrice)}. ${piece.leadDays} days, 50% deposit.`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
