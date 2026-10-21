/**
 * eBay UK fee calculator (Business sellers). All maths comes from the verified
 * engine in lib/engines/ebay.ts (copied unchanged from the old EasyFeezy repo);
 * this file only collects inputs and presents the result.
 */
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  CalculatorFootnote,
  CalculatorHero,
  CalculatorLayout,
  Note,
  OptionCards,
  type PricingContext,
  ResultPanel,
  SaleFields,
  SearchablePicker,
  Segmented,
  Step,
  TextField,
  Toggle,
  useCalculatorFlow,
} from "@/components/calculator/CalculatorParts";
import { calculateMarketplace } from "@/lib/compare/adapters";
import { readCalculatorLink } from "@/lib/compare/compare-state";
import { EBAY_CATEGORY_OPTIONS } from "@/lib/category-options";
import {
  EBAY_CATEGORIES,
  EBAY_INTERNATIONAL_FEE_RATES,
  ebayCurrencyConversionOn,
  todayInUk,
  EBAY_SOURCE_2026_08_04,
  type EbayInternationalRegion,
} from "@/data/ebay.fees";
import { UNSUPPORTED_CATEGORY_ID } from "@/data/types";
import { EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH, EBAY_PRIVATE_SOURCE } from "@/data/ebay-private.fees";
import type { VatProfile } from "@/data/vat";
import type { CalculationResult } from "@/lib/types";
import {
  parseManualCategoryRate,
  parseNonNegativeAmount,
  parsePositiveWholeQuantity,
  type ValidationResult,
} from "@/lib/validation";

const errorOf = <T,>(r: ValidationResult<T>) => (r.ok ? undefined : r.error);
const valueOf = <T,>(r: ValidationResult<T>, fallback: T) => (r.ok ? r.value : fallback);
const pct = (rate: number) => `${+(rate * 100).toFixed(2)}%`;


const REGION_OPTIONS: { value: EbayInternationalRegion; title: string; detail: string }[] = [
  { value: "DOMESTIC", title: "UK", detail: "No international fee" },
  { value: "EU_NORTHERN_EUROPE", title: "Europe", detail: `Eurozone & Northern Europe · +${pct(EBAY_INTERNATIONAL_FEE_RATES.EU_NORTHERN_EUROPE)}` },
  { value: "US_CANADA", title: "US & Canada", detail: `+${pct(EBAY_INTERNATIONAL_FEE_RATES.US_CANADA)}` },
  { value: "OTHER", title: "Rest of world", detail: `+${pct(EBAY_INTERNATIONAL_FEE_RATES.OTHER)}` },
];

