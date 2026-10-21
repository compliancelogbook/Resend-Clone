import { describe, expect, it } from "vitest";
import { calculateMarketplace, type SharedComparisonScenario } from "../../compare/adapters";
import { findBreakEvenUnitPrice } from "../break-even";
import { suggestTargetProfitPrice } from "../price-suggestions";
import { findTargetProfitUnitPrice } from "../target-profit";

const base: SharedComparisonScenario = { soldPrice: 30, itemCost: 10, shippingCharged: 0, shippingCost: 0, quantity: 1, vatProfile: "NOT_REGISTERED" };
const shopify = { plan: "BASIC" as const, processor: "SHOPIFY_PAYMENTS" as const, cardType: "STANDARD" as const };
const vinted = { sellerRoute: "PRIVATE" as const, visibilityServiceCost: null };
const ebay = { categoryId: "EVERYTHING_ELSE", region: "DOMESTIC" as const, currencyConversionSelected: false, topRatedPremiumService: false };

describe("target profit price", () => {
  it("with a £0 target it agrees with the break-even solver", () => {
    const a = findTargetProfitUnitPrice("EBAY", base, ebay, 0)!;
    const b = findBreakEvenUnitPrice("EBAY", base, ebay)!;
    expect(a.unitPrice).toBeCloseTo(b.unitPrice, 2);
  });

  it("matches simple arithmetic where there are no fees", () => {
    // Vinted private: profit = price − £10, so keeping £19.15 needs £29.15.
    expect(suggestTargetProfitPrice("VINTED", base, vinted, 19.15)!.price).toBe(29.15);
  });

  it("gives back the current price when it already keeps exactly the target", () => {
    // Shopify Basic at £30: 30 − 10 − (2% × 30 + 25p) = £19.15.
    expect(suggestTargetProfitPrice("SHOPIFY", base, shopify, 19.15)!.price).toBe(30);
  });

  it("never suggests a price that keeps less than the target", () => {
    const s = suggestTargetProfitPrice("EBAY", base, ebay, 19.15)!;
    expect(s.profit).toBeGreaterThanOrEqual(19.15 - 1e-6);
    const lower = calculateMarketplace("EBAY", { ...base, soldPrice: s.price - 0.01 }, ebay);
    expect(lower.estimatedProfit).toBeLessThan(19.15);
  });

  it("works for the whole order when there's more than one item", () => {
    const s = suggestTargetProfitPrice("VINTED", { ...base, quantity: 2 }, vinted, 30)!;
    expect(s.price).toBe(25); // 2 × £25 − 2 × £10 = £30
  });

  it("returns null when the target is out of reach below the price ceiling", () => {
    expect(findTargetProfitUnitPrice("VINTED", base, vinted, 1000, { maxUnitPrice: 100 })).toBeNull();
  });
});
