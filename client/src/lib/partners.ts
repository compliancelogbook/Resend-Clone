/**
 * Affiliate partner links. A card only appears once `url` is filled in.
 * Partners never affect calculations, rankings or Compare order: cards sit
 * beside results, are labelled "Ad", and link to the affiliate disclosure.
 */
import type { Platform } from "@/data/types";

export interface Partner {
  platform: Platform;
  /** The affiliate link from the partner programme. Empty = hidden. */
  url: string;
  title: string;
  text: string;
  cta: string;
}

export const PARTNERS: Partial<Record<Platform, Partner>> = {
  SHOPIFY: {
    platform: "SHOPIFY",
    url: "", // Add the Shopify Affiliate Program link once approved.
    title: "No Shopify store yet?",
    text: "Start a free trial and set up your shop. Shopify shows the current trial offer when you sign up.",
    cta: "Start a free trial",
  },
};

export function partnerFor(platform: Platform): Partner | null {
  const p = PARTNERS[platform];
  return p && p.url.trim() ? p : null;
}
