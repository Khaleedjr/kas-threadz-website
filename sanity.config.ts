"use client";

/*
 * The studio's content editor, Sanity Studio, served by the site itself at
 * /studio/content. Signing in is Sanity's own: only people invited to the
 * project can change anything.
 */

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { apiVersion, dataset, projectId } from "./src/sanity/env";
import { SINGLETONS, schemaTypes } from "./src/sanity/schema";

export default defineConfig({
  name: "kas-threadz",
  title: "KAS THREADZ",
  basePath: "/studio/content",
  projectId: projectId || "unset",
  dataset,
  apiVersion,
  schema: {
    types: schemaTypes,
    // one set of prices, one set of photos: never a second copy
    templates: (templates) => templates.filter((t) => !SINGLETONS.includes(t.schemaType)),
  },
  document: {
    actions: (actions, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? actions.filter((a) => a.action && ["publish", "discardChanges", "restore"].includes(a.action))
        : actions,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("The site")
          .items([
            S.listItem()
              .title("Prices and sets")
              .id("preorderSettings")
              .child(S.document().schemaType("preorderSettings").documentId("preorderSettings")),
            S.documentTypeListItem("colour").title("Colours"),
            S.documentTypeListItem("fabric").title("Fabrics"),
            S.listItem()
              .title("Photos")
              .id("sitePhotos")
              .child(S.document().schemaType("sitePhotos").documentId("sitePhotos")),
          ]),
    }),
  ],
});
