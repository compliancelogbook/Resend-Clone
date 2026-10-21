/**
 * TikTok Shop UK fee calculator. All maths comes from the verified engine in
 * lib/engines/tiktok.ts (copied unchanged from the old EasyFeezy repo);
 * this file only collects inputs and presents the result. Validation follows
 * lib/engines/tiktok-resolve.ts.
 */
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  CalculatorFootnote,
  CalculatorHero,
  CalculatorLayout,
  MoneyField,
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
import { TIKTOK_CATEGORY_OPTIONS } from "@/lib/category-options";
import { DISCOUNTS_EXCEED_SUBTOTAL_MESSAGE } from "@/lib/engines/tiktok-resolve";
import { TIKTOK_CATEGORIES, TIKTOK_SOURCE } from "@/data/tiktok.fees";
import { UNSUPPORTED_CATEGORY_ID } from "@/data/types";
import type { VatProfile } from "@/data/vat";
import type { CalculationResult } from "@/lib/types";
import {
  parseManualCategoryRate,
  parseNonNegativeAmount,
  parseOptionalAffiliateRate,
  parsePositiveWholeQuantity,
  type ValidationResult,
} from "@/lib/validation";

const errorOf = <T,>(r: ValidationResult<T>) => (r.ok ? undefined : r.error);
const valueOf = <T,>(r: ValidationResult<T>, fallback: T) => (r.ok ? r.value : fallback);


