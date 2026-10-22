/**
 * Etsy UK fee calculator. All maths comes from the verified engine in
 * lib/engines/etsy.ts (copied unchanged from the old EasyFeezy repo);
 * this file only collects inputs and presents the result.
 */
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { TIPS } from "@/lib/info-tips";
import {
  CalculatorFootnote,
  CalculatorHero,
  CalculatorLayout,
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
import { calculateMarketplace } from "@/lib/compare/adapters";
import { readCalculatorLink } from "@/lib/compare/compare-state";
import { DEFAULT_USD_TO_GBP_RATE, ETSY_OFFSITE_ADS_CAP_USD, ETSY_SOURCES, type EtsyOffsiteAdsRate } from "@/data/etsy.fees";
import type { VatProfile } from "@/data/vat";
import type { CalculationResult } from "@/lib/types";
import {
  parseNonNegativeAmount,
  parsePositiveFxRate,
  parsePositiveWholeQuantity,
  type ValidationResult,
} from "@/lib/validation";

const errorOf = <T,>(r: ValidationResult<T>) => (r.ok ? undefined : r.error);
const valueOf = <T,>(r: ValidationResult<T>, fallback: T) => (r.ok ? r.value : fallback);

type OffsiteAdsChoice = "NONE" | "0.15" | "0.12";

export default function EtsyCalculator() {
  // Opened from Compare (or a shared link)? Start from those figures instead of the defaults.
  const [link] = useState(() => readCalculatorLink(window.location.search, "ETSY"));
  const pct = (n: number | null | undefined) => (n ? String(+(n * 100).toFixed(4)) : "");
  useEffect(() => {
    document.title = "Etsy fee calculator · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [soldPrice, setSoldPrice] = useState(link.hasLink ? String(link.sale.soldPrice) : "30");
  const [itemCost, setItemCost] = useState(link.hasLink ? String(link.sale.itemCost) : "10");
  const [shippingCharged, setShippingCharged] = useState(link.hasLink ? String(link.sale.shippingCharged) : "0");
  const [shippingCost, setShippingCost] = useState(link.hasLink ? String(link.sale.shippingCost) : "0");
  const [quantity, setQuantity] = useState(link.hasLink ? String(link.sale.quantity) : "1");
  const [offsiteAds, setOffsiteAds] = useState<OffsiteAdsChoice>(link.hasSettings && link.config.offsiteAdsRate ? (String(link.config.offsiteAdsRate) as OffsiteAdsChoice) : "NONE");
  const [currencyConversion, setCurrencyConversion] = useState(link.hasSettings && link.config.currencyConversionSelected);
  const [vatProfile, setVatProfile] = useState<VatProfile>(link.hasLink ? link.sale.vatProfile : "NOT_REGISTERED");
  const [vatIdGiven, setVatIdGiven] = useState(link.hasSettings ? link.config.vatIdSupplied : true);
  const [fxRate, setFxRate] = useState(String(link.hasSettings && link.config.usdToGbpRate ? link.config.usdToGbpRate : DEFAULT_USD_TO_GBP_RATE));

  const sold = parseNonNegativeAmount(soldPrice, "Selling price");
  const cost = parseNonNegativeAmount(itemCost, "Item cost");
  const charged = parseNonNegativeAmount(shippingCharged, "Delivery charged");
  const shipping = parseNonNegativeAmount(shippingCost, "Delivery cost");
  const qty = parsePositiveWholeQuantity(quantity);
  const fx = parsePositiveFxRate(fxRate);

  // Only a VAT-registered seller can give Etsy a VAT number.
  const vatIdSupplied = vatProfile === "REGISTERED" && vatIdGiven;

  const hasErrors = [sold, cost, charged, shipping, qty, fx].some((r) => !r.ok);
  const { calculated, showErrors, calculate, err, resultRef } = useCalculatorFlow(hasErrors, link.hasLink);

  let result: CalculationResult | null = null;
  let pricing: PricingContext | null = null;
  let engineError: string | null = null;
  if (!hasErrors) {
    pricing = {
      platform: "ETSY",
      scenario: {
        soldPrice: valueOf(sold, 0),
        itemCost: valueOf(cost, 0),
        shippingCharged: valueOf(charged, 0),
        shippingCost: valueOf(shipping, 0),
        quantity: valueOf(qty, 1),
        vatProfile,
      },
      config: {
        currencyConversionSelected: currencyConversion,
        offsiteAdsRate: offsiteAds === "NONE" ? null : (Number(offsiteAds) as EtsyOffsiteAdsRate),
        vatIdSupplied,
        usdToGbpRate: valueOf(fx, null),
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
      <CalculatorHero marketplace="Etsy" title="Etsy fee calculator" intro="Calculate Etsy fees and net profit on any sale, for UK sellers." />

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

            <Step number={2} title="How the sale happened" intro="Some sales carry extra Etsy fees.">
              <OptionCards
                label="Offsite Ads"
                heading="Offsite Ads"
                info={TIPS.etsy.offsiteAds}
                value={offsiteAds}
                onChange={setOffsiteAds}
                columns={3}
                options={[
                  { value: "NONE", title: "No Offsite Ads", detail: "Buyer didn't come from an Etsy ad" },
                  { value: "0.15", title: "Offsite Ads 15%", detail: "Standard rate" },
                  { value: "0.12", title: "Offsite Ads 12%", detail: "Reduced rate for eligible shops" },
                ]}
              />
              {offsiteAds !== "NONE" && (
                <p className="calc-fine">Etsy caps the Offsite Ads fee at US${ETSY_OFFSITE_ADS_CAP_USD} per order. We apply the cap for you.</p>
              )}
              <Toggle
                checked={currencyConversion}
                onChange={setCurrencyConversion}
                title="Etsy converted the currency"
                info={TIPS.etsy.currency}
                detail="Adds Etsy's 2.5% conversion fee. Only applies if your listing currency differs from your payment account currency."
              />
            </Step>

            <Step number={3} title="Your seller account" intro="VAT changes what Etsy charges on its fees.">
              <Segmented
                label="VAT"
                info={TIPS.etsy.vat}
                value={vatProfile}
                onChange={setVatProfile}
                options={[
                  { value: "NOT_REGISTERED", label: "Not VAT registered" },
                  { value: "REGISTERED", label: "VAT registered" },
                ]}
              />
              {vatProfile === "REGISTERED" ? (
                <Toggle
                  checked={vatIdGiven}
                  onChange={setVatIdGiven}
                  title="I've given Etsy my VAT number"
                  info={TIPS.etsy.vatNumber}
                  detail="Etsy then doesn't add VAT to its fees. Without it, Etsy adds 20%."
                />
              ) : (
                <p className="calc-fine">Etsy adds 20% VAT to its fees for sellers without a VAT number.</p>
              )}
              <TextField
                label="US dollar to pound rate"
                info={TIPS.etsy.fx}
                note="Etsy's 20¢ listing fee is charged in dollars"
                placeholder="e.g. 0.75"
                value={fxRate}
                onChange={setFxRate}
                error={err(errorOf(fx))}
              />
            </Step>
          </>
        }
        result={<ResultPanel platform="Etsy" result={result} pricing={pricing} calculated={calculated} errorMessage={engineError} onCalculate={calculate} resultRef={resultRef} />}
      />

      <CalculatorFootnote checkedOn={ETSY_SOURCES.feesAndTaxes.verifiedAt} sourceUrl={ETSY_SOURCES.feesAndTaxes.url} sourceName="Etsy's fees and taxes" />
      <SiteFooter />
    </main>
  );
}
