import { describe, expect, it } from "vitest";
import type { SharedComparisonScenario } from "../../compare/adapters";
import { calculateMarketplace } from "../../compare/adapters";
import { findBreakEvenUnitPrice } from "../break-even";

const base: SharedComparisonScenario = {
  soldPrice: 30,
  itemCost: 10,
  shippingCharged: 0,
  shippingCost: 3,
  quantity: 1,
  vatProfile: "NOT_REGISTERED",
};

describe("break-even optimisation", () => {
  it("finds a Vinted break-even price through the engine", () => {
    const config = { sellerRoute: "PRIVATE" as const, visibilityServiceCost: null };
    const result = findBreakEvenUnitPrice("VINTED", base, config);
    expect(result).not.toBeNull();
    expect(result!.unitPrice).toBeCloseTo(13, 2);
    expect(result!.result.estimatedProfit).toBeGreaterThanOrEqual(0);

    const justBelow = calculateMarketplace("VINTED", { ...base, soldPrice: result!.unitPrice - 0.01 }, config);
    expect(justBelow.estimatedProfit).toBeLessThan(0);
  });

  it("respects fixed and percentage marketplace fees rather than using cost-only arithmetic", () => {
    const config = {
      currencyConversionSelected: false,
      offsiteAdsRate: null,
      vatIdSupplied: true,
      usdToGbpRate: 0.75,
    } as const;
    const result = findBreakEvenUnitPrice("ETSY", base, config);
    expect(result).not.toBeNull();
    expect(result!.unitPrice).toBeGreaterThan(base.itemCost + base.shippingCost);
    expect(result!.result.estimatedProfit).toBeGreaterThanOrEqual(0);
  });

  it("can expand beyond the current sale price when the current scenario loses money", () => {
    const expensive: SharedComparisonScenario = { ...base, soldPrice: 5, itemCost: 30, shippingCost: 8 };
    const result = findBreakEvenUnitPrice("VINTED", expensive, { sellerRoute: "PRIVATE", visibilityServiceCost: null });
    expect(result).not.toBeNull();
    expect(result!.unitPrice).toBeGreaterThan(5);
  });

  it("returns null when no break-even price is found within the configured ceiling", () => {
    const impossible: SharedComparisonScenario = { ...base, itemCost: 1000 };
    expect(findBreakEvenUnitPrice("VINTED", impossible, {
      sellerRoute: "PRIVATE",
      visibilityServiceCost: null,
    }, { maxUnitPrice: 100 })).toBeNull();
  });

  it("rejects malformed solver settings", () => {
    expect(() => findBreakEvenUnitPrice("VINTED", base, {
      sellerRoute: "PRIVATE",
      visibilityServiceCost: null,
    }, { tolerance: 0 })).toThrow();
  });
});
