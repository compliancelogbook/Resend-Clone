import {
  EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH,
  EBAY_PRIVATE_INSERTION_FEE,
  EBAY_PRIVATE_INTERNATIONAL_FEE_RATE,
  EBAY_PRIVATE_SOURCE,
} from '../../data/ebay-private.fees';
import { money, percentOf, toRawNumber, ZERO } from '../decimal';
import { formatPercent } from '../format';
import { worstConfidence } from '../confidence';
import type { CalculationResult, ConfidenceLevel, FeeLine } from '../types';
import { assertNonNegative, assertValidQuantity, buildResult, makeFeeLine } from './shared';

/** eBay UK private (non-business) seller. Kept separate from the Business engine in ebay.ts. */
export interface EbayPrivateInput {
  itemPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  /** Buyer's delivery address is outside the UK — adds eBay's 3% international fee. */
  buyerOutsideUk: boolean;
  /** This listing went past the free monthly listing allowance — adds the 35p insertion fee. */
  paidInsertionFee: boolean;
}

export function calculateEbayPrivate(input: EbayPrivateInput): CalculationResult {
  assertNonNegative('item price', input.itemPrice);
  assertNonNegative('item cost', input.itemCost);
  assertNonNegative('shipping charged', input.shippingCharged);
  assertNonNegative('shipping cost', input.shippingCost);
  assertValidQuantity(input.quantity);

  const totalSale = money(input.itemPrice).times(input.quantity).plus(input.shippingCharged);
  const cogs = money(input.itemCost).times(input.quantity);
  const shippingCost = money(input.shippingCost);

  const feeLines: FeeLine[] = [];
  const assumptions: string[] = [
    'Private seller: eBay charges UK private sellers no final value fee, order fee or regulatory fee (vehicles excluded).',
    "On private sales the buyer pays eBay's Buyer Protection fee. It doesn't come out of your money, and this calculator doesn't estimate it.",
    'For selling your own belongings only. If you trade as a business, eBay requires a business account and business fees apply.',
  ];
  const exclusionsBase = [
    "Optional listing upgrades (such as a £2 subtitle, reserve price, Gallery Plus or Promoted Listings), an eBay Shop subscription, and the dispute fee eBay charges only if you're found responsible for a chargeback.",
  ];
  const exclusions: string[] = [...exclusionsBase];
  const signals: ConfidenceLevel[] = [];

  // The £0 selling fee is shown as a real, sourced line so the claim itself is auditable.
  feeLines.push(
    makeFeeLine({
      id: 'ebay-private-selling-fee',
      label: 'eBay selling fee (private seller)',
      amount: ZERO,
      category: 'transaction',
      platform: 'EBAY',
      feeType: 'seller_platform_fee',
      formula: '£0 — no final value fee, order fee or regulatory fee for UK private sellers (motors excluded)',
      source: EBAY_PRIVATE_SOURCE,
    })
  );

  let listingFee = ZERO;
  if (input.paidInsertionFee) {
    listingFee = money(EBAY_PRIVATE_INSERTION_FEE);
    feeLines.push(
      makeFeeLine({
        id: 'ebay-private-insertion',
        label: `Listing fee (past ${EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH} free listings this month)`,
        amount: listingFee,
        category: 'listing',
        platform: 'EBAY',
        feeType: 'listing_fee',
        formula: `£${EBAY_PRIVATE_INSERTION_FEE.toFixed(2)} per listing after ${EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH} free listings a month`,
        source: EBAY_PRIVATE_SOURCE,
        // eBay: "All fees displayed on this page are inclusive of VAT at 20%." Nothing is added on top.
        vatInclusive: true,
      })
    );
  }

  let internationalFee = ZERO;
  if (input.buyerOutsideUk) {
    internationalFee = percentOf(totalSale, EBAY_PRIVATE_INTERNATIONAL_FEE_RATE);
    feeLines.push(
      makeFeeLine({
        id: 'ebay-private-international',
        label: `International fee (${formatPercent(EBAY_PRIVATE_INTERNATIONAL_FEE_RATE, 0)})`,
        amount: internationalFee,
        category: 'international',
        platform: 'EBAY',
        feeType: 'international_fee',
        formula: `${formatPercent(EBAY_PRIVATE_INTERNATIONAL_FEE_RATE, 0)} of the total sale (£${toRawNumber(totalSale).toFixed(2)}), buyer outside the UK`,
        source: EBAY_PRIVATE_SOURCE,
        vatInclusive: true,
      })
    );
  }

  if (input.paidInsertionFee || input.buyerOutsideUk) {
    assumptions.push("eBay's private seller fees already include VAT at 20%, so no VAT is added on top.");
  }

  return buildResult({
    grossRevenue: totalSale,
    cogs,
    shippingCost,
    listingFee,
    internationalFee,
    feeLines,
    assumptions,
    exclusions,
    confidence: worstConfidence(signals),
  });
}
