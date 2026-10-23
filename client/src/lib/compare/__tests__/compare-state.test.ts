import { describe, expect, it } from "vitest";
import { calculateMarketplace } from "../adapters";
import {
  compareHrefFromCalculator,
  defaultCompareState,
  linkedConfigs,
  matchTargetFor,
  missingRequirement,
  runMatch,
  runComparison,
  scenarioOf,
  stateFromSearch,
  stateToSearch,
  type CompareState,
} from "../compare-state";

function withCategories(): CompareState {
  const state = defaultCompareState();
  state.off = []; // these tests check every marketplace's maths, Vinted included
  state.configs.EBAY.categoryId = "EVERYTHING_ELSE";
  state.configs.TIKTOK.categoryId = "WOMENSWEAR_UNDERWEAR__ALL";
  return state;
}

describe("Vinted off by default", () => {
  it("leaves Vinted out of the default ranking and match prices", () => {
    const state = defaultCompareState();
    state.configs.EBAY.categoryId = "EVERYTHING_ELSE";
    state.configs.TIKTOK.categoryId = "WOMENSWEAR_UNDERWEAR__ALL";
    expect(runComparison(state).map((r) => r.platform)).not.toContain("VINTED");
    expect(runMatch(state, 15).map((r) => r.platform)).not.toContain("VINTED");
  });
  it("adds Vinted when the link asks for it or comes from the Vinted calculator", () => {
    expect(stateFromSearch("price=30&cost=10").off).toEqual(["VINTED"]);
    expect(stateFromSearch("price=30&cost=10&vinted=1").off).toEqual([]);
    expect(stateFromSearch("price=30&cost=10&from=VINTED").off).toEqual([]);
  });
  it("keeps the choice in shared links", () => {
    const state = defaultCompareState();
    state.off = [];
    expect(stateFromSearch(stateToSearch(state)).off).toEqual([]);
    expect(stateFromSearch(stateToSearch(defaultCompareState())).off).toEqual(["VINTED"]);
  });
});

