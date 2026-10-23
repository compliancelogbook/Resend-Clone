/**
 * Shopify fee calculator. All maths comes from the verified engine in
 * lib/engines/shopify.ts (copied unchanged from the old EasyFeezy repo);
 * this file only collects inputs and presents the result.
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
  Segmented,
  Step,
  TextField,
  Toggle,
  useCalculatorFlow,
} from "@/components/calculator/CalculatorParts";
import type { ShopifyCardType } from "@/lib/engines/shopify";
import { calculateMarketplace } from "@/lib/compare/adapters";
import { readCalculatorLink } from "@/lib/compare/compare-state";
import { SHOPIFY_PLANS, SHOPIFY_SOURCE, type ShopifyPaymentProcessor, type ShopifyPlan } from "@/data/shopify.fees";
import type { CalculationResult } from "@/lib/types";
import {
  parseNonNegativeAmount,
  parseOptionalPositiveInteger,
  parsePositiveWholeQuantity,
  parseRequiredProcessorFixedFee,
  parseRequiredProcessorPercent,
  type ValidationResult,
} from "@/lib/validation";

const errorOf = <T,>(r: ValidationResult<T>) => (r.ok ? undefined : r.error);
const valueOf = <T,>(r: ValidationResult<T>, fallback: T) => (r.ok ? r.value : fallback);

const PAYMENT_OPTIONS: { value: ShopifyPaymentProcessor; title: string; extra: string }[] = [
  { value: "SHOPIFY_PAYMENTS", title: "Shopify Payments", extra: "Shopify's built-in payments" },
  { value: "PAYPAL_WITH_SHOPIFY_PAYMENTS", title: "PayPal", extra: "Shopify Payments is your main provider" },
  { value: "PAYPAL_WITHOUT_SHOPIFY_PAYMENTS", title: "PayPal", extra: "Shopify Payments isn't your main provider" },
  { value: "THIRD_PARTY", title: "Another provider", extra: "Any other payment provider" },
];

export default function ShopifyCalculator() {
  // Opened from Compare (or a shared link)? Start from those figures instead of the defaults.
  const [link] = useState(() => readCalculatorLink(window.location.search, "SHOPIFY"));
  const pct = (n: number | null | undefined) => (n ? String(+(n * 100).toFixed(4)) : "");
  useEffect(() => {
    document.title = "Shopify fee calculator · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [soldPrice, setSoldPrice] = useState(link.hasLink ? String(link.sale.soldPrice) : "30");
  const [itemCost, setItemCost] = useState(link.hasLink ? String(link.sale.itemCost) : "10");
  const [shippingCharged, setShippingCharged] = useState(link.hasLink ? String(link.sale.shippingCharged) : "0");
  const [shippingCost, setShippingCost] = useState(link.hasLink ? String(link.sale.shippingCost) : "0");
  const [quantity, setQuantity] = useState(link.hasLink ? String(link.sale.quantity) : "1");
  const [plan, setPlan] = useState<ShopifyPlan>(link.hasSettings ? link.config.plan : "BASIC");
  const [processor, setProcessor] = useState<ShopifyPaymentProcessor>(link.hasSettings ? link.config.processor : "SHOPIFY_PAYMENTS");
  const [cardType, setCardType] = useState<ShopifyCardType>(link.hasSettings ? link.config.cardType : "STANDARD");
  const [includePlanCost, setIncludePlanCost] = useState(link.hasSettings && !!link.config.expectedMonthlyOrders);
  const [monthlyOrders, setMonthlyOrders] = useState(link.hasSettings && link.config.expectedMonthlyOrders ? String(link.config.expectedMonthlyOrders) : "");
  const [useOwnRate, setUseOwnRate] = useState(link.hasSettings && !!link.config.thirdPartyProcessor);
  const [ownRate, setOwnRate] = useState(link.hasSettings ? pct(link.config.thirdPartyProcessor?.rate) : "");
  const [ownFixed, setOwnFixed] = useState(link.hasSettings && link.config.thirdPartyProcessor ? String(link.config.thirdPartyProcessor.fixed) : "");

  const sold = parseNonNegativeAmount(soldPrice, "Selling price");
  const cost = parseNonNegativeAmount(itemCost, "Item cost");
  const charged = parseNonNegativeAmount(shippingCharged, "Delivery charged");
  const shipping = parseNonNegativeAmount(shippingCost, "Delivery cost");
  const qty = parsePositiveWholeQuantity(quantity);
  const monthly = includePlanCost ? parseOptionalPositiveInteger(monthlyOrders, "Orders per month") : { ok: true as const, value: null };
  const planOrdersMissing = includePlanCost && monthlyOrders.trim() === "";
  const rate = parseRequiredProcessorPercent(ownRate);
  const fixed = parseRequiredProcessorFixedFee(ownFixed);

  const ownRateActive = processor !== "SHOPIFY_PAYMENTS" && useOwnRate;
  const ownRateValid = ownRateActive && rate.ok && fixed.ok;
  const hasErrors =
    [sold, cost, charged, shipping, qty, monthly].some((r) => !r.ok) || planOrdersMissing || (ownRateActive && !ownRateValid);

  const { calculated, showErrors, calculate, err, resultRef } = useCalculatorFlow(hasErrors, link.hasLink);

  let result: CalculationResult | null = null;
  let pricing: PricingContext | null = null;
  let engineError: string | null = null;
  if (!hasErrors) {
    pricing = {
      platform: "SHOPIFY",
      scenario: {
        soldPrice: valueOf(sold, 0),
        itemCost: valueOf(cost, 0),
        shippingCharged: valueOf(charged, 0),
        shippingCost: valueOf(shipping, 0),
        quantity: valueOf(qty, 1),
        vatProfile: null,
      },
      config: {
        plan,
        processor,
        cardType,
        thirdPartyProcessor: ownRateValid ? { rate: valueOf(rate, 0), fixed: valueOf(fixed, 0) } : null,
        expectedMonthlyOrders: valueOf(monthly, null),
      },
    };
    try {
      result = calculateMarketplace(pricing.platform, pricing.scenario, pricing.config);
    } catch (error) {
      engineError = error instanceof Error ? error.message : "Something went wrong with this calculation.";
    }
  }

  return (
    <CalculatorPage hero={<CalculatorHero marketplace="Shopify" title="Shopify fee calculator" intro="Calculate Shopify fees and net profit on any sale." />}>

      <CalculatorLayout
        onCalculate={calculate}
        showErrorSummary={showErrors && hasErrors}
        form={
          <>
            <Step number={1} title="Your sale" intro="What the buyer paid and what it cost you.">
              <SaleFields
                values={{ soldPrice, itemCost, shippingCharged, shippingCost, quantity }}
                setters={{ soldPrice: setSoldPrice, itemCost: setItemCost, shippingCharged: setShippingCharged, shippingCost: setShippingCost, quantity: setQuantity }}
                errors={{ soldPrice: err(errorOf(sold)), itemCost: err(errorOf(cost)), shippingCharged: err(errorOf(charged)), shippingCost: err(errorOf(shipping)), quantity: err(errorOf(qty)) }}
              />
            </Step>

            <Step number={2} title="Your Shopify plan" intro="Card rates go down on bigger plans.">
              <OptionCards
                label="Shopify plan"
                heading="Plan"
                info={TIPS.shopify.plan}
                value={plan}
                onChange={setPlan}
                columns={3}
                options={(Object.keys(SHOPIFY_PLANS) as ShopifyPlan[]).map((id) => {
                  const p = SHOPIFY_PLANS[id];
                  return { value: id, title: p.label, detail: `£${p.monthlySubscription} a month`, extra: `Cards from ${(p.standardCard.rate * 100).toFixed(1)}% + ${Math.round(p.standardCard.fixed * 100)}p` };
                })}
              />
              <Toggle checked={includePlanCost} onChange={setIncludePlanCost} title="Include my plan cost" info={TIPS.shopify.planCost} detail="Shares your monthly plan fee across your orders." />
              {includePlanCost && (
                <TextField
                  label="Orders per month"
                  placeholder="e.g. 100"
                  value={monthlyOrders}
                  onChange={setMonthlyOrders}
                  error={err(planOrdersMissing ? "Enter roughly how many orders you get a month." : errorOf(monthly))}
                  inputMode="numeric"
                />
              )}
            </Step>

            <Step number={3} title="How the buyer paid" intro="This decides which payment fees apply.">
              <OptionCards label="Payment method" heading="Payment method" info={TIPS.shopify.payment} value={processor} onChange={setProcessor} options={PAYMENT_OPTIONS} />

              {processor === "SHOPIFY_PAYMENTS" && (
                <Segmented
                  label="Card used"
                  info={TIPS.shopify.card}
                  value={cardType}
                  onChange={setCardType}
                  options={[
                    { value: "STANDARD", label: "UK card" },
                    { value: "INTERNATIONAL_AMEX", label: "International or Amex" },
                  ]}
                />
              )}

              {processor.startsWith("PAYPAL_") && (
                <Note>Shopify only drops its extra fee on PayPal orders when Shopify Payments is your main provider. PayPal charges its own fee on top.</Note>
              )}

              {processor !== "SHOPIFY_PAYMENTS" && (
                <>
                  <Toggle checked={useOwnRate} onChange={setUseOwnRate} title="Add your provider's fee" detail="We don't guess other providers' rates. Enter yours to include it." />
                  {useOwnRate && (
                    <div className="calc-grid">
                      <TextField label="Percentage fee" suffix="%" placeholder="e.g. 2.9" value={ownRate} onChange={setOwnRate} error={ownRateActive ? err(errorOf(rate)) : undefined} />
                      <MoneyField label="Fixed fee" note="per order" placeholder="e.g. 0.30" value={ownFixed} onChange={setOwnFixed} error={ownRateActive ? err(errorOf(fixed)) : undefined} />
                    </div>
                  )}
                </>
              )}
            </Step>
          </>
        }
        result={<ResultPanel platform="Shopify" result={result} pricing={pricing} calculated={calculated} errorMessage={engineError} onCalculate={calculate} resultRef={resultRef} />}
      />

      <CalculatorFootnote checkedOn={SHOPIFY_SOURCE.verifiedAt} sourceUrl={SHOPIFY_SOURCE.url} sourceName="Shopify UK pricing" />
    </CalculatorPage>
  );
}
