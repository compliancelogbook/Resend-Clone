/**
 * Shared building blocks for every marketplace calculator page:
 * hero, numbered steps, fields, option cards and the result panel.
 * The fee maths lives in lib/engines; nothing here calculates fees.
 */
import { createContext, type ReactNode, type RefObject, useContext, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, Info, Minus, Plus, Search } from "lucide-react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Link } from "wouter";
import { CALCULATOR_LINKS } from "@/lib/calculator-links";
import { CALCULATION_DISCLAIMER } from "@/lib/calculation-disclaimer";
import { formatGBP } from "@/lib/format";
import type { CalculationResult, ConfidenceLevel } from "@/lib/types";
import type { Platform } from "@/data/types";
import type { MarketplaceConfigMap, SharedComparisonScenario } from "@/lib/compare/adapters";
import { suggestBreakEvenPrice, suggestTargetMarginPrice } from "@/lib/optimise/price-suggestions";
import { compareHrefFromCalculator } from "@/lib/compare/compare-state";
import { partnerFor } from "@/lib/partners";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "./calculator.css";
import "./compare.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ---------- Website page or inside the dashboard ---------- */

export interface CalculatorEmbedValue {
  embedded: boolean;
  /** Dashboard only: save the current result. */
  onSave?: (summary: string) => void;
  /** Dashboard only: keep links between calculators and Compare inside the dashboard. */
  mapHref?: (href: string) => string;
}
export const CalculatorEmbed = createContext<CalculatorEmbedValue>({ embedded: false });
export const useCalculatorEmbed = () => useContext(CalculatorEmbed);

/** The website page around a calculator. Inside the dashboard, only the calculator shows. */
export function CalculatorPage({ hero, children }: { hero: ReactNode; children: ReactNode }) {
  const { embedded } = useCalculatorEmbed();
  if (embedded) return <div className="calc-embedded">{children}</div>;
  return (
    <main className="site-shell">
      <SiteHeader />
      {hero}
      {children}
      <SiteFooter />
    </main>
  );
}

/** Dashboard save button. Example only until accounts exist. */
export function SaveButton({ summary }: { summary: string }) {
  const { onSave } = useCalculatorEmbed();
  const [saved, setSaved] = useState(false);
  if (!onSave) return null;
  return (
    <button
      type="button"
      className={`calc-save ${saved ? "is-saved" : ""}`}
      onClick={() => {
        if (saved) return;
        setSaved(true);
        onSave(summary);
      }}
    >
      {saved ? <><BookmarkCheck size={15} /> Saved</> : <><Bookmark size={15} /> Save</>}
    </button>
  );
}

/* ---------- Page flow: result appears after first "Calculate", then stays live ---------- */

export function useCalculatorFlow(hasErrors: boolean, startCalculated = false) {
  // Opened from a link with figures already filled in: show the result straight away.
  const [calculated, setCalculated] = useState(startCalculated);
  const [showErrors, setShowErrors] = useState(startCalculated);
  const resultRef = useRef<HTMLDivElement>(null);

  function calculate() {
    setShowErrors(true);
    // From the first press the result is live: it appears as soon as the highlighted fields are fixed.
    setCalculated(true);
    if (hasErrors) return;
    if (window.matchMedia("(max-width: 960px)").matches) {
      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }

  // Errors only show once the person has tried to calculate, so the form doesn't shout while they type.
  const err = (message: string | undefined) => (showErrors || calculated ? message : undefined);

  return { calculated, showErrors, calculate, err, resultRef };
}

/* ---------- Page layout ---------- */

export function CalculatorHero({ marketplace, title, intro }: { marketplace: string; title: string; intro: string }) {
  return (
    <section className="calc-hero">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
        <span className="calc-pill">Free · No sign-up</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </motion.div>
      <nav className="calc-switcher" aria-label="Choose a marketplace">
        {CALCULATOR_LINKS.map((calc) =>
          calc.href ? (
            <Link key={calc.name} href={calc.href} className={calc.name === marketplace ? "active" : ""} aria-current={calc.name === marketplace ? "page" : undefined}>
              {calc.name}
            </Link>
          ) : (
            <span key={calc.name} className="soon" aria-disabled="true">{calc.name}<em>Soon</em></span>
          ),
        )}
      </nav>
    </section>
  );
}

export function CalculatorLayout({
  form,
  onCalculate,
  showErrorSummary,
  result,
}: {
  form: ReactNode;
  onCalculate: () => void;
  showErrorSummary: boolean;
  result: ReactNode;
}) {
  return (
    <section className="calc-layout" aria-label="Calculator">
      <form
        className="calc-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onCalculate();
        }}
      >
        {form}
        <div className="calc-submit">
          <button type="submit" className="calc-cta">
            Calculate profit <ArrowRight size={18} />
          </button>
          {showErrorSummary && <p role="alert">Check the highlighted fields.</p>}
        </div>
      </form>
      {result}
    </section>
  );
}