describe("compare state", () => {
  it("ranks every marketplace by profit, highest first, using the real engines", () => {
    const rows = runComparison(withCategories());
    expect(rows.map((r) => r.platform)).toHaveLength(5);
    const profits = rows.map((r) => r.result!.estimatedProfit);
    expect([...profits].sort((a, b) => b - a)).toEqual(profits);

    // Each row matches the engine called directly.
    const state = withCategories();
    const shopify = rows.find((r) => r.platform === "SHOPIFY")!;
    expect(shopify.result!.estimatedProfit).toBe(
      calculateMarketplace("SHOPIFY", scenarioOf(state.sale), linkedConfigs(state).SHOPIFY).estimatedProfit,
    );
  });

  it("matches the calculator pages for the £30 / £10 example", () => {
    const rows = Object.fromEntries(runComparison(withCategories()).map((r) => [r.platform, r.result!.estimatedProfit]));
    expect(rows.SHOPIFY).toBeCloseTo(19.15, 2);
    expect(rows.EBAY).toBeCloseTo(14.75, 2);
    expect(rows.TIKTOK).toBeCloseTo(17.3, 2);
    expect(rows.VINTED).toBeCloseTo(20, 2);
  });

  it("seller type sets eBay and Vinted together", () => {
    const state = defaultCompareState();
    state.sale.sellerType = "PRIVATE";
    const linked = linkedConfigs(state);
    expect(linked.EBAY.sellerType).toBe("PRIVATE");
    expect(linked.VINTED.sellerRoute).toBe("PRIVATE");
    const ebay = runComparison(state).find((r) => r.platform === "EBAY")!;
    expect(ebay.result!.totalCashFees).toBe(0);

    state.sale.sellerType = "BUSINESS";
    expect(linkedConfigs(state).VINTED.sellerRoute).toBe("PRO");
  });

  it("only a VAT-registered seller can have given Etsy a VAT number", () => {
    const state = defaultCompareState();
    state.configs.ETSY.vatIdSupplied = true;
    expect(linkedConfigs(state).ETSY.vatIdSupplied).toBe(false);
    state.sale.vatProfile = "REGISTERED";
    expect(linkedConfigs(state).ETSY.vatIdSupplied).toBe(true);
  });

  it("round-trips through the URL", () => {
    const state: CompareState = defaultCompareState();
    state.sale = { soldPrice: 42.5, itemCost: 12, shippingCharged: 3.5, shippingCost: 2.9, quantity: 2, vatProfile: "REGISTERED", sellerType: "PRIVATE" };
    state.configs.EBAY = { ...state.configs.EBAY, categoryId: "MENS_TRAINERS", region: "US_CANADA", topRatedPremiumService: true };
    state.configs.SHOPIFY = { ...state.configs.SHOPIFY, plan: "GROW", processor: "THIRD_PARTY", thirdPartyProcessor: { rate: 0.029, fixed: 0.3 } };
    state.configs.TIKTOK = { ...state.configs.TIKTOK, categoryId: "BEAUTY_PERSONAL_CARE__ACCESSORIES", affiliateCommissionRate: 0.1, otherActualCosts: 1.2 };
    state.configs.ETSY = { ...state.configs.ETSY, offsiteAdsRate: 0.15, vatIdSupplied: true };
    state.configs.VINTED = { ...state.configs.VINTED, visibilityServiceCost: 1.95 };
    state.customised = ["SHOPIFY", "EBAY", "ETSY", "TIKTOK", "VINTED"];
    state.off = []; // Vinted settings were chosen, so Vinted is in the ranking
    state.from = "EBAY";
    state.mode = "MATCH";
    state.matchTarget = 19.15;

    const back = stateFromSearch(stateToSearch(state));
    expect(back).toEqual(state);
  });

  it("falls back to defaults for missing or invalid values, never a guess", () => {
    const s = stateFromSearch("?price=abc&cost=-5&qty=1.5&set=EBAY,NOPE&eb.cat=MADE_UP&eb.reg=MARS");
    const d = defaultCompareState();
    expect(s.sale.soldPrice).toBe(d.sale.soldPrice);
    expect(s.sale.itemCost).toBe(d.sale.itemCost);
    expect(s.sale.quantity).toBe(1);
    expect(s.customised).toEqual([]);
    expect(s.configs.EBAY).toEqual(d.configs.EBAY);
  });

  it("a calculator's link carries its exact settings, marked as the person's own", () => {
    const href = compareHrefFromCalculator(
      "EBAY",
      { soldPrice: 30, itemCost: 10, shippingCharged: 0, shippingCost: 0, quantity: 1, vatProfile: "NOT_REGISTERED" },
      { categoryId: "JEWELLERY", region: "DOMESTIC", currencyConversionSelected: false, topRatedPremiumService: false, sellerType: "PRIVATE" },
    );
    const s = stateFromSearch(href.split("?")[1]);
    expect(s.from).toBe("EBAY");
    expect(s.customised).toEqual(["EBAY"]);
    expect(s.sale.sellerType).toBe("PRIVATE");
    expect(s.configs.EBAY.categoryId).toBe("JEWELLERY");
  });

  it("never picks a category for the person: eBay and TikTok wait until one is chosen", () => {
    const state = defaultCompareState();
    expect(missingRequirement("EBAY", state)).toMatch(/category/);
    expect(missingRequirement("TIKTOK", state)).toMatch(/category/);

    const rows = runComparison(state);
    const ebay = rows.find((r) => r.platform === "EBAY")!;
    expect(ebay.result).toBeNull();
    expect(ebay.missing).toMatch(/category/);
    // Unranked rows sit below every calculated row.
    expect(rows.slice(-2).map((r) => r.platform).sort()).toEqual(["EBAY", "TIKTOK"]);

    // Private eBay sellers pay no category-based fee, so no category is needed.
    state.sale.sellerType = "PRIVATE";
    expect(missingRequirement("EBAY", state)).toBeNull();

    state.configs.TIKTOK.categoryId = "BEAUTY_PERSONAL_CARE__ACCESSORIES";
    expect(missingRequirement("TIKTOK", state)).toBeNull();
  });

  it("keeps other eBay settings from a link even before a category is chosen", () => {
    const s = stateFromSearch("?set=EBAY&eb.reg=US_CANADA&eb.tr=1");
    expect(s.customised).toEqual(["EBAY"]);
    expect(s.configs.EBAY.categoryId).toBe("");
    expect(s.configs.EBAY.region).toBe("US_CANADA");
    expect(missingRequirement("EBAY", s)).toMatch(/category/);
  });
  it("match mode finds the price each marketplace needs to keep the same amount, lowest first", () => {
    const state = withCategories();
    const target = matchTargetFor(state, runComparison(state));
    expect(target).toBe(20); // best-ranked (Vinted) keeps £20.00 at £30

    const rows = runMatch(state, 19.15);
    const prices = rows.map((r) => r.price!);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
    const byPlatform = Object.fromEntries(rows.map((r) => [r.platform, r]));
    expect(byPlatform.SHOPIFY.price).toBe(30); // Shopify keeps exactly £19.15 at £30
    expect(byPlatform.VINTED.price).toBe(29.15);
    for (const r of rows) expect(r.result!.estimatedProfit).toBeGreaterThanOrEqual(19.15 - 1e-6);
  });

  it("match mode uses the calculator you came from as the default target", () => {
    const state = withCategories();
    state.from = "SHOPIFY";
    expect(matchTargetFor(state, runComparison(state))).toBe(19.15);
    state.matchTarget = 25;
    expect(matchTargetFor(state, runComparison(state))).toBe(25);
  });

  it("match mode still waits for required categories", () => {
    const rows = runMatch(defaultCompareState(), 10);
    expect(rows.filter((r) => r.missing).map((r) => r.platform).sort()).toEqual(["EBAY", "TIKTOK"]);
  });
});

