import { describe, expect, it } from "vitest";
import { calculateMarketplace, type SharedComparisonScenario } from "../../compare/adapters";
import { findTargetMarginUnitPrice } from "../target-margin";

const base: SharedComparisonScenario = {
  soldPrice: 30,
  itemCost: 10,
  shippingCharged: 0,
  shippingCost: 3,
  quantity: 1,
  vatProfile: "NOT_REGISTERED",
};

const vinted = { sellerRoute: "PRIVATE" as const, visibilityServiceCost: null };
const shopify = { plan: "BASIC" as const, processor: "SHOPIFY_PAYMENTS" as const, cardType: "STANDARD" as const };
const ebay = {
  categoryId: "EVERYTHING_ELSE",
  manualCategoryRate: null,
  region: "DOMESTIC" as const,
  currencyConversionSelected: false,
  topRatedPremiumService: false,
};

describe("target margin price", () => {
  it("finds the lowest price that reaches the target, through the engine", () => {
    const result = findTargetMarginUnitPrice("SHOPIFY", base, shopify, 30);
    expect(result).not.toBeNull();
    expect(result!.result.marginPct!).toBeGreaterThanOrEqual(30);

    const justBelow = calculateMarketplace("SHOPIFY", { ...base, soldPrice: result!.unitPrice - 0.01 }, shopify);
    expect(justBelow.marginPct!).toBeLessThan(30);
  });

  it("matches simple cost arithmetic when the marketplace charges no seller fees", () => {
    // Vinted private sellers pay no seller fee: margin = (p - 13) / p, so 35% needs p = 13 / 0.65 = 20.
    const result = findTargetMarginUnitPrice("VINTED", base, vinted, 35);
    expect(result!.unitPrice).toBeCloseTo(20, 2);
  });

  it("searches above the current price when the current sale is short of the target", () => {
    const result = findTargetMarginUnitPrice("EBAY", { ...base, soldPrice: 12 }, ebay, 40);
    expect(result).not.toBeNull();
    expect(result!.unitPrice).toBeGreaterThan(12);
    expect(result!.result.marginPct!).toBeGreaterThanOrEqual(40);
  });

  it("can find a price below the current one when the sale already beats the target", () => {
    const result = findTargetMarginUnitPrice("EBAY", { ...base, soldPrice: 100 }, ebay, 20);
    expect(result!.unitPrice).toBeLessThan(100);
  });

  it("returns null when percentage fees make the target impossible", () => {
    // eBay's 12.9% final value fee plus VAT means a 95% margin can never be reached.
    expect(findTargetMarginUnitPrice("EBAY", base, ebay, 95)).toBeNull();
  });

  it("rejects targets outside 0–100%", () => {
    expect(() => findTargetMarginUnitPrice("VINTED", base, vinted, 0)).toThrow();
    expect(() => findTargetMarginUnitPrice("VINTED", base, vinted, 100)).toThrow();
  });
});
