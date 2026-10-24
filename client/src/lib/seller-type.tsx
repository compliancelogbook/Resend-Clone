/**
 * One wording for private and business sellers, used everywhere on the site.
 * Mirrors the marketplaces' own terms; HMRC's rules are summarised, never decided for anyone.
 */
import type { ReactNode } from "react";

export type SellerKind = "PRIVATE" | "BUSINESS";

export const SELLER_TYPE: Record<SellerKind, { title: string; detail: string }> = {
  PRIVATE: { title: "Private seller", detail: "Selling pre-owned items you no longer need" },
  BUSINESS: { title: "Business seller", detail: "Buying to resell, or making to sell, even part-time" },
};

/** What each marketplace calls a business seller, where it uses its own name. */
export const MARKETPLACE_BUSINESS_NAME: Partial<Record<string, string>> = {
  VINTED: "Vinted Pro",
};

export const HMRC_GUIDANCE_URL = "https://www.gov.uk/guidance/check-if-you-need-to-tell-hmrc-about-your-income-from-online-platforms";

/** The "Not sure which?" explanation, with an optional line about one marketplace. */
export function sellerTypeHelp(marketplaceNote?: ReactNode): ReactNode {
  return (
    <>
      <p><b>Private seller:</b> selling pre-owned items you no longer need. HMRC calls these personal possessions, and selling them usually isn't taxed.</p>
      <p><b>Business seller:</b> buying to resell, or making to sell, even part-time or as a hobby. HMRC is likely to see this as trading. You must tell HMRC if your trading income is over £1,000 in a tax year.</p>
      {marketplaceNote}
      <p>HMRC decides which applies to you, not us. <a href={HMRC_GUIDANCE_URL} target="_blank" rel="noopener noreferrer">Read HMRC's guidance</a></p>
    </>
  );
}
