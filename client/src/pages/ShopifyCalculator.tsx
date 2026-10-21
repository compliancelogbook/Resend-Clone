/**
 * Shopify fee calculator. All maths comes from the verified engine in
 * lib/engines/shopify.ts (copied unchanged from the old EasyFeezy repo);
 * this file only collects inputs and presents the result.
 */
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Minus, Plus } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CALCULATOR_LINKS } from "@/lib/calculator-links";
import { CALCULATION_DISCLAIMER } from "@/lib/calculation-disclaimer";
import { calculateShopify, type ShopifyCardType } from "@/lib/engines/shopify";
import { SHOPIFY_PLANS, SHOPIFY_SOURCE, type ShopifyPaymentProcessor, type ShopifyPlan } from "@/data/shopify.fees";
import { formatGBP } from "@/lib/format";
import type { CalculationResult, ConfidenceLevel } from "@/lib/types";
import {
  parseNonNegativeAmount,
  parseOptionalPositiveInteger,
  parsePositiveWholeQuantity,
  parseRequiredProcessorFixedFee,
  parseRequiredProcessorPercent,
  type ValidationResult,
} from "@/lib/validation";
import "./calculator.css";

const errorOf = <T,>(r: ValidationResult<T>) => (r.ok ? undefined : r.error);
const valueOf = <T,>(r: ValidationResult<T>, fallback: T) => (r.ok ? r.value : fallback);
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

// Plain-English labels for the engine's confidence levels.
const CONFIDENCE: Record<ConfidenceLevel, { label: string; tone: string }> = {
  EXACT_FOR_SELECTED_INPUTS: { label: "Exact for these figures", tone: "good" },
  ASSUMPTION_DEPENDENT: { label: "Uses your own rates", tone: "warn" },
  EXCLUDES_VARIABLE_FEES: { label: "Some costs not included", tone: "warn" },
};

const PAYMENT_OPTIONS: { value: ShopifyPaymentProcessor; title: string; detail: string }[] = [
  { value: "SHOPIFY_PAYMENTS", title: "Shopify Payments", detail: "Shopify's built-in payments" },
  { value: "PAYPAL_WITH_SHOPIFY_PAYMENTS", title: "PayPal", detail: "Shopify Payments is your main provider" },
  { value: "PAYPAL_WITHOUT_SHOPIFY_PAYMENTS", title: "PayPal", detail: "Shopify Payments isn't your main provider" },
  { value: "THIRD_PARTY", title: "Another provider", detail: "Any other payment provider" },
];

