/**
 * Compare page state: one shared sale, plus each marketplace's own settings.
 * Knows the defaults, the links between shared answers and marketplace settings
 * (seller type, VAT), and how to read and write the whole thing as a URL.
 * All fee maths still runs through calculateMarketplace and the verified engines.
 */
import { EBAY_CATEGORIES, type EbayInternationalRegion } from "../../data/ebay.fees";
import { DEFAULT_USD_TO_GBP_RATE, type EtsyOffsiteAdsRate } from "../../data/etsy.fees";
import { SHOPIFY_PLANS, type ShopifyPaymentProcessor, type ShopifyPlan } from "../../data/shopify.fees";
import { TIKTOK_CATEGORIES } from "../../data/tiktok.fees";
import { UNSUPPORTED_CATEGORY_ID, type Platform } from "../../data/types";
import type { VatProfile } from "../../data/vat";
import type { ShopifyCardType } from "../engines/shopify";
import type { CalculationResult } from "../types";
import { calculateMarketplace, type MarketplaceConfigMap, type SharedComparisonScenario } from "./adapters";
import { suggestTargetProfitPrice } from "../optimise/price-suggestions";

export type ComparePlatform = Exclude<Platform, "AMAZON">;
export const COMPARE_PLATFORMS: ComparePlatform[] = ["SHOPIFY", "EBAY", "ETSY", "TIKTOK", "VINTED"];
export const PLATFORM_LABELS: Record<ComparePlatform, string> = {
  SHOPIFY: "Shopify",
  EBAY: "eBay",
  ETSY: "Etsy",
  TIKTOK: "TikTok Shop",
  VINTED: "Vinted",
};
export const CALCULATOR_PATHS: Record<ComparePlatform, string> = {
  SHOPIFY: "/shopify-fee-calculator",
  EBAY: "/ebay-fee-calculator",
  ETSY: "/etsy-fee-calculator",
  TIKTOK: "/tiktok-shop-fee-calculator",
  VINTED: "/vinted-fee-calculator",
};

export type SellerType = "PRIVATE" | "BUSINESS";

export interface CompareSale {
  soldPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  vatProfile: VatProfile;
  sellerType: SellerType;
}

export type CompareConfigs = { [P in ComparePlatform]: MarketplaceConfigMap[P] };

export interface CompareState {
  sale: CompareSale;
  configs: CompareConfigs;
  /** Marketplaces whose settings came from the person (or their calculator), not our defaults. */
  customised: ComparePlatform[];
  /** The calculator the person came from, if any. */
  from: ComparePlatform | null;
  /** KEEP: what you keep at your price. MATCH: the price each marketplace needs for you to keep a set amount. */
  mode: "KEEP" | "MATCH";
  /** MATCH mode target profit for the whole order. Null = use the reference marketplace's profit. */
  matchTarget: number | null;
}

export const DEFAULT_SALE: CompareSale = {
  soldPrice: 30,
  itemCost: 10,
  shippingCharged: 0,
  shippingCost: 0,
  quantity: 1,
  vatProfile: "NOT_REGISTERED",
  sellerType: "BUSINESS",
};

export function defaultConfigs(): CompareConfigs {
  return {
    SHOPIFY: { plan: "BASIC", processor: "SHOPIFY_PAYMENTS", cardType: "STANDARD", thirdPartyProcessor: null, expectedMonthlyOrders: null },
    EBAY: { categoryId: "", manualCategoryRate: null, region: "DOMESTIC", currencyConversionSelected: false, topRatedPremiumService: false, sellerType: "BUSINESS", privateInsertionFee: false },
    ETSY: { currencyConversionSelected: false, offsiteAdsRate: null, vatIdSupplied: false, usdToGbpRate: DEFAULT_USD_TO_GBP_RATE },
    TIKTOK: { sellerDiscount: 0, platformDiscount: 0, categoryId: "", manualCategoryRate: null, promotionalRate: null, affiliateCommissionRate: null, otherActualCosts: 0 },
    VINTED: { sellerRoute: "PRIVATE", visibilityServiceCost: null },
  };
}

