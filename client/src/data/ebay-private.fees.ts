import type { SourceRef } from './types';

/**
 * eBay UK PRIVATE seller fees — separate from the Business schedule in
 * ebay.fees.ts, which is unchanged.
 *
 * Source: eBay UK "Selling fees" help page (id=4364), page dated
 * "Last updated 30 September 2026", read on 2026-10-21 via an automated
 * fetch in the EasyFeezy site build. Marked AUTOMATED_UNVERIFIED until a
 * person checks it line by line against the live page.
 *
 * What the page states for UK-based private sellers:
 * - Selling is free (no final value fee, no per-order fee, no regulatory
 *   operating fee), EXCLUDING motors/vehicles.
 * - 300 free listings a month (400 with an eBay Shop), then 35p per listing.
 * - International fee: 3% of the total sale when the buyer's delivery
 *   address is outside the UK.
 * - The page does not say whether VAT is added to the 35p or 3% fees.
 *
 * Not modelled: optional listing upgrades (subtitle, reserve price),
 * vehicles, and the Buyer Protection fee eBay charges BUYERS on private
 * sales (its current formula has not been confirmed from an official page).
 */
export const EBAY_PRIVATE_SOURCE: SourceRef = {
  platform: 'EBAY',
  sellerMarket: 'GB',
  feeType: 'private_seller_fees',
  formula: 'Free to sell for UK private sellers (excluding motors); 35p per listing after the free monthly allowance; 3% international fee',
  currency: 'GBP',
  conditions: 'UK-based private (non-business) sellers. Motors/vehicles excluded.',
  effectiveDate: null,
  url: 'https://www.ebay.co.uk/help/selling/fees-credits-invoices/selling-fees?id=4364',
  verifiedAt: '2026-10-21',
  verificationStatus: 'AUTOMATED_UNVERIFIED',
  notes: 'Official page dated "Last updated 30 September 2026". Read via automated fetch; awaiting a manual line-by-line check.',
};

export const EBAY_PRIVATE_FINAL_VALUE_FEE = 0;
export const EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH = 300;
export const EBAY_PRIVATE_INSERTION_FEE = 0.35;
export const EBAY_PRIVATE_INTERNATIONAL_FEE_RATE = 0.03;