export function CalculatorFootnote({ checkedOn, sourceUrl, sourceName }: { checkedOn: string | null | undefined; sourceUrl: string; sourceName: string }) {
  return (
    <section className="calc-footnote">
      <p>
        Rates checked {formatDate(checkedOn)} against{" "}
        <a href={sourceUrl} target="_blank" rel="noreferrer">{sourceName} <ArrowUpRight size={13} /></a>.
      </p>
      <p>{CALCULATION_DISCLAIMER}</p>
    </section>
  );
}

export function Step({ number, title, intro, children }: { number: number; title: string; intro: string; children: ReactNode }) {
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

/* ---------- Fields ---------- */

/**
 * Small ⓘ that explains a choice. Opens on hover or keyboard focus on desktop,
 * and on tap on touch screens. Never toggles the control it sits next to.
 */
export function InfoTip({ label, children, trigger }: { label: string; children: ReactNode; trigger?: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={`calc-info ${trigger ? "has-text" : ""}`}
          aria-label={trigger ? undefined : `About ${label}`}
          onMouseEnter={show}
          onMouseLeave={hide}
          onFocus={show}
          onBlur={hide}
          onClick={(e) => {
            // Inside a <label> or option card: explain, don't select.
            e.preventDefault();
            e.stopPropagation();
            setOpen((o) => !o);
          }}
        >
          {trigger ? <>{trigger} <Info size={13} /></> : <Info size={14} />}
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="calc-info-pop"
          side="top"
          align="center"
          sideOffset={8}
          collisionPadding={12}
          onMouseEnter={show}
          onMouseLeave={hide}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {children}
          <PopoverPrimitive.Arrow className="calc-info-arrow" width={12} height={6} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
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
  info?: ReactNode;
};

export function TextField({ label, note, value, onChange, error, placeholder, inputMode = "decimal", prefix, suffix, info }: FieldProps) {
  const id = useId();
  return (
    <div className={`calc-field ${error ? "has-error" : ""}`}>
      <span className="calc-label-row">
        <label htmlFor={id}>
          {label}
          {note && <span className="calc-label-note"> · {note}</span>}
        </label>
        {info && <InfoTip label={label}>{info}</InfoTip>}
      </span>
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

export function MoneyField(props: Omit<FieldProps, "prefix" | "inputMode">) {
  return <TextField {...props} prefix="£" inputMode="decimal" />;
}

export function QuantityField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const id = useId();
  const step = (delta: number) => {
    const current = Number.parseInt(value, 10);
    onChange(String(Number.isFinite(current) ? Math.max(1, current + delta) : 1));
  };
  return (
    <div className={`calc-field calc-quantity ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>Quantity <span className="calc-label-note"> · items in this order</span></label>
      <div className="calc-stepper">
        <button type="button" onClick={() => step(-1)} aria-label="One fewer"><Minus size={16} /></button>
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
        <button type="button" onClick={() => step(1)} aria-label="One more"><Plus size={16} /></button>
      </div>
      {error && <small id={`${id}-error`} className="calc-error">{error}</small>}
    </div>
  );
}

/** The four fields every marketplace shares: price, cost, delivery in and out, plus quantity. */
export function SaleFields({
  values,
  setters,
  errors,
  priceNote = "each",
  deliveryLabels = { charged: ["Delivery charged", "to the buyer"], cost: ["Delivery cost", "what you paid"] },
}: {
  priceNote?: string;
  deliveryLabels?: { charged: [string, string]; cost: [string, string] };
  values: { soldPrice: string; itemCost: string; shippingCharged: string; shippingCost: string; quantity: string };
  setters: { soldPrice: (v: string) => void; itemCost: (v: string) => void; shippingCharged: (v: string) => void; shippingCost: (v: string) => void; quantity: (v: string) => void };
  errors: { soldPrice?: string; itemCost?: string; shippingCharged?: string; shippingCost?: string; quantity?: string };
}) {
  return (
    <>
      <div className="calc-grid">
        <MoneyField label="Selling price" note={priceNote} value={values.soldPrice} onChange={setters.soldPrice} error={errors.soldPrice} />
        <MoneyField label="Item cost" note="each" value={values.itemCost} onChange={setters.itemCost} error={errors.itemCost} />
        <MoneyField label={deliveryLabels.charged[0]} note={deliveryLabels.charged[1]} value={values.shippingCharged} onChange={setters.shippingCharged} error={errors.shippingCharged} />
        <MoneyField label={deliveryLabels.cost[0]} note={deliveryLabels.cost[1]} value={values.shippingCost} onChange={setters.shippingCost} error={errors.shippingCost} />
      </div>
      <QuantityField value={values.quantity} onChange={setters.quantity} error={errors.quantity} />
    </>
  );
}

export type Option<T extends string> = { value: T; title: string; detail?: string; extra?: string };

export function OptionCards<T extends string>({
  label,
  value,
  onChange,
  options,
  columns = 2,
  heading,
  info,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  columns?: 2 | 3 | 4;
  /** Optional visible label above the cards. */
  heading?: string;
  info?: ReactNode;
}) {
  const cards = (
    <div className={`calc-options cols-${columns}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`calc-option ${value === o.value ? "active" : ""}`} onClick={() => onChange(o.value)}>
          <b>{withPercent(o.title)}</b>
          {o.detail && <span>{o.detail}</span>}
          {o.extra && <small>{o.extra}</small>}
        </button>
      ))}
    </div>
  );
  if (!heading && !info) return cards;
  return (
    <div className="calc-field">
      <span className="calc-label-row">
        <span className="calc-label">{heading ?? label}</span>
        {info && <InfoTip label={heading ?? label}>{info}</InfoTip>}
      </span>
      {cards}
    </div>
  );
}