export function defaultCompareState(): CompareState {
  return { sale: { ...DEFAULT_SALE }, configs: defaultConfigs(), customised: [], from: null, mode: "KEEP", matchTarget: null };
}

/**
 * Applies the shared answers to each marketplace's settings, so they can never disagree:
 * seller type sets eBay's account type and Vinted's route; only a VAT-registered seller
 * can have given Etsy a VAT number.
 */
export function linkedConfigs(state: CompareState): CompareConfigs {
  const { sale, configs } = state;
  return {
    ...configs,
    EBAY: { ...configs.EBAY, sellerType: sale.sellerType },
    VINTED: { ...configs.VINTED, sellerRoute: sale.sellerType === "PRIVATE" ? "PRIVATE" : "PRO" },
    ETSY: { ...configs.ETSY, vatIdSupplied: sale.vatProfile === "REGISTERED" && configs.ETSY.vatIdSupplied },
  };
}

export function scenarioOf(sale: CompareSale): SharedComparisonScenario {
  return {
    soldPrice: sale.soldPrice,
    itemCost: sale.itemCost,
    shippingCharged: sale.shippingCharged,
    shippingCost: sale.shippingCost,
    quantity: sale.quantity,
    vatProfile: sale.vatProfile,
  };
}

export interface CompareRow {
  platform: ComparePlatform;
  result: CalculationResult | null;
  error: string | null;
  /** A required choice the person hasn't made yet — the row isn't calculated or ranked until they do. */
  missing: string | null;
}

/** Choices we never make for the person, because a wrong guess changes the answer a lot. */
export function missingRequirement(platform: ComparePlatform, state: CompareState): string | null {
  if (platform === "EBAY" && state.sale.sellerType === "BUSINESS" && !state.configs.EBAY.categoryId) return "Choose a category: eBay's fee depends on it.";
  if (platform === "TIKTOK" && !state.configs.TIKTOK.categoryId) return "Choose a category: TikTok Shop charges 5% or 9%.";
  return null;
}

/** Runs every marketplace through the verified engines and ranks them by profit (highest first). */
export function runComparison(state: CompareState): CompareRow[] {
  const configs = linkedConfigs(state);
  const scenario = scenarioOf(state.sale);
  const rows = COMPARE_PLATFORMS.map((platform): CompareRow => {
    const missing = missingRequirement(platform, state);
    if (missing) return { platform, result: null, error: null, missing };
    try {
      return { platform, result: calculateMarketplace(platform, scenario, configs[platform] as never), error: null, missing: null };
    } catch (e) {
      return { platform, result: null, error: e instanceof Error ? e.message : "Couldn't calculate this marketplace.", missing: null };
    }
  });
  return rows.sort((a, b) => {
    if (!a.result) return 1;
    if (!b.result) return -1;
    return b.result.estimatedProfit - a.result.estimatedProfit;
  });
}

/* ---------- Match my profit ---------- */

export interface MatchRow extends CompareRow {
  /** Lowest whole-penny unit price that keeps at least the target on this marketplace. */
  price: number | null;
}

/**
 * The marketplace whose profit is the default target: the calculator the person came
 * from if it could be calculated, otherwise the best-ranked marketplace.
 */
export function matchReference(state: CompareState, rows: CompareRow[]): CompareRow | null {
  const calculated = rows.filter((r) => r.result);
  return (state.from && calculated.find((r) => r.platform === state.from)) || calculated[0] || null;
}

export function matchTargetFor(state: CompareState, rows: CompareRow[]): number {
  if (state.matchTarget !== null) return state.matchTarget;
  const ref = matchReference(state, rows);
  return ref?.result ? Math.round(ref.result.estimatedProfit * 100) / 100 : 0;
}