export default function EbayCalculator() {
  // Opened from Compare (or a shared link)? Start from those figures instead of the defaults.
  const [link] = useState(() => readCalculatorLink(window.location.search, "EBAY"));
  const pct = (n: number | null | undefined) => (n ? String(+(n * 100).toFixed(4)) : "");
  useEffect(() => {
    document.title = "eBay fee calculator · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [soldPrice, setSoldPrice] = useState(link.hasLink ? String(link.sale.soldPrice) : "30");
  const [itemCost, setItemCost] = useState(link.hasLink ? String(link.sale.itemCost) : "10");
  const [shippingCharged, setShippingCharged] = useState(link.hasLink ? String(link.sale.shippingCharged) : "0");
  const [shippingCost, setShippingCost] = useState(link.hasLink ? String(link.sale.shippingCost) : "0");
  const [quantity, setQuantity] = useState(link.hasLink ? String(link.sale.quantity) : "1");
  const [categoryId, setCategoryId] = useState(link.hasSettings ? link.config.categoryId : "");
  const [manualRate, setManualRate] = useState(link.hasSettings ? pct(link.config.manualCategoryRate) : "");
  const [region, setRegion] = useState<EbayInternationalRegion>(link.hasSettings ? link.config.region : "DOMESTIC");
  const [currencyConversion, setCurrencyConversion] = useState(link.hasSettings && link.config.currencyConversionSelected);
  const [topRated, setTopRated] = useState(link.hasSettings && link.config.topRatedPremiumService);
  const [vatProfile, setVatProfile] = useState<VatProfile>(link.hasLink ? link.sale.vatProfile : "NOT_REGISTERED");
  const [sellerType, setSellerType] = useState<"BUSINESS" | "PRIVATE">(link.hasLink ? link.sale.sellerType : "BUSINESS");
  const [pastFreeListings, setPastFreeListings] = useState(link.hasSettings && !!link.config.privateInsertionFee);
  const isPrivate = sellerType === "PRIVATE";

  const sold = parseNonNegativeAmount(soldPrice, "Selling price");
  const cost = parseNonNegativeAmount(itemCost, "Item cost");
  const charged = parseNonNegativeAmount(shippingCharged, "Delivery charged");
  const shipping = parseNonNegativeAmount(shippingCost, "Delivery cost");
  const qty = parsePositiveWholeQuantity(quantity);

  const category = EBAY_CATEGORIES.find((c) => c.id === categoryId);
  const needsManualRate = !isPrivate && (categoryId === UNSUPPORTED_CATEGORY_ID || (category !== undefined && !category.schedule));
  const manual = parseManualCategoryRate(manualRate);

  const categoryMissing = !isPrivate && categoryId === "";
  const hasErrors = [sold, cost, charged, shipping, qty].some((r) => !r.ok) || categoryMissing || (needsManualRate && !manual.ok);
  const { calculated, showErrors, calculate, err, resultRef } = useCalculatorFlow(hasErrors, link.hasLink);

  let result: CalculationResult | null = null;
  let pricing: PricingContext | null = null;
  let engineError: string | null = null;
  if (!hasErrors) {
    pricing = {
      platform: "EBAY",
      scenario: {
        soldPrice: valueOf(sold, 0),
        itemCost: valueOf(cost, 0),
        shippingCharged: valueOf(charged, 0),
        shippingCost: valueOf(shipping, 0),
        quantity: valueOf(qty, 1),
        vatProfile,
      },
      config: {
        categoryId,
        manualCategoryRate: needsManualRate ? valueOf(manual, null) : null,
        region,
        currencyConversionSelected: currencyConversion,
        topRatedPremiumService: topRated,
        sellerType,
        privateInsertionFee: pastFreeListings,
      },
    };
    try {
      result = calculateMarketplace(pricing.platform, pricing.scenario, pricing.config);
    } catch (error) {
      engineError = error instanceof Error ? error.message : "Something went wrong with this calculation.";
    }
  }

  return (
    <main className="site-shell">
      <SiteHeader />
      <CalculatorHero marketplace="eBay" title="eBay fee calculator" intro="Calculate eBay fees and net profit on any sale, for UK private and business sellers." />

      <CalculatorLayout
        onCalculate={calculate}
        showErrorSummary={showErrors && hasErrors}
        form={
          <>
            <Step number={1} title="How you sell on eBay" intro="Private sellers pay no selling fees. Business sellers pay eBay's full fees.">
              <OptionCards
                label="Seller type"
                value={sellerType}
                onChange={setSellerType}
                options={[
                  { value: "PRIVATE", title: "Private seller", detail: "Selling your own things", extra: "No selling fees" },
                  { value: "BUSINESS", title: "Business seller", detail: "Registered eBay business account", extra: "Fees depend on category" },
                ]}
              />
              {isPrivate && (
                <Note>
                  Private selling is for your own belongings. If you buy to resell or trade regularly, eBay requires a business account. Vehicles aren't free to sell and aren't covered here.
                </Note>
              )}
            </Step>

            <Step number={2} title="Your sale" intro="What the buyer paid and what it cost you.">
              <SaleFields
                values={{ soldPrice, itemCost, shippingCharged, shippingCost, quantity }}
                setters={{ soldPrice: setSoldPrice, itemCost: setItemCost, shippingCharged: setShippingCharged, shippingCost: setShippingCost, quantity: setQuantity }}
                errors={{ soldPrice: err(errorOf(sold)), itemCost: err(errorOf(cost)), shippingCharged: err(errorOf(charged)), shippingCost: err(errorOf(shipping)), quantity: err(errorOf(qty)) }}
              />
            </Step>

            {isPrivate ? (
              <Step number={3} title="Where the buyer is" intro="eBay only charges private sellers when the buyer is abroad.">
                <OptionCards
                  label="Buyer location"
                  value={region === "DOMESTIC" ? "DOMESTIC" : "OTHER"}
                  onChange={setRegion}
                  options={[
                    { value: "DOMESTIC", title: "UK", detail: "No fee" },
                    { value: "OTHER", title: "Outside the UK", detail: "+3% of the total sale" },
                  ]}
                />
                <Toggle
                  checked={pastFreeListings}
                  onChange={setPastFreeListings}
                  title={`I've used my ${EBAY_PRIVATE_FREE_LISTINGS_PER_MONTH} free listings this month`}
                  detail="eBay then charges 35p for each new listing (400 free with an eBay Shop)."
                />
              </Step>
            ) : (
              <>
                <Step number={3} title="What you sold" intro="eBay's main fee depends on the category.">
                  <SearchablePicker label="Category" value={categoryId} onChange={setCategoryId} options={EBAY_CATEGORY_OPTIONS} placeholder="Search 74 categories, e.g. trainers" required emptyText="Choose your category" error={err(categoryMissing ? "Choose a category to calculate eBay's fee." : undefined)} />
                  {needsManualRate && (
                    <TextField
                      label="Final value fee rate"
                      note="from your eBay invoice or fee page"
                      suffix="%"
                      placeholder="e.g. 12.9"
                      value={manualRate}
                      onChange={setManualRate}
                      error={err(errorOf(manual))}
                    />
                  )}
                  {category?.reducedPerOrderFee && (
                    <Note>
                      {category.label} gets eBay's lower 10p per-order fee on sales up to £{category.reducedPerOrderFee.atOrBelowThreshold}. We apply it for you.
                    </Note>
                  )}
                </Step>

                <Step number={4} title="Where the buyer is" intro="eBay adds a fee when you sell abroad.">
                  <OptionCards label="Buyer location" value={region} onChange={setRegion} options={REGION_OPTIONS} />
                  <Toggle
                    checked={currencyConversion}
                    onChange={setCurrencyConversion}
                    title="eBay converted the currency"
                    detail={`Adds eBay's ${+(ebayCurrencyConversionOn(todayInUk()).rate * 100).toFixed(2)}% conversion fee (2.75% from 1 December 2026). Only applies if eBay changed the currency on this order.`}
                  />
                </Step>

                <Step number={5} title="Your seller account" intro="These change what you pay, or what you can claim back.">
                  <Segmented
                    label="VAT"
                    value={vatProfile}
                    onChange={setVatProfile}
                    options={[
                      { value: "NOT_REGISTERED", label: "Not VAT registered" },
                      { value: "REGISTERED", label: "VAT registered" },
                    ]}
                  />
                  <Toggle
                    checked={topRated}
                    onChange={setTopRated}
                    title="Top Rated Premium Service discount"
                    detail="10% off the final value fee, if your listing qualifies."
                  />
                </Step>
              </>
            )}
          </>
        }
        result={<ResultPanel platform="eBay" result={result} pricing={pricing} calculated={calculated} errorMessage={engineError} onCalculate={calculate} resultRef={resultRef} />}
      />

      {isPrivate ? (
        <CalculatorFootnote checkedOn={EBAY_PRIVATE_SOURCE.verifiedAt} sourceUrl={EBAY_PRIVATE_SOURCE.url} sourceName="eBay UK selling fees" />
      ) : (
        <CalculatorFootnote checkedOn={EBAY_SOURCE_2026_08_04.verifiedAt} sourceUrl={EBAY_SOURCE_2026_08_04.url} sourceName="eBay UK business seller fees" />
      )}
      <SiteFooter />
    </main>
  );
}