/** This font's medium-weight "%" is cramped, so draw it at regular weight. */
function withPercent(text: string) {
  const parts = text.split("%");
  return parts.map((part, i) => (i < parts.length - 1 ? <span key={i}>{part}<span className="calc-pct">%</span></span> : part));
}

export function Segmented<T extends string>({ label, value, onChange, options, info }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; info?: ReactNode }) {
  return (
    <div className="calc-field">
      <span className="calc-label-row">
        <span className="calc-label">{label}</span>
        {info && <InfoTip label={label}>{info}</InfoTip>}
      </span>
      <div className="calc-segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, title, detail, info }: { checked: boolean; onChange: (v: boolean) => void; title: string; detail: string; info?: ReactNode }) {
  return (
    <label className="calc-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <b className="calc-label-row">
          {title}
          {info && <InfoTip label={title}>{info}</InfoTip>}
        </b>
        <small>{detail}</small>
      </span>
    </label>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="calc-note">{children}</p>;
}

/** A searchable list for long option sets such as marketplace categories. */
export function SearchablePicker<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder = "Search",
  required = false,
  error,
  emptyText = "Choose one",
  info,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; title: string; detail?: string }[];
  placeholder?: string;
  /** Marks the field with * — nothing is picked for the person. */
  required?: boolean;
  error?: string;
  emptyText?: string;
  info?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => `${o.title} ${o.detail ?? ""}`.toLowerCase().includes(q)) : options;

  return (
    <div className={`calc-field ${error ? "has-error" : ""}`}>
      <span className="calc-label-row">
        <span className="calc-label">
          {label}
          {required && <span className="calc-required" aria-hidden="true"> *</span>}
          {required && <span className="sr-only"> (required)</span>}
        </span>
        {info && <InfoTip label={label}>{info}</InfoTip>}
      </span>
      {!open ? (
        <button
          type="button"
          className={`calc-picked ${selected ? "" : "is-empty"}`}
          onClick={() => setOpen(true)}
          aria-expanded={false}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
        >
          <span>
            <b>{selected?.title ?? emptyText}</b>
            {selected?.detail && <small>{selected.detail}</small>}
          </span>
          <em>{selected ? "Change" : "Choose"}</em>
        </button>
      ) : (
        <div className="calc-picker">
          <div className="calc-input">
            <Search size={16} className="calc-affix" aria-hidden="true" />
            <input
              autoFocus
              type="text"
              value={query}
              placeholder={placeholder}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[0]) {
                    onChange(filtered[0].value);
                    setOpen(false);
                    setQuery("");
                  }
                }
              }}
              aria-controls={listId}
              aria-label={`Search ${label.toLowerCase()}`}
            />
            <button type="button" className="calc-picker-close" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <ul id={listId} role="listbox" aria-label={label}>
            {filtered.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  className={o.value === value ? "active" : ""}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <b>{o.title}</b>
                  {o.detail && <small>{o.detail}</small>}
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="calc-picker-empty">No matches. Try a shorter word, or choose "Other".</li>}
          </ul>
        </div>
      )}
      {error && !open && <small className="calc-error">{error}</small>}
    </div>
  );
}

