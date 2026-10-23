/**
 * Vinted UK calculator. All maths comes from the verified engine in
 * lib/engines/vinted.ts (copied unchanged from the old EasyFeezy repo);
 * this file only collects inputs and presents the result. Validation follows
 * lib/engines/vinted-resolve.ts.
 */
import { useEffect, useState } from "react";
import { TIPS } from "@/lib/info-tips";
import {
  CalculatorFootnote,
  CalculatorPage,
  CalculatorHero,
  CalculatorLayout,
  MoneyField,
  Note,
  OptionCards,
  type PricingContext,
  ResultPanel,
  SaleFields,
  Step,
  Toggle,
  useCalculatorFlow,
} from "@/components/calculator/CalculatorParts";
import { calculateMarketplace } from "@/lib/compare/adapters";
import { readCalculatorLink } from "@/lib/compare/compare-state";
import type { VintedSellerRoute } from "@/lib/engines/vinted";
import { VINTED_ZERO_SELLING_FEE_SOURCE } from "@/data/vinted.fees";
import type { CalculationResult } from "@/lib/types";
import {
  parseNonNegativeAmount,
  parsePositiveWholeQuantity,
  parseRequiredPositiveAmount,
  type ValidationResult,
} from "@/lib/validation";

const errorOf = <T,>(r: ValidationResult<T>) => (r.ok ? undefined : r.error);
const valueOf = <T,>(r: ValidationResult<T>, fallback: T) => (r.ok ? r.value : fallback);

export default function VintedCalculator() {
  // Opened from Compare (or a shared link)? Start from those figures instead of the defaults.
  const [link] = useState(() => readCalculatorLink(window.location.search, "VINTED"));
  const pct = (n: number | null | undefined) => (n ? String(+(n * 100).toFixed(4)) : "");
  useEffect(() => {
    document.title = "Vinted fee calculator · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [soldPrice, setSoldPrice] = useState(link.hasLink ? String(link.sale.soldPrice) : "30");
  const [itemCost, setItemCost] = useState(link.hasLink ? String(link.sale.itemCost) : "10");
  const [shippingReceived, setShippingReceived] = useState(link.hasLink ? String(link.sale.shippingCharged) : "0");
  const [shippingCost, setShippingCost] = useState(link.hasLink ? String(link.sale.shippingCost) : "0");
  const [quantity, setQuantity] = useState(link.hasLink ? String(link.sale.quantity) : "1");
  const [sellerRoute, setSellerRoute] = useState<VintedSellerRoute>(link.hasLink ? (link.sale.sellerType === "PRIVATE" ? "PRIVATE" : "PRO") : "PRIVATE");
  const [boughtVisibility, setBoughtVisibility] = useState(link.hasSettings && !!link.config.visibilityServiceCost);
  const [visibilityCost, setVisibilityCost] = useState(link.hasSettings && link.config.visibilityServiceCost ? String(link.config.visibilityServiceCost) : "");

  const sold = parseNonNegativeAmount(soldPrice, "Selling price");
  const cost = parseNonNegativeAmount(itemCost, "Item cost");
  const received = parseNonNegativeAmount(shippingReceived, "Delivery received");
  const shipping = parseNonNegativeAmount(shippingCost, "Delivery you paid");
  const qty = parsePositiveWholeQuantity(quantity);
  const visibility = boughtVisibility
    ? parseRequiredPositiveAmount(visibilityCost, "Bump or Showcase amount")
    : ({ ok: true, value: 0 } as const);

  const hasErrors = [sold, cost, received, shipping, qty, visibility].some((r) => !r.ok);
  const { calculated, showErrors, calculate, err, resultRef } = useCalculatorFlow(hasErrors, link.hasLink);

  let result: CalculationResult | null = null;
  let pricing: PricingContext | null = null;
  let engineError: string | null = null;
  if (!hasErrors) {
    pricing = {
      platform: "VINTED",
      scenario: {
        soldPrice: valueOf(sold, 0),
        itemCost: valueOf(cost, 0),
        shippingCharged: valueOf(received, 0),
        shippingCost: valueOf(shipping, 0),
        quantity: valueOf(qty, 1),
        vatProfile: null,
      },
      config: {
        sellerRoute,
        visibilityServiceCost: boughtVisibility && visibility.ok ? visibility.value : null,
      },
    };
    try {
      result = calculateMarketplace(pricing.platform, pricing.scenario, pricing.config);
    } catch (error) {
      engineError = error instanceof Error ? error.message : "Something went wrong with this calculation.";
    }
  }

  return (
    <CalculatorPage hero={<CalculatorHero marketplace="Vinted" title="Vinted fee calculator" intro="Vinted charges sellers no selling fee. Calculate your net profit after costs." />}>

      <CalculatorLayout
        onCalculate={calculate}
        showErrorSummary={showErrors && hasErrors}
        form={
          <>
            <Step number={1} title="Your sale" intro="What you sold it for and what it cost you.">
              <SaleFields
                deliveryLabels={{ charged: ["Delivery received", "normally £0"], cost: ["Delivery you paid", "normally £0"] }}
                values={{ soldPrice, itemCost, shippingCharged: shippingReceived, shippingCost, quantity }}
                setters={{ soldPrice: setSoldPrice, itemCost: setItemCost, shippingCharged: setShippingReceived, shippingCost: setShippingCost, quantity: setQuantity }}
                errors={{ soldPrice: err(errorOf(sold)), itemCost: err(errorOf(cost)), shippingCharged: err(errorOf(received)), shippingCost: err(errorOf(shipping)), quantity: err(errorOf(qty)) }}
              />
              <p className="calc-fine">With Vinted's prepaid labels the buyer pays for delivery, so both are usually £0.</p>
            </Step>

            <Step number={2} title="Your seller account" intro="Private and Pro sellers are treated differently for tax.">
              <OptionCards
                label="Seller type"
                heading="Seller type"
                info={TIPS.vinted.sellerType}
                value={sellerRoute}
                onChange={setSellerRoute}
                options={[
                  { value: "PRIVATE", title: "Private seller", detail: "Selling your own things" },
                  { value: "PRO", title: "Pro seller", detail: "Registered Vinted Pro business" },
                ]}
              />
              {sellerRoute === "PRO" && (
                <Note>
                  Pro sellers must list at prices that already include any VAT. This calculator doesn't work out VAT or the second-hand margin scheme on your sale.
                </Note>
              )}
            </Step>

            <Step number={3} title="Promotion" intro="Only if you paid to boost this item.">
              <Toggle
                checked={boughtVisibility}
                onChange={setBoughtVisibility}
                title="I paid for a Bump or Showcase"
                info={TIPS.vinted.bump}
                detail="Vinted shows the price at checkout, so enter what you actually paid."
              />
              {boughtVisibility && (
                <MoneyField label="Amount paid" note="including VAT" placeholder="e.g. 1.95" value={visibilityCost} onChange={setVisibilityCost} error={err(errorOf(visibility))} />
              )}
            </Step>
          </>
        }
        result={<ResultPanel platform="Vinted" result={result} pricing={pricing} calculated={calculated} errorMessage={engineError} onCalculate={calculate} resultRef={resultRef} />}
      />

      <CalculatorFootnote checkedOn={VINTED_ZERO_SELLING_FEE_SOURCE.verifiedAt} sourceUrl={VINTED_ZERO_SELLING_FEE_SOURCE.url} sourceName="Vinted UK: how it works" />
    </CalculatorPage>
  );
}
