import type { SourceRef } from './types';

/**
 * eBay UK PRIVATE seller fees — separate from the Business schedule in
 * ebay.fees.ts, which is unchanged.
 *
 * Source: eBay UK "Selling fees" help page (id=4364), page dated
 * "Last updated 30 September 2026", read on 2026-10-21 via an automated
 * fetch, then checked line by line by the site owner against full-page
 * screenshots of the live page on 2026-10-21 (AUDIT_VERIFIED).
 *
 * What the page states for UK-based private sellers:
 * - Selling is free (no final value fee, no per-order fee, no regulatory
 *   operating fee), EXCLUDING motors/vehicles.
 * - 300 free listings a month (400 with an eBay Shop), then 35p per listing.
 *   Multi-quantity listings pay one listing fee, not one per item.
 * - International fee: 3% of the total sale (item price, handling, postage
 *   and any taxes) when the buyer's delivery address is outside the UK.
 * - "All fees displayed on this page are inclusive of VAT at 20%." So the
 *   35p and 3% figures are VAT-inclusive; no VAT is added on top.
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
  verificationStatus: 'AUDIT_VERIFIED',
  notes: 'Official page dated "Last updated 30 September 2026". Checked line by line against full-page screenshots of the live page on 2026-10-21.',
};

export const EBAY_PRIVATE_FINAL_VALUE_FEE = 0;
export const EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH = 300;
export const EBAY_PRIVATE_INSERTION_FEE = 0.35;
export const EBAY_PRIVATE_INTERNATIONAL_FEE_RATE = 0.03;
