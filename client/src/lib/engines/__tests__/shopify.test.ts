import { describe, expect, it } from 'vitest';
import { calculateShopify, type ShopifyInput } from '../shopify';

const base: ShopifyInput = {
  soldPrice: 100,
  itemCost: 0,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  plan: 'BASIC',
  processor: 'SHOPIFY_PAYMENTS',
  cardType: 'STANDARD',
};

describe('Shopify acceptance tests', () => {
  it('S01: Basic, Shopify Payments, standard card, £30 -> £0.85', () => {
    const r = calculateShopify({ ...base, soldPrice: 30, plan: 'BASIC', cardType: 'STANDARD' });
    expect(r.paymentProcessingFee).toBeCloseTo(0.85, 6);
  });

  it('S02: Grow, standard card, £100 -> £1.95', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'GROW', cardType: 'STANDARD' });
    expect(r.paymentProcessingFee).toBeCloseTo(1.95, 6);
  });

  it('S03: Advanced, standard card, £100 -> £1.75', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'ADVANCED', cardType: 'STANDARD' });
    expect(r.paymentProcessingFee).toBeCloseTo(1.75, 6);
  });

  it('S04: Basic, international/Amex, £100 -> £3.35', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'BASIC', cardType: 'INTERNATIONAL_AMEX' });
    expect(r.paymentProcessingFee).toBeCloseTo(3.35, 6);
  });

  it('S05: Grow, international/Amex, £100 -> £2.95', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'GROW', cardType: 'INTERNATIONAL_AMEX' });
    expect(r.paymentProcessingFee).toBeCloseTo(2.95, 6);
  });

  it('S06: Advanced, international/Amex, £100 -> £2.75', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'ADVANCED', cardType: 'INTERNATIONAL_AMEX' });
    expect(r.paymentProcessingFee).toBeCloseTo(2.75, 6);
  });

  it('S07: Basic + third-party processor + £100, no processor rate -> Shopify fee £2.00, external excluded, EXCLUDES_VARIABLE_FEES', () => {
    const r = calculateShopify({ ...base, soldPrice: 100, plan: 'BASIC', processor: 'THIRD_PARTY' });
    expect(r.platformTransactionFee).toBeCloseTo(2.0, 6);
    expect(r.paymentProcessingFee).toBe(0);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });

  it('S08: Basic + third-party processor + £100 + 1.5%+£0.20 assumption -> Shopify £2.00, processor £1.70, total £3.70', () => {
    const r = calculateShopify({
      ...base,
      soldPrice: 100,
      plan: 'BASIC',
      processor: 'THIRD_PARTY',
      thirdPartyProcessor: { rate: 0.015, fixed: 0.2 },
    });
    expect(r.platformTransactionFee).toBeCloseTo(2.0, 6);
    expect(r.paymentProcessingFee).toBeCloseTo(1.7, 6);
    expect(r.platformTransactionFee + r.paymentProcessingFee).toBeCloseTo(3.7, 6);
    // 2026-08-16 audit correction: this was previously asserted as ASSUMPTION_DEPENDENT.
    // That understated the uncertainty — Shopify billing VAT is excluded from every
    // Shopify quote (see the confidence-precedence test in shared.test.ts), which
    // outranks a disclosed processor-rate assumption under the audit-mandated
    // "missing/applicable excluded fee > disclosed assumption" precedence rule.
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
  });

  it('S09: Basic £25/mo / 100 expected monthly orders -> £0.25/order allocated', () => {
    const r = calculateShopify({ ...base, expectedMonthlyOrders: 100 });
    expect(r.allocatedSubscriptionCost).toBeCloseTo(0.25, 6);
  });

  it('2026-08-16 audit: Shopify never reports EXACT_FOR_SELECTED_INPUTS, even on the happy path, because billing VAT is always excluded', () => {
    const r = calculateShopify(base);
    expect(r.confidence).toBe('EXCLUDES_VARIABLE_FEES');
    expect(r.exclusions.some((e) => e.includes('Shopify billing VAT'))).toBe(true);
  });

  it('PayPal is exempt from Shopify third-party fees only with Shopify Payments as primary provider', () => {
    const input = { ...base, soldPrice: 30, shippingCharged: 3.5, plan: 'GROW' as const };
    const exempt = calculateShopify({ ...input, processor: 'PAYPAL_WITH_SHOPIFY_PAYMENTS' });
    const charged = calculateShopify({ ...input, processor: 'PAYPAL_WITHOUT_SHOPIFY_PAYMENTS' });
    expect(exempt.platformTransactionFee).toBe(0);
    expect(charged.platformTransactionFee).toBeCloseTo(0.335, 6);
    expect(exempt.exclusions.some((note) => note.includes('External payment processor fee'))).toBe(true);
    expect(exempt.assumptions.some((note) => note.includes('primary payment provider'))).toBe(true);
  });

  it('PayPal processing estimates never eliminate a Shopify fee unless exemption is explicitly selected', () => {
    const input = { ...base, soldPrice: 30, shippingCharged: 3.5, plan: 'GROW' as const,
      thirdPartyProcessor: { rate: 0.03, fixed: 0.30 } };
    const exempt = calculateShopify({ ...input, processor: 'PAYPAL_WITH_SHOPIFY_PAYMENTS' });
    const charged = calculateShopify({ ...input, processor: 'PAYPAL_WITHOUT_SHOPIFY_PAYMENTS' });
    expect(exempt.paymentProcessingFee).toBeCloseTo(1.305, 6);
    expect(charged.paymentProcessingFee).toBeCloseTo(1.305, 6);
    expect(charged.platformTransactionFee).toBeCloseTo(0.335, 6);
    expect(exempt.platformTransactionFee).toBe(0);
  });

  it('rejects negative and non-integer/zero inputs at the engine boundary', () => {
    expect(() => calculateShopify({ ...base, soldPrice: -1 })).toThrow();
    expect(() => calculateShopify({ ...base, itemCost: -0.01 })).toThrow();
    expect(() => calculateShopify({ ...base, quantity: 0 })).toThrow();
    expect(() => calculateShopify({ ...base, quantity: -2 })).toThrow();
    expect(() => calculateShopify({ ...base, quantity: 1.5 })).toThrow();
  });
});
