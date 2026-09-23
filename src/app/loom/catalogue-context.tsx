"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_CATALOGUE, type Catalogue } from "@/lib/content-defaults";

/* The editable content, read once on the server for the page and handed to
   every part of the Loom that offers or prices something. */
const CatalogueContext = createContext<Catalogue>(DEFAULT_CATALOGUE);

export function CatalogueProvider({ value, children }: { value: Catalogue; children: ReactNode }) {
  return <CatalogueContext value={value}>{children}</CatalogueContext>;
}

export const useCatalogue = () => useContext(CatalogueContext);
