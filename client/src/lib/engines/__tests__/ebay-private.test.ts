import { describe, expect, it } from 'vitest';
import { calculateEbayPrivate, type EbayPrivateInput } from '../ebay-private';
import { calculateMarketplace } from '../../compare/adapters';

const base: EbayPrivateInput = {
  itemPrice: 30,
  itemCost: 10,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  buyerOutsideUk: false,
  paidInsertionFee: false,
};

describe('eBay UK private seller', () => {
  it('charges a UK private seller nothing on a UK sale', () => {
    const r = calculateEbayPrivate(base);
    expect(r.totalCashFees).toBe(0);
    expect(r.estimatedProfit).toBe(20);
    expect(r.confidence).toBe('EXACT_FOR_SELECTED_INPUTS');
  });

  it('still shows the £0 selling fee as a sourced line', () => {
    const line = calculateEbayPrivate(base).feeLines.find((l) => l.id === 'ebay-private-selling-fee');
    expect(line?.amountExVat).toBe(0);
    expect(line?.sourceUrl).toContain('ebay.co.uk');
    expect(line?.verificationStatus).toBe('AUDIT_VERIFIED');
  });

  it('adds 3% of the total sale, including postage, for a buyer outside the UK', () => {
    const r = calculateEbayPrivate({ ...base, shippingCharged: 5, buyerOutsideUk: true });
    expect(r.internationalFee).toBeCloseTo(1.05, 10); // 3% of £35
    expect(r.totalCashFees).toBeCloseTo(1.05, 10);
  });

  it('adds 35p once per listing past the free allowance, not per item', () => {
    const r = calculateEbayPrivate({ ...base, quantity: 3, paidInsertionFee: true });
    expect(r.listingFee).toBeCloseTo(0.35, 10);
  });

  it('treats the fees as already including VAT: nothing added on top, and the result is exact', () => {
    // eBay: "All fees displayed on this page are inclusive of VAT at 20%."
    const r = calculateEbayPrivate({ ...base, buyerOutsideUk: true, paidInsertionFee: true });
    expect(r.vatOnFees).toBe(0);
    expect(r.totalCashFees).toBeCloseTo(0.9 + 0.35, 10); // 3% of £30 + 35p
    expect(r.feeLines.filter((l) => l.amountExVat > 0).every((l) => l.vatInclusive)).toBe(true);
    expect(r.assumptions.join(' ')).toMatch(/include VAT/);
    expect(r.confidence).toBe('EXACT_FOR_SELECTED_INPUTS');
  });

  it('is reachable through the compare adapter, and Business stays the default', () => {
    const scenario = { soldPrice: 30, itemCost: 10, shippingCharged: 0, shippingCost: 0, quantity: 1, vatProfile: 'NOT_REGISTERED' as const };
    const ebay = { categoryId: 'EVERYTHING_ELSE', region: 'DOMESTIC' as const, currencyConversionSelected: false, topRatedPremiumService: false };
    expect(calculateMarketplace('EBAY', scenario, ebay).totalCashFees).toBeGreaterThan(0);
    expect(calculateMarketplace('EBAY', scenario, { ...ebay, sellerType: 'PRIVATE' }).totalCashFees).toBe(0);
  });

  it('rejects invalid inputs rather than guessing', () => {
    expect(() => calculateEbayPrivate({ ...base, quantity: 0 })).toThrow();
    expect(() => calculateEbayPrivate({ ...base, itemPrice: -1 })).toThrow();
  });
});