export default function TikTokCalculator() {
  // Opened from Compare (or a shared link)? Start from those figures instead of the defaults.
  const [link] = useState(() => readCalculatorLink(window.location.search, "TIKTOK"));
  const pct = (n: number | null | undefined) => (n ? String(+(n * 100).toFixed(4)) : "");
  useEffect(() => {
    document.title = "TikTok Shop fee calculator · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [soldPrice, setSoldPrice] = useState(link.hasLink ? String(link.sale.soldPrice) : "30");
  const [itemCost, setItemCost] = useState(link.hasLink ? String(link.sale.itemCost) : "10");
  const [shippingCharged, setShippingCharged] = useState(link.hasLink ? String(link.sale.shippingCharged) : "0");
  const [shippingCost, setShippingCost] = useState(link.hasLink ? String(link.sale.shippingCost) : "0");
  const [quantity, setQuantity] = useState(link.hasLink ? String(link.sale.quantity) : "1");
  const [categoryId, setCategoryId] = useState(link.hasSettings ? link.config.categoryId : "");
  const [manualRate, setManualRate] = useState(link.hasSettings ? pct(link.config.manualCategoryRate) : "");
  const [promoEnabled, setPromoEnabled] = useState(link.hasSettings && !!link.config.promotionalRate);
  const [promoRate, setPromoRate] = useState(link.hasSettings ? pct(link.config.promotionalRate) : "");
  const [sellerDiscount, setSellerDiscount] = useState(link.hasSettings ? String(link.config.sellerDiscount) : "0");
  const [platformDiscount, setPlatformDiscount] = useState(link.hasSettings ? String(link.config.platformDiscount) : "0");
  const [affiliateRate, setAffiliateRate] = useState(link.hasSettings ? pct(link.config.affiliateCommissionRate) : "");
  const [otherCosts, setOtherCosts] = useState(link.hasSettings ? String(link.config.otherActualCosts) : "0");
  const [vatProfile, setVatProfile] = useState<VatProfile>(link.hasLink ? link.sale.vatProfile : "NOT_REGISTERED");

  const sold = parseNonNegativeAmount(soldPrice, "Selling price");
  const cost = parseNonNegativeAmount(itemCost, "Item cost");
  const charged = parseNonNegativeAmount(shippingCharged, "Delivery charged");
  const shipping = parseNonNegativeAmount(shippingCost, "Delivery cost");
  const qty = parsePositiveWholeQuantity(quantity);

  const manualActive = categoryId === UNSUPPORTED_CATEGORY_ID;
  const manual = parseManualCategoryRate(manualRate);
  const promo = parseManualCategoryRate(promoRate);
  const affiliate = parseOptionalAffiliateRate(affiliateRate);
  const sellerDisc = parseNonNegativeAmount(sellerDiscount, "Your discount");
  const platformDisc = parseNonNegativeAmount(platformDiscount, "TikTok's discount");
  const other = parseNonNegativeAmount(otherCosts, "Other TikTok costs");

  // Same rule as resolveTikTok: discounts can't add up to more than the product subtotal.
  const discountsTooBig =
    sold.ok && qty.ok && sellerDisc.ok && platformDisc.ok && sellerDisc.value + platformDisc.value > sold.value * qty.value;

  const hasErrors =
    [sold, cost, charged, shipping, qty, affiliate, sellerDisc, platformDisc, other].some((r) => !r.ok) ||
    discountsTooBig ||
    categoryId === "" ||
    (manualActive && !manual.ok) ||
    (promoEnabled && !promo.ok);
  const { calculated, showErrors, calculate, err, resultRef } = useCalculatorFlow(hasErrors, link.hasLink);

  let result: CalculationResult | null = null;
  let pricing: PricingContext | null = null;
  let engineError: string | null = null;
  if (!hasErrors) {
    pricing = {
      platform: "TIKTOK",
      scenario: {
        soldPrice: valueOf(sold, 0),
        itemCost: valueOf(cost, 0),
        shippingCharged: valueOf(charged, 0),
        shippingCost: valueOf(shipping, 0),
        quantity: valueOf(qty, 1),
        vatProfile,
      },
      config: {
        sellerDiscount: valueOf(sellerDisc, 0),
        platformDiscount: valueOf(platformDisc, 0),
        categoryId,
        manualCategoryRate: manualActive ? valueOf(manual, null) : null,
        promotionalRate: promoEnabled ? valueOf(promo, null) : null,
        affiliateCommissionRate: valueOf(affiliate, null),
        otherActualCosts: valueOf(other, 0),
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
      <CalculatorHero marketplace="TikTok Shop" title="TikTok Shop fee calculator" intro="Calculate TikTok Shop fees and net profit on any sale, for UK sellers." />

      <CalculatorLayout
        onCalculate={calculate}
        showErrorSummary={showErrors && hasErrors}
        form={
          <>
            <Step number={1} title="Your sale" intro="Enter the price before any discounts. Discounts come in step 3.">
              <SaleFields
                priceNote="each, before discounts"
                values={{ soldPrice, itemCost, shippingCharged, shippingCost, quantity }}
                setters={{ soldPrice: setSoldPrice, itemCost: setItemCost, shippingCharged: setShippingCharged, shippingCost: setShippingCost, quantity: setQuantity }}
                errors={{ soldPrice: err(errorOf(sold)), itemCost: err(errorOf(cost)), shippingCharged: err(errorOf(charged)), shippingCost: err(errorOf(shipping)), quantity: err(errorOf(qty)) }}
              />
            </Step>

            <Step number={2} title="What you sold" intro="TikTok Shop charges 5% or 9% commission, depending on the category.">
              <SearchablePicker label="Category" value={categoryId} onChange={setCategoryId} options={TIKTOK_CATEGORY_OPTIONS} placeholder="Search 343 categories, e.g. toothbrush" required emptyText="Choose your category" error={err(categoryId === "" ? "Choose a category to calculate TikTok Shop's commission." : undefined)} />
              {manualActive && (
                <TextField label="Commission rate" note="from your TikTok Shop account" suffix="%" placeholder="e.g. 9" value={manualRate} onChange={setManualRate} error={err(errorOf(manual))} />
              )}
              <Toggle
                checked={promoEnabled}
                onChange={setPromoEnabled}
                title="I have a promotional commission rate"
                detail="If TikTok gave you a special rate, it replaces the category rate."
              />
              {promoEnabled && (
                <TextField label="Promotional rate" suffix="%" placeholder="e.g. 5" value={promoRate} onChange={setPromoRate} error={err(errorOf(promo))} />
              )}
            </Step>

            <Step number={3} title="Discounts and creators" intro="Leave at £0 or blank if they didn't apply to this order.">
              <div className="calc-grid">
                <MoneyField label="Your discount" note="whole order" value={sellerDiscount} onChange={setSellerDiscount} error={err(errorOf(sellerDisc) ?? (discountsTooBig ? DISCOUNTS_EXCEED_SUBTOTAL_MESSAGE : undefined))} />
                <MoneyField label="TikTok's discount" note="whole order" value={platformDiscount} onChange={setPlatformDiscount} error={err(errorOf(platformDisc) ?? (discountsTooBig ? DISCOUNTS_EXCEED_SUBTOTAL_MESSAGE : undefined))} />
              </div>
              <p className="calc-fine">Your discount lowers TikTok's commission. A discount TikTok pays for doesn't, because TikTok covers it.</p>
              <TextField
                label="Creator commission"
                note="optional, 1–80%"
                suffix="%"
                placeholder="Leave blank if no creator was involved"
                value={affiliateRate}
                onChange={setAffiliateRate}
                error={err(errorOf(affiliate))}
              />
            </Step>

            <Step number={4} title="Your other costs" intro="Costs TikTok charged you that aren't on a published price list.">
              <MoneyField
                label="Other TikTok Shop costs"
                note="fulfilment, ads, storage, returns"
                value={otherCosts}
                onChange={setOtherCosts}
                error={err(errorOf(other))}
              />
              <p className="calc-fine">Enter what you were actually charged, including any VAT. We don't estimate these for you.</p>
              <Segmented
                label="VAT"
                value={vatProfile}
                onChange={setVatProfile}
                options={[
                  { value: "NOT_REGISTERED", label: "Not VAT registered" },
                  { value: "REGISTERED", label: "VAT registered" },
                ]}
              />
              <p className="calc-fine">TikTok Shop's commission rates already include VAT.</p>
            </Step>
          </>
        }
        result={<ResultPanel platform="TikTok Shop" result={result} pricing={pricing} calculated={calculated} errorMessage={engineError} onCalculate={calculate} resultRef={resultRef} />}
      />

      <CalculatorFootnote checkedOn={TIKTOK_SOURCE.verifiedAt} sourceUrl={TIKTOK_SOURCE.url} sourceName="TikTok Shop UK commission rates" />
      <SiteFooter />
    </main>
  );
}