/** For each marketplace, the price you'd need to list at to keep `target` on this order. Lowest price first. */
export function runMatch(state: CompareState, target: number): MatchRow[] {
  const configs = linkedConfigs(state);
  const scenario = scenarioOf(state.sale);
  const rows = COMPARE_PLATFORMS.map((platform): MatchRow => {
    const missing = missingRequirement(platform, state);
    if (missing) return { platform, result: null, error: null, missing, price: null };
    try {
      const found = suggestTargetProfitPrice(platform, scenario, configs[platform] as never, target);
      if (!found) return { platform, result: null, error: "Can't reach this amount at any sensible price.", missing: null, price: null };
      const result = calculateMarketplace(platform, { ...scenario, soldPrice: found.price }, configs[platform] as never);
      return { platform, result, error: null, missing: null, price: found.price };
    } catch (e) {
      return { platform, result: null, error: e instanceof Error ? e.message : "Couldn't calculate this marketplace.", missing: null, price: null };
    }
  });
  return rows.sort((a, b) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });
}

/* ---------- Plain-English summaries and checks ---------- */

const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;

const EBAY_REGION_NAMES: Record<EbayInternationalRegion, string> = {
  DOMESTIC: "UK buyer",
  EU_NORTHERN_EUROPE: "Europe buyer",
  US_CANADA: "US/Canada buyer",
  OTHER: "Rest of world buyer",
};

export function settingsSummary(platform: ComparePlatform, state: CompareState): string {
  const c = linkedConfigs(state);
  switch (platform) {
    case "SHOPIFY": {
      const s = c.SHOPIFY;
      const pay =
        s.processor === "SHOPIFY_PAYMENTS" ? `Shopify Payments, ${s.cardType === "STANDARD" ? "UK card" : "international card"}` : s.processor === "THIRD_PARTY" ? "Another provider" : "PayPal";
      return `${SHOPIFY_PLANS[s.plan].label} plan · ${pay}`;
    }
    case "EBAY": {
      const s = c.EBAY;
      if (s.sellerType === "PRIVATE") return `Private seller · ${s.region === "DOMESTIC" ? "UK buyer" : "Buyer outside the UK"}`;
      if (!s.categoryId) return `Business · Category not chosen · ${EBAY_REGION_NAMES[s.region]}`;
      const cat = EBAY_CATEGORIES.find((x) => x.id === s.categoryId);
      const name = cat ? `${cat.label}${cat.schedule ? ` (${cat.source.formula})` : ""}` : "Other category";
      return `Business · ${name} · ${EBAY_REGION_NAMES[s.region]}`;
    }
    case "ETSY": {
      const s = c.ETSY;
      return `${s.offsiteAdsRate ? `Offsite Ads ${pct(s.offsiteAdsRate)}` : "No Offsite Ads"} · ${s.vatIdSupplied ? "VAT number given" : "VAT added to fees"}`;
    }
    case "TIKTOK": {
      const s = c.TIKTOK;
      if (!s.categoryId) return "Category not chosen";
      const cat = TIKTOK_CATEGORIES.find((x) => x.id === s.categoryId);
      const name = cat ? (cat.subcategory === "All" ? cat.category : cat.subcategoryDisplay ?? cat.subcategory) : "Other category";
      const rate = s.promotionalRate ?? cat?.rate ?? s.manualCategoryRate;
      return `${name}${rate ? ` · ${pct(rate)} commission` : ""}${s.affiliateCommissionRate ? ` · creator ${pct(s.affiliateCommissionRate)}` : ""}`;
    }
    case "VINTED": {
      const s = c.VINTED;
      return `${s.sellerRoute === "PRIVATE" ? "Private seller" : "Pro seller"} · ${s.visibilityServiceCost ? "Bump/Showcase paid" : "No Bump"}`;
    }
  }
}


/* ---------- URL: read and write the whole comparison ---------- */

