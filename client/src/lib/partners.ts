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

/**
 * Cross-listing partner for sellers on two or more marketplaces.
 * Not chosen yet (see the shortlist in the plan doc). Empty url = hidden.
 */
export interface ListingPartner {
  name: string;
  url: string;
  headline: string;
  text: string;
  points: string[];
  /** Only if the partner's programme really offers it. */
  offer?: string;
}

export const LISTING_PARTNER: ListingPartner = {
  name: "LitCommerce", // chosen 24 Oct 2026; for product businesses
  url: "", // Add the LitCommerce affiliate link once approved.
  headline: "Selling on more than one marketplace?",
  text: "A cross-listing tool lists each product on all your marketplaces at once, and takes it down everywhere when it sells.",
  points: ["Create a listing once, post it everywhere", "Stock updates across marketplaces", "Fewer double sales"],
};

export const listingPartner = (): ListingPartner | null => (LISTING_PARTNER.url.trim() && LISTING_PARTNER.name ? LISTING_PARTNER : null);
