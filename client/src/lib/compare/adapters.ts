import type { EbayInternationalRegion } from "../../data/ebay.fees";
import type { EtsyOffsiteAdsRate } from "../../data/etsy.fees";
import type { ShopifyPaymentProcessor, ShopifyPlan } from "../../data/shopify.fees";
import type { Platform } from "../../data/types";
import type { VatProfile } from "../../data/vat";
import { calculateAmazon, type AmazonSellerPlan } from "../engines/amazon";
import { calculateEbay } from "../engines/ebay";
import { calculateEbayPrivate } from "../engines/ebay-private";
import { calculateEtsy } from "../engines/etsy";
import { calculateShopify, type ShopifyCardType } from "../engines/shopify";
import { calculateTikTok } from "../engines/tiktok";
import { calculateVinted, type VintedSellerRoute } from "../engines/vinted";
import type { CalculationResult } from "../types";

export interface SharedComparisonScenario {
  soldPrice: number;
  itemCost: number;
  shippingCharged: number;
  shippingCost: number;
  quantity: number;
  vatProfile: VatProfile | null;
}

export interface MarketplaceConfigMap {
  SHOPIFY: {
    plan: ShopifyPlan;
    processor: ShopifyPaymentProcessor;
    cardType: ShopifyCardType;
    thirdPartyProcessor?: { rate: number; fixed: number } | null;
    expectedMonthlyOrders?: number | null;
  };
  ETSY: {
    currencyConversionSelected: boolean;
    offsiteAdsRate: EtsyOffsiteAdsRate | null;
    vatIdSupplied: boolean;
    usdToGbpRate?: number | null;
  };
  EBAY: {
    categoryId: string;
    manualCategoryRate?: number | null;
    region: EbayInternationalRegion;
    currencyConversionSelected: boolean;
    topRatedPremiumService: boolean;
    /** Added in EasyFeezy site: private sellers use the separate private-seller engine. Defaults to BUSINESS. */
    sellerType?: "BUSINESS" | "PRIVATE";
    /** Private sellers only: this listing went past the free monthly allowance (35p). */
    privateInsertionFee?: boolean;
  };
  AMAZON: {
    sellerPlan: AmazonSellerPlan;
    categoryId: string;
    manualCategoryRate?: number | null;
    expectedMonthlyUnits?: number | null;
  };
  TIKTOK: {
    sellerDiscount: number;
    platformDiscount: number;
    categoryId: string;
    manualCategoryRate?: number | null;
    promotionalRate?: number | null;
    affiliateCommissionRate?: number | null;
    otherActualCosts: number;
  };
  VINTED: {
    sellerRoute: VintedSellerRoute;
    visibilityServiceCost?: number | null;
  };
}

export interface MarketplaceAdapterDescriptor {
  platform: Platform;
  label: string;
  requiresVatProfile: boolean;
}

export const MARKETPLACE_ADAPTERS: Record<Platform, MarketplaceAdapterDescriptor> = {
  SHOPIFY: { platform: "SHOPIFY", label: "Shopify", requiresVatProfile: false },
  ETSY: { platform: "ETSY", label: "Etsy", requiresVatProfile: true },
  EBAY: { platform: "EBAY", label: "eBay", requiresVatProfile: true },
  AMAZON: { platform: "AMAZON", label: "Amazon", requiresVatProfile: true },
  TIKTOK: { platform: "TIKTOK", label: "TikTok Shop", requiresVatProfile: true },
  VINTED: { platform: "VINTED", label: "Vinted", requiresVatProfile: false },
};

function requireVat(scenario: SharedComparisonScenario, platform: Platform): VatProfile {
  if (scenario.vatProfile === null) {
    throw new Error(`${MARKETPLACE_ADAPTERS[platform].label} requires VAT status before it can be compared.`);
  }
  return scenario.vatProfile;
}

export function calculateMarketplace<P extends Platform>(
  platform: P,
  scenario: SharedComparisonScenario,
  config: MarketplaceConfigMap[P],
): CalculationResult {
  switch (platform) {
    case "SHOPIFY": {
      const value = config as MarketplaceConfigMap["SHOPIFY"];
      return calculateShopify({
        soldPrice: scenario.soldPrice,
        itemCost: scenario.itemCost,
        shippingCharged: scenario.shippingCharged,
        shippingCost: scenario.shippingCost,
        quantity: scenario.quantity,
        ...value,
      });
    }
    case "ETSY": {
      const value = config as MarketplaceConfigMap["ETSY"];
      return calculateEtsy({
        itemPrice: scenario.soldPrice,
        itemCost: scenario.itemCost,
        shippingCharged: scenario.shippingCharged,
        shippingCost: scenario.shippingCost,
        quantity: scenario.quantity,
        vatProfile: requireVat(scenario, platform),
        ...value,
      });
    }
    case "EBAY": {
      const { sellerType, privateInsertionFee, ...value } = config as MarketplaceConfigMap["EBAY"];
      if (sellerType === "PRIVATE") {
        return calculateEbayPrivate({
          itemPrice: scenario.soldPrice,
          itemCost: scenario.itemCost,
          shippingCharged: scenario.shippingCharged,
          shippingCost: scenario.shippingCost,
          quantity: scenario.quantity,
          buyerOutsideUk: value.region !== "DOMESTIC",
          paidInsertionFee: privateInsertionFee ?? false,
        });
      }
      return calculateEbay({
        itemPrice: scenario.soldPrice,
        itemCost: scenario.itemCost,
        shippingCharged: scenario.shippingCharged,
        shippingCost: scenario.shippingCost,
        quantity: scenario.quantity,
        vatProfile: requireVat(scenario, platform),
        ...value,
      });
    }
    case "AMAZON": {
      const value = config as MarketplaceConfigMap["AMAZON"];
      return calculateAmazon({
        itemPrice: scenario.soldPrice,
        itemCost: scenario.itemCost,
        deliveryCharge: scenario.shippingCharged,
        shippingCost: scenario.shippingCost,
        quantity: scenario.quantity,
        vatProfile: requireVat(scenario, platform),
        ...value,
      });
    }
    case "TIKTOK": {
      const value = config as MarketplaceConfigMap["TIKTOK"];
      return calculateTikTok({
        soldPrice: scenario.soldPrice,
        itemCost: scenario.itemCost,
        customerPaidShipping: scenario.shippingCharged,
        shippingCost: scenario.shippingCost,
        quantity: scenario.quantity,
        vatProfile: requireVat(scenario, platform),
        ...value,
      });
    }
    case "VINTED": {
      const value = config as MarketplaceConfigMap["VINTED"];
      return calculateVinted({
        soldPrice: scenario.soldPrice,
        itemCost: scenario.itemCost,
        shippingReceived: scenario.shippingCharged,
        shippingCost: scenario.shippingCost,
        quantity: scenario.quantity,
        ...value,
      });
    }
  }
  // Added in EasyFeezy site: TypeScript 5.6 can't prove the switch above is exhaustive.
  throw new Error(`Unsupported marketplace: ${platform}`);
}