const num = (v: string | null, ok: (n: number) => boolean): number | undefined => {
  if (v === null || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && ok(n) ? n : undefined;
};
const nonNeg = (n: number) => n >= 0;
const rate01 = (n: number) => n > 0 && n <= 1;
const bool = (v: string | null) => v === "1";
const oneOf = <T extends string>(v: string | null, allowed: readonly T[]): T | undefined => (allowed.includes(v as T) ? (v as T) : undefined);

export function stateToSearch(state: CompareState): string {
  const p = new URLSearchParams();
  const { sale, configs } = state;
  p.set("price", String(sale.soldPrice));
  p.set("cost", String(sale.itemCost));
  if (sale.shippingCharged) p.set("dc", String(sale.shippingCharged));
  if (sale.shippingCost) p.set("dp", String(sale.shippingCost));
  if (sale.quantity !== 1) p.set("qty", String(sale.quantity));
  p.set("vat", sale.vatProfile === "REGISTERED" ? "R" : "N");
  p.set("seller", sale.sellerType === "PRIVATE" ? "P" : "B");
  if (state.from) p.set("from", state.from);
  if (state.mode === "MATCH") p.set("mode", "match");
  if (state.matchTarget !== null) p.set("target", String(state.matchTarget));
  if (state.customised.length) p.set("set", state.customised.join(","));

  for (const platform of state.customised) {
    switch (platform) {
      case "SHOPIFY": {
        const s = configs.SHOPIFY;
        p.set("sh.plan", s.plan);
        p.set("sh.pay", s.processor);
        p.set("sh.card", s.cardType);
        if (s.thirdPartyProcessor) {
          p.set("sh.r", String(s.thirdPartyProcessor.rate));
          p.set("sh.f", String(s.thirdPartyProcessor.fixed));
        }
        if (s.expectedMonthlyOrders) p.set("sh.mo", String(s.expectedMonthlyOrders));
        break;
      }
      case "EBAY": {
        const s = configs.EBAY;
        if (s.categoryId) p.set("eb.cat", s.categoryId);
        if (s.manualCategoryRate) p.set("eb.mr", String(s.manualCategoryRate));
        p.set("eb.reg", s.region);
        if (s.currencyConversionSelected) p.set("eb.cc", "1");
        if (s.topRatedPremiumService) p.set("eb.tr", "1");
        if (s.privateInsertionFee) p.set("eb.ins", "1");
        break;
      }
      case "ETSY": {
        const s = configs.ETSY;
        if (s.offsiteAdsRate) p.set("et.ads", String(s.offsiteAdsRate));
        if (s.currencyConversionSelected) p.set("et.cc", "1");
        if (s.vatIdSupplied) p.set("et.vid", "1");
        if (s.usdToGbpRate && s.usdToGbpRate !== DEFAULT_USD_TO_GBP_RATE) p.set("et.fx", String(s.usdToGbpRate));
        break;
      }
      case "TIKTOK": {
        const s = configs.TIKTOK;
        if (s.categoryId) p.set("tt.cat", s.categoryId);
        if (s.manualCategoryRate) p.set("tt.mr", String(s.manualCategoryRate));
        if (s.promotionalRate) p.set("tt.promo", String(s.promotionalRate));
        if (s.sellerDiscount) p.set("tt.sd", String(s.sellerDiscount));
        if (s.platformDiscount) p.set("tt.pd", String(s.platformDiscount));
        if (s.affiliateCommissionRate) p.set("tt.aff", String(s.affiliateCommissionRate));
        if (s.otherActualCosts) p.set("tt.oc", String(s.otherActualCosts));
        break;
      }
      case "VINTED": {
        const s = configs.VINTED;
        if (s.visibilityServiceCost) p.set("vi.vis", String(s.visibilityServiceCost));
        break;
      }
    }
  }
  return p.toString();
}

/** Reads a comparison from a URL. Anything missing or invalid falls back to the default, never a guess. */
export function stateFromSearch(search: string): CompareState {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const state = defaultCompareState();
  const sale = state.sale;
  sale.soldPrice = num(p.get("price"), nonNeg) ?? sale.soldPrice;
  sale.itemCost = num(p.get("cost"), nonNeg) ?? sale.itemCost;
  sale.shippingCharged = num(p.get("dc"), nonNeg) ?? 0;
  sale.shippingCost = num(p.get("dp"), nonNeg) ?? 0;
  sale.quantity = num(p.get("qty"), (n) => Number.isInteger(n) && n >= 1) ?? 1;
  sale.vatProfile = p.get("vat") === "R" ? "REGISTERED" : "NOT_REGISTERED";
  sale.sellerType = p.get("seller") === "P" ? "PRIVATE" : "BUSINESS";
  state.from = oneOf(p.get("from"), COMPARE_PLATFORMS) ?? null;
  state.mode = p.get("mode") === "match" ? "MATCH" : "KEEP";
  state.matchTarget = num(p.get("target"), (n) => n >= -1_000_000 && n <= 1_000_000) ?? null;

  const requested = (p.get("set") ?? "").split(",").filter((x): x is ComparePlatform => COMPARE_PLATFORMS.includes(x as ComparePlatform));
  const c = state.configs;
  const customised = new Set<ComparePlatform>();

  if (requested.includes("SHOPIFY")) {
    const plan = oneOf(p.get("sh.plan"), Object.keys(SHOPIFY_PLANS) as ShopifyPlan[]);
    const pay = oneOf<ShopifyPaymentProcessor>(p.get("sh.pay"), ["SHOPIFY_PAYMENTS", "THIRD_PARTY", "PAYPAL_WITH_SHOPIFY_PAYMENTS", "PAYPAL_WITHOUT_SHOPIFY_PAYMENTS"]);
    const card = oneOf<ShopifyCardType>(p.get("sh.card"), ["STANDARD", "INTERNATIONAL_AMEX"]);
    if (plan && pay && card) {
      const r = num(p.get("sh.r"), (n) => n >= 0 && n <= 1);
      const f = num(p.get("sh.f"), nonNeg);
      c.SHOPIFY = {
        plan,
        processor: pay,
        cardType: card,
        thirdPartyProcessor: pay !== "SHOPIFY_PAYMENTS" && r !== undefined && f !== undefined ? { rate: r, fixed: f } : null,
        expectedMonthlyOrders: num(p.get("sh.mo"), (n) => Number.isInteger(n) && n >= 1) ?? null,
      };
      customised.add("SHOPIFY");
    }
  }

  if (requested.includes("EBAY")) {
    const raw = p.get("eb.cat");
    const cat = raw === UNSUPPORTED_CATEGORY_ID || EBAY_CATEGORIES.some((x) => x.id === raw) ? raw! : "";
    const reg = oneOf<EbayInternationalRegion>(p.get("eb.reg"), ["DOMESTIC", "EU_NORTHERN_EUROPE", "US_CANADA", "OTHER"]);
    if (reg) {
      c.EBAY = {
        ...c.EBAY,
        categoryId: cat,
        manualCategoryRate: num(p.get("eb.mr"), rate01) ?? null,
        region: reg,
        currencyConversionSelected: bool(p.get("eb.cc")),
        topRatedPremiumService: bool(p.get("eb.tr")),
        privateInsertionFee: bool(p.get("eb.ins")),
      };
      customised.add("EBAY");
    }
  }

  if (requested.includes("ETSY")) {
    const ads = p.get("et.ads");
    c.ETSY = {
      offsiteAdsRate: ads === "0.15" || ads === "0.12" ? (Number(ads) as EtsyOffsiteAdsRate) : null,
      currencyConversionSelected: bool(p.get("et.cc")),
      vatIdSupplied: bool(p.get("et.vid")),
      usdToGbpRate: num(p.get("et.fx"), (n) => n > 0 && n <= 10) ?? DEFAULT_USD_TO_GBP_RATE,
    };
    customised.add("ETSY");
  }

  if (requested.includes("TIKTOK")) {
    const raw = p.get("tt.cat");
    const cat = raw === UNSUPPORTED_CATEGORY_ID || TIKTOK_CATEGORIES.some((x) => x.id === raw) ? raw! : "";
    {
      c.TIKTOK = {
        categoryId: cat,
        manualCategoryRate: num(p.get("tt.mr"), rate01) ?? null,
        promotionalRate: num(p.get("tt.promo"), rate01) ?? null,
        sellerDiscount: num(p.get("tt.sd"), nonNeg) ?? 0,
        platformDiscount: num(p.get("tt.pd"), nonNeg) ?? 0,
        affiliateCommissionRate: num(p.get("tt.aff"), (n) => n >= 0.01 && n <= 0.8) ?? null,
        otherActualCosts: num(p.get("tt.oc"), nonNeg) ?? 0,
      };
      customised.add("TIKTOK");
    }
  }

  if (requested.includes("VINTED")) {
    c.VINTED = { ...c.VINTED, visibilityServiceCost: num(p.get("vi.vis"), (n) => n > 0) ?? null };
    customised.add("VINTED");
  }

  state.customised = COMPARE_PLATFORMS.filter((x) => customised.has(x));
  return state;
}

/**
 * Builds the Compare link from a calculator: the shared sale, plus that calculator's
 * exact settings, marked as the person's own.
 */
export function compareHrefFromCalculator<P extends ComparePlatform>(
  platform: P,
  scenario: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
): string {
  const state = defaultCompareState();
  state.sale = {
    soldPrice: scenario.soldPrice,
    itemCost: scenario.itemCost,
    shippingCharged: scenario.shippingCharged,
    shippingCost: scenario.shippingCost,
    quantity: scenario.quantity,
    vatProfile: scenario.vatProfile ?? "NOT_REGISTERED",
    sellerType: "BUSINESS",
  };
  if (platform === "EBAY") state.sale.sellerType = (config as MarketplaceConfigMap["EBAY"]).sellerType === "PRIVATE" ? "PRIVATE" : "BUSINESS";
  if (platform === "VINTED") state.sale.sellerType = (config as MarketplaceConfigMap["VINTED"]).sellerRoute === "PRIVATE" ? "PRIVATE" : "BUSINESS";
  (state.configs as Record<ComparePlatform, unknown>)[platform] = { ...config };
  state.customised = [platform];
  state.from = platform;
  return `/compare?${stateToSearch(state)}`;
}

/* ---------- Compare → calculator ---------- */

/** Link to a marketplace's full calculator carrying the sale and that marketplace's settings from Compare. */
export function calculatorHref(platform: ComparePlatform, state: CompareState): string {
  const s: CompareState = {
    ...defaultCompareState(),
    sale: { ...state.sale },
    configs: { ...defaultConfigs(), [platform]: { ...linkedConfigs(state)[platform] } },
    customised: [platform],
  };
  return `${CALCULATOR_PATHS[platform]}?${stateToSearch(s)}`;
}

export interface CalculatorLink<P extends ComparePlatform> {
  /** False when the page was opened without a link: keep the page's own defaults. */
  hasLink: boolean;
  sale: CompareSale;
  /** True when the link carried this marketplace's own settings. */
  hasSettings: boolean;
  config: CompareConfigs[P];
}

/** Reads a calculator page's link (as written by calculatorHref or a shared Compare link). */
export function readCalculatorLink<P extends ComparePlatform>(search: string, platform: P): CalculatorLink<P> {
  const state = stateFromSearch(search);
  const hasLink = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).has("price");
  return {
    hasLink,
    sale: state.sale,
    hasSettings: state.customised.includes(platform),
    config: linkedConfigs(state)[platform] as CompareConfigs[P],
  };
}
