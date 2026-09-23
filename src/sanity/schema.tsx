/*
 * What the studio can edit, as Sanity lays it out: the Loom's colours and
 * fabrics, the preorder's prices and set counts, and the site's photographs.
 * Every field says in plain words what it changes on the site.
 */

import { defineArrayMember, defineField, defineType } from "sanity";
import { PIECES } from "@/lib/catalogue";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** A colour's own swatch, beside its name in the lists. */
function Swatch({ hex }: { hex?: string }) {
  return (
    <span
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: 999,
        background: hex && HEX.test(hex) ? hex : "transparent",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
      }}
    />
  );
}

const position = defineField({
  name: "position",
  title: "Position",
  type: "number",
  description: "Where it sits in the list on the Loom: 1 is first. Leave empty to sort by name.",
});

const available = defineField({
  name: "available",
  title: "Offered on the Loom",
  type: "boolean",
  initialValue: true,
  description: "Turn off to hide it from customers without deleting it.",
});

const colour = defineType({
  name: "colour",
  title: "Colour",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "hex",
      title: "Colour code",
      type: "string",
      description: "A hex code, a # and six characters, for example #22314e for navy.",
      validation: (r) => r.required().regex(HEX, { name: "hex code" }),
    }),
    available,
    position,
  ],
  preview: {
    select: { title: "name", subtitle: "hex", available: "available" },
    prepare: ({ title, subtitle, available }) => ({
      title,
      subtitle: available === false ? `${subtitle} · hidden` : subtitle,
      media: <Swatch hex={subtitle} />,
    }),
  },
});

const fabric = defineType({
  name: "fabric",
  title: "Fabric",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "key",
      title: "Key",
      type: "slug",
      description: "Filed on every order under this. Set it once and leave it: changing it breaks the link to past orders.",
      options: { source: "name" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "character",
      title: "One line about it",
      type: "string",
      description: "Shown under the fabric's name on the Loom.",
      validation: (r) => r.required().max(90),
    }),
    defineField({
      name: "finish",
      title: "How the preview draws it",
      type: "string",
      options: {
        list: [
          { title: "Matte, like cotton", value: "matte" },
          { title: "With a sheen, like silk", value: "sheen" },
        ],
        layout: "radio",
      },
      initialValue: "matte",
      validation: (r) => r.required(),
    }),
    available,
    position,
  ],
  preview: {
    select: { title: "name", subtitle: "character", available: "available" },
    prepare: ({ title, subtitle, available }) => ({
      title: available === false ? `${title} (hidden)` : title,
      subtitle,
    }),
  },
});

const price = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "number",
    description: "In naira, paid in full at checkout. Changes the price shown and the price charged.",
    validation: (r) => r.required().integer().min(100),
  });

const sets = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "number",
    description:
      "The whole run of this size, sold ones included. Lowering it below what is already sold closes this size.",
    validation: (r) => r.required().integer().min(0).max(10000),
  });

const preorderSettings = defineType({
  name: "preorderSettings",
  title: "Prices and sets",
  type: "document",
  fields: [
    price("adultPrice", "Adult price"),
    sets("adultSets", "Adult sets"),
    price("childrenPrice", "Children's price"),
    sets("childrenSets", "Children's sets"),
  ],
  preview: { prepare: () => ({ title: "Prices and sets" }) },
});

const photo = (name: string, title: string, description: string) =>
  defineField({
    name,
    title,
    type: "image",
    description: `${description} Leave empty to keep the current photograph.`,
    options: { hotspot: true },
    fields: [
      defineField({
        name: "alt",
        title: "What it shows",
        type: "string",
        description: "Read out to people who cannot see it, and to search engines.",
        validation: (r) => r.required(),
      }),
    ],
  });

const sitePhotos = defineType({
  name: "sitePhotos",
  title: "Photos",
  type: "document",
  fields: [
    photo("homeLoom", "Home page, beside the Loom", "The photograph next to “Build it before we cut it” on the home page."),
    photo("atelier", "Atelier page", "The photograph on the atelier page."),
    defineField({
      name: "pieces",
      title: "Collection pieces",
      type: "array",
      description: "A new photograph for a piece in the collection. Add one per piece you want to change.",
      of: [
        defineArrayMember({
          type: "object",
          name: "piecePhoto",
          fields: [
            defineField({
              name: "piece",
              title: "Piece",
              type: "string",
              options: { list: PIECES.map((p) => ({ title: `${p.name} · ${p.design}`, value: p.slug })) },
              validation: (r) => r.required(),
            }),
            photo("photo", "Photograph", "Shown on the home page, the collection and the piece's own page."),
          ],
          preview: {
            select: { slug: "piece", media: "photo" },
            prepare: ({ slug, media }) => ({
              title: PIECES.find((p) => p.slug === slug)?.name ?? "Choose a piece",
              media,
            }),
          },
        }),
      ],
      validation: (r) =>
        r.custom((items?: Array<{ piece?: string }>) => {
          const seen = new Set<string>();
          for (const i of items ?? []) {
            if (i.piece && seen.has(i.piece)) return "Each piece can only have one photograph here.";
            if (i.piece) seen.add(i.piece);
          }
          return true;
        }),
    }),
  ],
  preview: { prepare: () => ({ title: "Photos" }) },
});

export const schemaTypes = [colour, fabric, preorderSettings, sitePhotos];

/** Documents there is only ever one of, edited in place rather than listed. */
export const SINGLETONS = ["preorderSettings", "sitePhotos"];