/* ---------- Result panel ---------- */

const CONFIDENCE: Record<ConfidenceLevel, { label: string; tone: string }> = {
  EXACT_FOR_SELECTED_INPUTS: { label: "Exact for these figures", tone: "good" },
  ASSUMPTION_DEPENDENT: { label: "Uses your own figures", tone: "warn" },
  EXCLUDES_VARIABLE_FEES: { label: "Some costs not included", tone: "warn" },
};

/** Short, plain names for fee lines in the main result. The full engine label stays in the details. */
const FEE_NAMES: Record<string, string> = {
  final_value_fee: "Final value fee",
  per_order_fee: "Order fee",
  regulatory_operating_fee: "Regulatory fee",
  international_fee: "International fee",
  currency_conversion_fee: "Currency conversion",
  subscription: "Plan cost",
  listing_fee: "Listing fee",
  transaction_fee: "Transaction fee",
  advertising_fee: "Offsite Ads",
  commission: "Commission",
  affiliate_commission: "Creator commission",
  other_actual_cost: "Your other TikTok costs",
  seller_platform_fee: "Selling fee",
  visibility_service: "Bump or Showcase",
};

function shortFeeName(label: string, feeType?: string) {
  if (feeType && FEE_NAMES[feeType]) return FEE_NAMES[feeType];
  return label.split(/ — | \(/)[0];
}

/** The first clause of an engine exclusion, e.g. "Shopify billing VAT is excluded from this calculation". */
function shortExclusion(text: string) {
  return text.split(/ — /)[0].replace(/\.$/, "");
}

/** What the page needs to re-run the engine at other prices (break-even and target margin). */
export type PricingContext = {
  [P in Platform]: { platform: P; scenario: SharedComparisonScenario; config: MarketplaceConfigMap[P] };
}[Platform];

export function ResultPanel({
  platform,
  result,
  pricing,
  calculated,
  errorMessage,
  onCalculate,
  resultRef,
}: {
  platform: string;
  result: CalculationResult | null;
  pricing: PricingContext | null;
  calculated: boolean;
  errorMessage: string | null;
  onCalculate: () => void;
  resultRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <aside className="calc-aside" aria-label="Your result" ref={resultRef}>
      <div className="calc-result">
        <AnimatePresence mode="wait">
          {calculated && result && pricing ? (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease }}>
              <ResultView platform={platform} result={result} pricing={pricing} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <EmptyResult
                platform={platform}
                message={calculated ? errorMessage ?? "Fill in the highlighted fields (marked * if required) and your result will appear here." : null}
                onCalculate={onCalculate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}

function EmptyResult({ platform, message, onCalculate }: { platform: string; message: string | null; onCalculate: () => void }) {
  return (
    <div className="calc-empty">
      <p className="calc-eyebrow">Net profit</p>
      <p className="calc-empty-figure" aria-hidden="true">£–</p>
      <div className="calc-bar is-ghost" aria-hidden="true"><i /><i /><i /><i /></div>
      <p className="calc-empty-copy" role="status">
        {message ?? (
          <>
            Fill in your sale, then press <b>Calculate profit</b> to see {platform}'s fees and your net profit.
          </>
        )}
      </p>
      <button type="button" className="calc-cta calc-cta-panel" onClick={onCalculate}>
        Calculate profit <ArrowRight size={18} />
      </button>
    </div>
  );
}

function ResultView({ platform, result, pricing }: { platform: string; result: CalculationResult; pricing: PricingContext }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const confidence = CONFIDENCE[result.confidence];
  const profit = result.estimatedProfit;
  const positive = profit >= 0;
  const hasVat = result.vatOnFees > 0;
  const quantity = pricing.scenario.quantity;
  const { embedded, mapHref = (h: string) => h } = useCalculatorEmbed();

  // Where the buyer's money goes. Scale to whichever is larger: what came in, or what went out.
  const segments = [
    { key: "cost", label: "Item cost", amount: result.cogs },
    { key: "delivery", label: "Delivery", amount: result.shippingCost },
    { key: "fees", label: `${platform} fees`, amount: result.totalCashFees },
    { key: "profit", label: "Net profit", amount: Math.max(profit, 0) },
  ];
  const scale = Math.max(result.grossRevenue, result.cogs + result.shippingCost + result.totalCashFees) || 1;
  const feeShare = result.grossRevenue > 0 ? (result.totalCashFees / result.grossRevenue) * 100 : null;
  const feeLines = result.feeLines
    .map((line) => ({ id: line.id, name: shortFeeName(line.label, line.feeType), amount: line.amountExVat + (line.vatAmount ?? 0) }))
    .filter((line) => line.amount > 0);

  function openDetails() {
    setDetailsOpen(true);
    window.setTimeout(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 30);
  }

  return (
    <div className="calc-result-body">
      <div className="calc-result-top">
        <p className="calc-eyebrow">Net profit</p>
        <span className="calc-result-actions">
          <button type="button" className={`calc-chip ${confidence.tone}`} onClick={openDetails}>
            {confidence.label}
          </button>
          <SaveButton summary={`${platform}: ${formatGBP(profit)} profit`} />
        </span>
      </div>
      <p className={`calc-profit ${positive ? "" : "negative"}`} aria-live="polite" aria-atomic="true">
        {formatGBP(profit)}
      </p>
      {quantity > 1 && <p className="calc-per-item">{formatGBP(profit / quantity)} per item · {quantity} items</p>}
      <p className="calc-summary">
        On a {formatGBP(result.grossRevenue)} sale, {platform} fees are <b>{formatGBP(result.totalCashFees)}</b>
        {feeShare !== null && <> ({feeShare.toFixed(1)}%)</>}
        {hasVat && <> including VAT</>}.{" "}
        {positive ? "" : "After costs, this sale makes a loss."}
      </p>

      <div className="calc-bar" role="img" aria-label={segments.map((s) => `${s.label} ${formatGBP(s.amount)}`).join(", ")}>
        {segments.map((s) =>
          s.amount > 0 ? <i key={s.key} className={`seg-${s.key}`} style={{ width: `${(s.amount / scale) * 100}%` }} /> : null,
        )}
      </div>

      <dl className="calc-legend">
        <LegendRow className="seg-revenue" label="Sale total" value={formatGBP(result.grossRevenue)} />
        <LegendRow className="seg-cost" label="Item cost" value={`−${formatGBP(result.cogs)}`} />
        <LegendRow className="seg-delivery" label="Delivery" value={`−${formatGBP(result.shippingCost)}`} />
        <LegendRow className="seg-fees" label={`${platform} fees`} value={`−${formatGBP(result.totalCashFees)}`} />
        {feeLines.length > 1 &&
          feeLines.map((line) => (
            <div key={line.id} className="sub">
              <dt>{line.name}</dt>
              <dd>{formatGBP(line.amount)}</dd>
            </div>
          ))}
        <LegendRow className="seg-profit" label="Net profit" value={formatGBP(profit)} strong />
      </dl>
      {hasVat && feeLines.length > 1 && <p className="calc-fine">Fee amounts include 20% VAT.</p>}

      {result.exclusions.length > 0 && (
        <div className="calc-excluded">
          <p>Not included</p>
          <ul>{result.exclusions.map((e) => <li key={e}>{shortExclusion(e)}</li>)}</ul>
          <button type="button" onClick={openDetails}>Why?</button>
        </div>
      )}

      {result.statement && result.statement.billedSeparately.length > 0 && (
        <StatementNote result={result} />
      )}

      {result.buyerProtectionRange && (
        <p className="calc-vat-note">
          The buyer also pays {platform}'s Buyer Protection fee, usually <b>{formatGBP(result.buyerProtectionRange.low)}–{formatGBP(result.buyerProtectionRange.high)}</b> on this order. It doesn't come out of your money.
        </p>
      )}

      {result.potentiallyReclaimableVat > 0 && (
        <p className="calc-vat-note">
          As you're VAT registered, you may be able to reclaim <b>{formatGBP(result.potentiallyReclaimableVat)}</b> of VAT on these fees through your VAT return. It isn't added back to the profit above.
        </p>
      )}

      <PricingAdvice pricing={pricing} platform={platform} />

      {pricing.platform !== "AMAZON" && (
        <Link href={mapHref(compareHrefFromCalculator(pricing.platform, pricing.scenario, pricing.config as never))} className="calc-compare-link">
          <span>
            <b>Compare this sale</b>
            <small>{pricing.platform === "VINTED" ? "Rank Vinted against Shopify, eBay, Etsy and TikTok Shop by net profit." : "Rank Shopify, eBay, Etsy and TikTok Shop by net profit."}</small>
          </span>
          <ArrowRight size={18} />
        </Link>
      )}

      {!embedded && <PartnerCard platform={pricing.platform} />}

      <dl className="calc-metrics">
        <div><dt>Profit margin</dt><dd>{result.marginPct === null ? "–" : `${result.marginPct.toFixed(1)}%`}</dd></div>
        <div><dt>Return on costs</dt><dd>{result.roiPct === null ? "–" : `${result.roiPct.toFixed(1)}%`}</dd></div>
      </dl>

      <details className="calc-details" ref={detailsRef} open={detailsOpen} onToggle={(e) => setDetailsOpen(e.currentTarget.open)}>
        <summary>How we worked this out</summary>
        <div className="calc-details-body">
          {result.feeLines.length > 0 && (
            <ul className="calc-fee-lines">
              {result.feeLines.map((line) => (
                <li key={line.id}>
                  <div>
                    <b>{line.label}</b>
                    {line.formula && <span>{line.formula}</span>}
                    {line.vatAmount !== undefined && line.vatAmount > 0 && (
                      <span>{formatGBP(line.amountExVat)} + {formatGBP(line.vatAmount)} VAT</span>
                    )}
                    {line.sourceUrl && (
                      <a href={line.sourceUrl} target="_blank" rel="noreferrer">
                        {platform} source{line.verifiedAt ? `, checked ${formatDate(line.verifiedAt)}` : ""} <ArrowUpRight size={12} />
                      </a>
                    )}
                  </div>
                  <strong>{formatGBP(line.amountExVat + (line.vatAmount ?? 0))}</strong>
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
          <p className="calc-fine calc-rounding">{ROUNDING_NOTE}</p>
        </div>
      </details>
    </div>
  );
}

/** Shown wherever fees are broken down. No marketplace publishes its penny-rounding rule, so we don't guess one. */
export const ROUNDING_NOTE =
  "Marketplaces round each fee to the penny on your statement, and none of them publish exactly how. We keep fees unrounded and only round what you see, so your payout may differ from this by a penny or two.";

/** Break-even and target-margin prices, found by re-running the verified engine at other prices. */
function PricingAdvice({ pricing, platform }: { pricing: PricingContext; platform: string }) {
  const [target, setTarget] = useState("30");
  const targetPct = Number(target);
  const targetValid = target.trim() !== "" && Number.isFinite(targetPct) && targetPct > 0 && targetPct < 100;
  const typedDecimals = (target.trim().split(".")[1] ?? "").length;
  const currentPrice = pricing.scenario.soldPrice;

  const breakEvenPrice = useMemo(() => {
    try {
      return suggestBreakEvenPrice(pricing.platform, pricing.scenario, pricing.config as never);
    } catch {
      return null;
    }
  }, [pricing]);

  const targetPriceSnapped = useMemo(() => {
    if (!targetValid) return null;
    try {
      return suggestTargetMarginPrice(pricing.platform, pricing.scenario, pricing.config as never, targetPct, typedDecimals);
    } catch {
      return null;
    }
  }, [pricing, targetPct, targetValid, typedDecimals]);

  return (
    <div className="calc-pricing">
      <p className="calc-eyebrow">Pricing</p>
      <div className="calc-pricing-row">
        <span>Break even at</span>
        <strong>{breakEvenPrice !== null ? `${formatGBP(breakEvenPrice)} each` : "Not reachable"}</strong>
      </div>
      {breakEvenPrice !== null && currentPrice < breakEvenPrice && (
        <p className="calc-pricing-warn">You're {formatGBP(breakEvenPrice - currentPrice)} below break-even on each item.</p>
      )}
      <div className="calc-pricing-row">
        <span className="calc-pricing-target">
          For a
          <span className="calc-mini-input">
            <input
              type="text"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onFocus={(e) => e.target.select()}
              aria-label="Target profit margin"
              aria-invalid={!targetValid || undefined}
            />
            %
          </span>
          margin, sell at
        </span>
        <strong>
          {!targetValid ? "Enter 1–99%" : targetPriceSnapped !== null ? `${formatGBP(targetPriceSnapped.price)} each` : "Not reachable"}
        </strong>
      </div>
      {targetValid && targetPriceSnapped !== null && (
        <p className="calc-fine calc-pricing-exact">Gives a {targetPriceSnapped.marginPct.toFixed(2)}% margin</p>
      )}
      {targetValid && targetPriceSnapped === null && (
        <p className="calc-pricing-warn">{platform}'s percentage fees mean a {targetPct}% margin can't be reached at any price.</p>
      )}
      <p className="calc-fine">Keeps your other costs and delivery the same, and only changes the selling price.</p>
    </div>
  );
}

/** Affiliate offer beside a result. Labelled as an ad; never changes the numbers. */
function PartnerCard({ platform }: { platform: Platform }) {
  const partner = partnerFor(platform);
  if (!partner) return null;
  return (
    <div className="calc-partner">
      <a href={partner.url} target="_blank" rel="sponsored noopener noreferrer" className="calc-partner-link">
        <span>
          <b>
            {partner.title} <em>Ad</em>
          </b>
          <small>{partner.text}</small>
        </span>
        <span className="calc-partner-cta">
          {partner.cta} <ArrowUpRight size={14} />
        </span>
      </a>
      <p>
        We may earn a commission if you sign up. It never affects our calculations.{" "}
        <Link href="/affiliate-disclosure">How we make money</Link>
      </p>
    </div>
  );
}

/** Explains why the marketplace's own order screen shows a higher figure than our net profit. */
function StatementNote({ result }: { result: CalculationResult }) {
  const st = result.statement!;
  const extra = st.billedSeparately.reduce((n, b) => n + b.amount, 0);
  const shown = result.grossRevenue - result.totalCashFees + extra;
  // Lowercase the first letter for mid-sentence use, except acronyms like VAT.
  const names = st.billedSeparately.map((b) => `${/^[A-Z]{2}/.test(b.label) ? b.label : b.label.charAt(0).toLowerCase() + b.label.slice(1)} (${formatGBP(b.amount)})`);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return (
    <div className="calc-statement">
      <p className="calc-eyebrow">Matching your {st.platform} records</p>
      <p>
        {st.platform}'s order screen will show <b>{formatGBP(shown)}</b> earned. Your {list}{" "}
        {names.length > 1 ? "are" : "is"} billed separately, so we include {names.length > 1 ? "them" : "it"} here.
        {result.cogs + result.shippingCost > 0 && " The order screen also doesn't take off your item and delivery costs."}
      </p>
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

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