export default function ShopifyCalculator() {
  useEffect(() => {
    document.title = "Shopify fee calculator · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [soldPrice, setSoldPrice] = useState("30");
  const [itemCost, setItemCost] = useState("10");
  const [shippingCharged, setShippingCharged] = useState("0");
  const [shippingCost, setShippingCost] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [plan, setPlan] = useState<ShopifyPlan>("BASIC");
  const [processor, setProcessor] = useState<ShopifyPaymentProcessor>("SHOPIFY_PAYMENTS");
  const [cardType, setCardType] = useState<ShopifyCardType>("STANDARD");
  const [includePlanCost, setIncludePlanCost] = useState(false);
  const [monthlyOrders, setMonthlyOrders] = useState("");
  const [useOwnRate, setUseOwnRate] = useState(false);
  const [ownRate, setOwnRate] = useState("");
  const [ownFixed, setOwnFixed] = useState("");
  // The result appears after the first press of "Calculate profit", then stays live.
  const [calculated, setCalculated] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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

  let result: CalculationResult | null = null;
  let engineError: string | null = null;
  if (!hasErrors) {
    try {
      result = calculateShopify({
        soldPrice: valueOf(sold, 0),
        itemCost: valueOf(cost, 0),
        shippingCharged: valueOf(charged, 0),
        shippingCost: valueOf(shipping, 0),
        quantity: valueOf(qty, 1),
        plan,
        processor,
        cardType,
        thirdPartyProcessor: ownRateValid ? { rate: valueOf(rate, 0), fixed: valueOf(fixed, 0) } : null,
        expectedMonthlyOrders: valueOf(monthly, null),
      });
    } catch (error) {
      engineError = error instanceof Error ? error.message : "Something went wrong with this calculation.";
    }
  }

  // Errors only show once the person has tried to calculate, so the form doesn't shout while they type.
  const err = (message: string | undefined) => (showErrors || calculated ? message : undefined);

  function handleCalculate() {
    setShowErrors(true);
    if (hasErrors) return;
    setCalculated(true);
    if (window.matchMedia("(max-width: 960px)").matches) {
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }

  function stepQuantity(delta: number) {
    const current = Number.parseInt(quantity, 10);
    const next = Number.isFinite(current) ? Math.max(1, current + delta) : 1;
    setQuantity(String(next));
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="calc-hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="calc-pill">Free · No sign-up</span>
          <h1>Shopify fee calculator</h1>
          <p>Find out what Shopify takes from a sale and what you keep.</p>
        </motion.div>
        <nav className="calc-switcher" aria-label="Choose a marketplace">
          {CALCULATOR_LINKS.map((calc) =>
            calc.href ? (
              <Link key={calc.name} href={calc.href} className={calc.name === "Shopify" ? "active" : ""} aria-current={calc.name === "Shopify" ? "page" : undefined}>
                {calc.name}
              </Link>
            ) : (
              <span key={calc.name} className="soon" aria-disabled="true">{calc.name}<em>Soon</em></span>
            ),
          )}
        </nav>
      </section>

      <section className="calc-layout" aria-label="Shopify calculator">
        <form
          className="calc-form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleCalculate();
          }}
        >
          <Step number={1} title="Your sale" intro="What the buyer paid and what it cost you.">
            <div className="calc-grid">
              <MoneyField label="Selling price" note="each" value={soldPrice} onChange={setSoldPrice} error={err(errorOf(sold))} />
              <MoneyField label="Item cost" note="each" value={itemCost} onChange={setItemCost} error={err(errorOf(cost))} />
              <MoneyField label="Delivery charged" note="to the buyer" value={shippingCharged} onChange={setShippingCharged} error={err(errorOf(charged))} />
              <MoneyField label="Delivery cost" note="what you paid" value={shippingCost} onChange={setShippingCost} error={err(errorOf(shipping))} />
            </div>
            <QuantityField value={quantity} onChange={setQuantity} onStep={stepQuantity} error={err(errorOf(qty))} />
          </Step>

          <Step number={2} title="Your Shopify plan" intro="Card rates go down on bigger plans.">
            <div className="calc-plans" role="radiogroup" aria-label="Shopify plan">
              {(Object.keys(SHOPIFY_PLANS) as ShopifyPlan[]).map((id) => {
                const p = SHOPIFY_PLANS[id];
                return (
                  <button key={id} type="button" role="radio" aria-checked={plan === id} className={`calc-option ${plan === id ? "active" : ""}`} onClick={() => setPlan(id)}>
                    <b>{p.label}</b>
                    <span>£{p.monthlySubscription} a month</span>
                    <small>Cards from {(p.standardCard.rate * 100).toFixed(1)}% + {Math.round(p.standardCard.fixed * 100)}p</small>
                  </button>
                );
              })}
            </div>
            <label className="calc-toggle">
              <input type="checkbox" checked={includePlanCost} onChange={(e) => setIncludePlanCost(e.target.checked)} />
              <span>
                <b>Include my plan cost</b>
                <small>Shares your monthly plan fee across your orders.</small>
              </span>
            </label>
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
            <div className="calc-payments" role="radiogroup" aria-label="Payment method">
              {PAYMENT_OPTIONS.map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={processor === o.value} className={`calc-option ${processor === o.value ? "active" : ""}`} onClick={() => setProcessor(o.value)}>
                  <b>{o.title}</b>
                  <small>{o.detail}</small>
                </button>
              ))}
            </div>

            {processor === "SHOPIFY_PAYMENTS" && (
              <div className="calc-field">
                <span className="calc-label">Card used</span>
                <div className="calc-segmented" role="radiogroup" aria-label="Card used">
                  {([["STANDARD", "UK card"], ["INTERNATIONAL_AMEX", "International or Amex"]] as [ShopifyCardType, string][]).map(([value, label]) => (
                    <button key={value} type="button" role="radio" aria-checked={cardType === value} className={cardType === value ? "active" : ""} onClick={() => setCardType(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {processor.startsWith("PAYPAL_") && (
              <p className="calc-note">
                Shopify only drops its extra fee on PayPal orders when Shopify Payments is your main provider. PayPal charges its own fee on top.
              </p>
            )}

            {processor !== "SHOPIFY_PAYMENTS" && (
              <>
                <label className="calc-toggle">
                  <input type="checkbox" checked={useOwnRate} onChange={(e) => setUseOwnRate(e.target.checked)} />
                  <span>
                    <b>Add your provider's fee</b>
                    <small>We don't guess other providers' rates. Enter yours to include it.</small>
                  </span>
                </label>
                {useOwnRate && (
                  <div className="calc-grid">
                    <TextField label="Percentage fee" suffix="%" placeholder="e.g. 2.9" value={ownRate} onChange={setOwnRate} error={ownRateActive ? err(errorOf(rate)) : undefined} />
                    <MoneyField label="Fixed fee" note="per order" placeholder="e.g. 0.30" value={ownFixed} onChange={setOwnFixed} error={ownRateActive ? err(errorOf(fixed)) : undefined} />
                  </div>
                )}
              </>
            )}
          </Step>

          <div className="calc-submit">
            <button type="submit" className="calc-cta">
              Calculate profit <ArrowRight size={18} />
            </button>
            {showErrors && hasErrors && <p role="alert">Check the highlighted fields.</p>}
          </div>
        </form>

        <aside className="calc-aside" aria-label="Your result" ref={resultRef}>
          <div className="calc-result">
            <AnimatePresence mode="wait">
              {calculated && result ? (
                <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }}>
                  <ResultView result={result} />
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                  <EmptyResult
                    message={calculated ? engineError ?? "Check the highlighted fields to update your result." : null}
                    onCalculate={handleCalculate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </section>

      <section className="calc-footnote">
        <p>
          Shopify rates checked {formatDate(SHOPIFY_SOURCE.verifiedAt)} against{" "}
          <a href={SHOPIFY_SOURCE.url} target="_blank" rel="noreferrer">Shopify UK pricing <ArrowUpRight size={13} /></a>.
        </p>
        <p>{CALCULATION_DISCLAIMER}</p>
      </section>

      <SiteFooter />
    </main>
  );
}

function Step({ number, title, intro, children }: { number: number; title: string; intro: string; children: ReactNode }) {
  const id = useId();
  return (
    <section className="calc-step" aria-labelledby={id}>
      <header>
        <span className="calc-step-number" aria-hidden="true">{number}</span>
        <div>
          <h2 id={id}>{title}</h2>
          <p>{intro}</p>
        </div>
      </header>
      <div className="calc-step-body">{children}</div>
    </section>
  );
}

function EmptyResult({ message, onCalculate }: { message: string | null; onCalculate: () => void }) {
  return (
    <div className="calc-empty">
      <p className="calc-eyebrow">Your profit</p>
      <p className="calc-empty-figure" aria-hidden="true">£–</p>
      <div className="calc-bar is-ghost" aria-hidden="true"><i /><i /><i /><i /></div>
      <p className="calc-empty-copy" role="status">
        {message ?? (
          <>
            Fill in your sale, then press <b>Calculate profit</b> to see what Shopify takes and what you keep.
          </>
        )}
      </p>
      <button type="button" className="calc-cta calc-cta-panel" onClick={onCalculate}>
        Calculate profit <ArrowRight size={18} />
      </button>
    </div>
  );
}

function ResultView({ result }: { result: CalculationResult }) {
  const confidence = CONFIDENCE[result.confidence];
  const profit = result.estimatedProfit;
  const positive = profit >= 0;

  // Where the buyer's money goes. Scale to whichever is larger: what came in, or what went out.
  const segments = [
    { key: "cost", label: "Item cost", amount: result.cogs },
    { key: "delivery", label: "Delivery", amount: result.shippingCost },
    { key: "fees", label: "Shopify fees", amount: result.totalCashFees },
    { key: "profit", label: "Your profit", amount: Math.max(profit, 0) },
  ];
  const scale = Math.max(result.grossRevenue, result.cogs + result.shippingCost + result.totalCashFees) || 1;
  const feeShare = result.grossRevenue > 0 ? (result.totalCashFees / result.grossRevenue) * 100 : null;

  return (
    <div className="calc-result-body">
      <div className="calc-result-top">
        <p className="calc-eyebrow">Your profit</p>
        <span className={`calc-chip ${confidence.tone}`}>{confidence.label}</span>
      </div>
      <p className={`calc-profit ${positive ? "" : "negative"}`} aria-live="polite" aria-atomic="true">
        {formatGBP(profit)}
      </p>
      <p className="calc-summary">
        On a {formatGBP(result.grossRevenue)} sale, Shopify takes <b>{formatGBP(result.totalCashFees)}</b>
        {feeShare !== null && <> ({feeShare.toFixed(1)}%)</>}.{" "}
        {positive ? "After your costs, that's what you keep." : "After your costs, this sale loses money."}
      </p>

      <div className="calc-bar" role="img" aria-label={segments.map((s) => `${s.label} ${formatGBP(s.amount)}`).join(", ")}>
        {segments.map((s) =>
          s.amount > 0 ? <i key={s.key} className={`seg-${s.key}`} style={{ width: `${(s.amount / scale) * 100}%` }} /> : null,
        )}
      </div>

      <dl className="calc-legend">
        <LegendRow className="seg-revenue" label="Buyer paid" value={formatGBP(result.grossRevenue)} />
        {segments.map((s) => (
          <LegendRow key={s.key} className={`seg-${s.key}`} label={s.label} value={s.key === "profit" ? formatGBP(profit) : `−${formatGBP(s.amount)}`} strong={s.key === "profit"} />
        ))}
      </dl>

      <dl className="calc-metrics">
        <div><dt>Profit margin</dt><dd>{result.marginPct === null ? "–" : `${result.marginPct.toFixed(1)}%`}</dd></div>
        <div><dt>Return on costs</dt><dd>{result.roiPct === null ? "–" : `${result.roiPct.toFixed(1)}%`}</dd></div>
      </dl>

      <details className="calc-details">
        <summary>How we worked this out</summary>
        <div className="calc-details-body">
          {result.feeLines.length > 0 && (
            <ul className="calc-fee-lines">
              {result.feeLines.map((line) => (
                <li key={line.id}>
                  <div>
                    <b>{line.label}</b>
                    <span>{line.formula}</span>
                    {line.sourceUrl && (
                      <a href={line.sourceUrl} target="_blank" rel="noreferrer">
                        Shopify source{line.verifiedAt ? `, checked ${formatDate(line.verifiedAt)}` : ""} <ArrowUpRight size={12} />
                      </a>
                    )}
                  </div>
                  <strong>{formatGBP(line.amountExVat)}</strong>
                </li>
              ))}
            </ul>
          )}
          {result.assumptions.length > 0 && (
            <>
              <p className="calc-eyebrow">Good to know</p>
              <ul className="calc-notes">{result.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
            </>
          )}
          {result.exclusions.length > 0 && (
            <>
              <p className="calc-eyebrow">Not included</p>
              <ul className="calc-notes">{result.exclusions.map((e) => <li key={e}>{e}</li>)}</ul>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

function LegendRow({ className, label, value, strong }: { className: string; label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "strong" : ""}>
      <dt><i className={className} aria-hidden="true" />{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

type FieldProps = {
  label: string;
  note?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  prefix?: string;
  suffix?: string;
};

function TextField({ label, note, value, onChange, error, placeholder, inputMode = "decimal", prefix, suffix }: FieldProps) {
  const id = useId();
  return (
    <div className={`calc-field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {note && <span className="calc-label-note"> · {note}</span>}
      </label>
      <div className="calc-input">
        {prefix && <span className="calc-affix" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {suffix && <span className="calc-affix" aria-hidden="true">{suffix}</span>}
      </div>
      {error && <small id={`${id}-error`} className="calc-error">{error}</small>}
    </div>
  );
}

function MoneyField(props: Omit<FieldProps, "prefix" | "inputMode">) {
  return <TextField {...props} prefix="£" inputMode="decimal" />;
}

function QuantityField({ value, onChange, onStep, error }: { value: string; onChange: (v: string) => void; onStep: (delta: number) => void; error?: string }) {
  const id = useId();
  return (
    <div className={`calc-field calc-quantity ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>Quantity <span className="calc-label-note"> · items in this order</span></label>
      <div className="calc-stepper">
        <button type="button" onClick={() => onStep(-1)} aria-label="One fewer"><Minus size={16} /></button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="button" onClick={() => onStep(1)} aria-label="One more"><Plus size={16} /></button>
      </div>
      {error && <small id={`${id}-error`} className="calc-error">{error}</small>}
    </div>
  );
}
