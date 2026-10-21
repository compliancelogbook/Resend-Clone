import { describe, expect, it } from "vitest";
import { calculateMarketplace, type SharedComparisonScenario } from "../../compare/adapters";
import { suggestBreakEvenPrice, suggestTargetMarginPrice } from "../price-suggestions";

const base: SharedComparisonScenario = {
  soldPrice: 30,
  itemCost: 10,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  vatProfile: "NOT_REGISTERED",
};
const ebayPrivate = {
  categoryId: "EVERYTHING_ELSE",
  region: "DOMESTIC" as const,
  currencyConversionSelected: false,
  topRatedPremiumService: false,
  sellerType: "PRIVATE" as const,
};
const shopify = { plan: "BASIC" as const, processor: "SHOPIFY_PAYMENTS" as const, cardType: "STANDARD" as const };

describe("price suggestions", () => {
  it("typing the margin shown on screen gives back the current price", () => {
    // £30 with £10 cost and no fees is 66.666…%, shown as 66.7%.
    expect(suggestTargetMarginPrice("EBAY", base, ebayPrivate, 66.7, 1)!.price).toBe(30);
    expect(suggestTargetMarginPrice("EBAY", base, ebayPrivate, 66.67, 2)!.price).toBe(30);
  });

  it("never suggests a price that falls short of the target", () => {
    const s = suggestTargetMarginPrice("SHOPIFY", base, shopify, 30, 0)!;
    // £15.07 gives 29.98% — short of 30% — so the answer is £15.08.
    expect(s.price).toBe(15.08);
    expect(s.marginPct).toBeGreaterThanOrEqual(30);
    const lower = calculateMarketplace("SHOPIFY", { ...base, soldPrice: s.price - 0.01 }, shopify);
    expect(lower.marginPct!).toBeLessThan(30);
  });

  it("asks for a higher price when the target is above the current margin", () => {
    const s = suggestTargetMarginPrice("EBAY", base, ebayPrivate, 66.8, 1)!;
    expect(s.price).toBeGreaterThan(30);
    expect(s.marginPct).toBeGreaterThanOrEqual(66.8);
  });

  it("returns null when the target margin can't be reached", () => {
    const ebayBusiness = { ...ebayPrivate, sellerType: "BUSINESS" as const };
    expect(suggestTargetMarginPrice("EBAY", base, ebayBusiness, 95)).toBeNull();
  });

  it("break-even is the lowest whole-penny price with no loss", () => {
    // Shopify Basic, UK card: p − 10 − (2% × p + 25p) ≥ 0  →  p ≥ 10.459…
    expect(suggestBreakEvenPrice("SHOPIFY", base, shopify)).toBe(10.46);
    expect(suggestBreakEvenPrice("EBAY", base, ebayPrivate)).toBe(10);
  });
});