describe("compare to calculator links", () => {
  it("carries the sale and that marketplace's settings into its calculator", async () => {
    const { calculatorHref, readCalculatorLink } = await import("../compare-state");
    const state = defaultCompareState();
    state.sale = { soldPrice: 18, itemCost: 4, shippingCharged: 2.5, shippingCost: 3.1, quantity: 3, vatProfile: "REGISTERED", sellerType: "PRIVATE" };
    state.configs.EBAY = { ...state.configs.EBAY, region: "OTHER", privateInsertionFee: true };
    state.configs.SHOPIFY = { ...state.configs.SHOPIFY, plan: "ADVANCED", cardType: "INTERNATIONAL_AMEX", expectedMonthlyOrders: 250 };
    state.customised = ["EBAY", "SHOPIFY"];

    const ebay = readCalculatorLink(calculatorHref("EBAY", state).split("?")[1], "EBAY");
    expect(ebay.hasLink).toBe(true);
    expect(ebay.hasSettings).toBe(true);
    expect(ebay.sale).toEqual(state.sale);
    expect(ebay.config.sellerType).toBe("PRIVATE");
    expect(ebay.config.region).toBe("OTHER");
    expect(ebay.config.privateInsertionFee).toBe(true);

    const shopify = readCalculatorLink(calculatorHref("SHOPIFY", state).split("?")[1], "SHOPIFY");
    expect(shopify.config).toEqual(state.configs.SHOPIFY);
  });

  it("a calculator opened without a link keeps its own defaults", async () => {
    const { readCalculatorLink } = await import("../compare-state");
    expect(readCalculatorLink("", "VINTED").hasLink).toBe(false);
  });
});
