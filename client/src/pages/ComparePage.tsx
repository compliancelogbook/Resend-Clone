/**
 * Compare one sale across every marketplace. State lives in lib/compare/compare-state.ts
 * (defaults, links between shared answers, URL); all maths runs through the verified engines.
 */
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check, ChevronDown, Link2, Settings2, TriangleAlert } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  CalculatorHero,
  CalculatorPage,
  SaveButton,
  useCalculatorEmbed,
  MoneyField,
  OptionCards,
  QuantityField,
  ROUNDING_NOTE,
  SearchablePicker,
  Segmented,
  TextField,
  Toggle,
} from "@/components/calculator/CalculatorParts";
import {
  CALCULATOR_PATHS,
  calculatorHref,
  linkedConfigs,
  matchReference,
  matchTargetFor,
  runMatch,
  type MatchRow,
  PLATFORM_LABELS,
  runComparison,
  scenarioOf,
  settingsSummary,
  stateFromSearch,
  stateToSearch,
  type CompareConfigs,
  type ComparePlatform,
  type CompareRow,
  type CompareState,
} from "@/lib/compare/compare-state";
import { EBAY_CATEGORY_OPTIONS, TIKTOK_CATEGORY_OPTIONS } from "@/lib/category-options";
import { EBAY_CATEGORIES } from "@/data/ebay.fees";
import { SHOPIFY_PLANS, type ShopifyPaymentProcessor, type ShopifyPlan } from "@/data/shopify.fees";
import { UNSUPPORTED_CATEGORY_ID } from "@/data/types";
import type { EtsyOffsiteAdsRate } from "@/data/etsy.fees";
import { suggestBreakEvenPrice } from "@/lib/optimise/price-suggestions";
import { formatGBP } from "@/lib/format";
import { CALCULATION_DISCLAIMER } from "@/lib/calculation-disclaimer";
import {
  parseManualCategoryRate,
  parseNonNegativeAmount,
  parseOptionalAffiliateRate,
  parseOptionalPositiveInteger,
  parsePositiveWholeQuantity,
  parseRequiredPositiveAmount,
  type ValidationResult,
} from "@/lib/validation";
import "@/components/calculator/compare.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function ComparePage() {
  const [state, setState] = useState<CompareState>(() => stateFromSearch(window.location.search));

  useEffect(() => {
    document.title = "Compare marketplaces · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  // Keep the address bar in step, so any comparison can be bookmarked or shared.
  useEffect(() => {
    // Keep the current page (the website or the dashboard); only the settings change.
    const t = window.setTimeout(() => window.history.replaceState(null, "", `${window.location.pathname}?${stateToSearch(state)}`), 250);
    return () => window.clearTimeout(t);
  }, [state]);

  const rows = useMemo(() => runComparison(state), [state]);
  const matchTarget = matchTargetFor(state, rows);
  const matchRows = useMemo(() => (state.mode === "MATCH" ? runMatch(state, matchTarget) : null), [state, matchTarget]);
  const shown: (CompareRow | MatchRow)[] = matchRows ?? rows;

  function updateConfig<P extends ComparePlatform>(platform: P, patch: Partial<CompareConfigs[P]>) {
    setState((s) => ({
      ...s,
      configs: { ...s.configs, [platform]: { ...s.configs[platform], ...patch } },
      customised: s.customised.includes(platform) ? s.customised : [...s.customised, platform],
    }));
  }

  async function share() {
    const url = `${window.location.origin}/compare?${stateToSearch(state)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Anyone with it sees this exact comparison.");
    } catch {
      toast("Copy this link from your address bar to share the comparison.");
    }
  }

  return (
    <CalculatorPage hero={<CalculatorHero marketplace="" title="Compare marketplaces" intro="Rank every marketplace by net profit on the same sale." />}>

      <section className="cmp-layout" aria-label="Compare marketplaces">
        <SalePanel state={state} setState={setState} />

        <div className="cmp-results">
          <Segmented
            label="View"
            value={state.mode}
            onChange={(mode) => setState((s) => ({ ...s, mode }))}
            options={[
              { value: "KEEP", label: "Net profit at my price" },
              { value: "MATCH", label: "Price for a target profit" },
            ]}
          />
          {matchRows ? (
            <>
              <MatchTargetPanel state={state} setState={setState} target={matchTarget} rows={rows} />
              <MatchWinner rows={matchRows} target={matchTarget} sale={state.sale.soldPrice} />
            </>
          ) : (
            <Winner rows={rows} sale={state.sale.soldPrice} />
          )}
          <ol className="cmp-rows">
            {shown.map((row, i) => (
              <RowCard key={row.platform} row={row} rank={i + 1} best={shown[0]} state={state} updateConfig={updateConfig} />
            ))}
          </ol>
          <VintedChoice state={state} setState={setState} />
          <Differences state={state} />
          <div className="cmp-share">
            <SaveButton summary={`Comparison at £${state.sale.soldPrice}`} />
            <button type="button" onClick={share}><Link2 size={15} /> Copy link to this comparison</button>
          </div>
        </div>
      </section>

      <section className="calc-footnote">
        <p>Each marketplace uses the same verified fee rules as its own calculator, with sources and check dates in each breakdown.</p>
        <p>{CALCULATION_DISCLAIMER}</p>
      </section>
    </CalculatorPage>
  );
}

/* ---------- Vinted: off by default ---------- */
function VintedChoice({ state, setState }: { state: CompareState; setState: (fn: (s: CompareState) => CompareState) => void }) {
  const off = state.off.includes("VINTED");
  const toggle = () => setState((s) => ({ ...s, off: off ? s.off.filter((p) => p !== "VINTED") : [...s.off, "VINTED"] }));
  return (
    <div className="cmp-extra">
      <p>
        {off
          ? "Vinted isn't included. It charges sellers no fee and buyers pay a protection fee instead, so its prices aren't like-for-like with these marketplaces."
          : "Vinted is included. It charges sellers no fee and buyers pay a protection fee instead, so its ranking isn't like-for-like."}
      </p>
      <button type="button" onClick={toggle}>{off ? "Add Vinted" : "Remove Vinted"}</button>
    </div>
  );
}

/* ---------- Shared sale ---------- */

function SalePanel({ state, setState }: { state: CompareState; setState: (fn: (s: CompareState) => CompareState) => void }) {
  const { mapHref = (h: string) => h } = useCalculatorEmbed();
  const s = state.sale;
  const [raw, setRaw] = useState({
    soldPrice: String(s.soldPrice),
    itemCost: String(s.itemCost),
    shippingCharged: String(s.shippingCharged),
    shippingCost: String(s.shippingCost),
    quantity: String(s.quantity),
  });

  const parsed = {
    soldPrice: parseNonNegativeAmount(raw.soldPrice, "Selling price"),
    itemCost: parseNonNegativeAmount(raw.itemCost, "Item cost"),
    shippingCharged: parseNonNegativeAmount(raw.shippingCharged, "Delivery charged"),
    shippingCost: parseNonNegativeAmount(raw.shippingCost, "Delivery cost"),
    quantity: parsePositiveWholeQuantity(raw.quantity),
  };
  const errorOf = (r: ValidationResult<number>) => (r.ok ? undefined : r.error);

  function setField(key: keyof typeof raw, value: string) {
    setRaw((r) => ({ ...r, [key]: value }));
    const result = key === "quantity" ? parsePositiveWholeQuantity(value) : parseNonNegativeAmount(value, key);
    if (result.ok) setState((st) => ({ ...st, sale: { ...st.sale, [key]: result.value } }));
  }

  return (
    <aside className="cmp-sale" aria-label="Your sale">
      <div className="cmp-sale-inner">
        <h2>Your sale</h2>
        <p className="cmp-sale-intro">Change anything and the ranking updates straight away.</p>
        <div className="cmp-sale-grid">
          <MoneyField label="Selling price" note="each" value={raw.soldPrice} onChange={(v) => setField("soldPrice", v)} error={errorOf(parsed.soldPrice)} />
          <MoneyField label="Item cost" note="each" value={raw.itemCost} onChange={(v) => setField("itemCost", v)} error={errorOf(parsed.itemCost)} />
          <MoneyField label="Delivery charged" note="to the buyer" value={raw.shippingCharged} onChange={(v) => setField("shippingCharged", v)} error={errorOf(parsed.shippingCharged)} />
          <MoneyField label="Delivery cost" note="what you paid" value={raw.shippingCost} onChange={(v) => setField("shippingCost", v)} error={errorOf(parsed.shippingCost)} />
        </div>
        <QuantityField value={raw.quantity} onChange={(v) => setField("quantity", v)} error={errorOf(parsed.quantity)} />
        <Segmented
          label="How you sell"
          value={s.sellerType}
          onChange={(v) => setState((st) => ({ ...st, sale: { ...st.sale, sellerType: v } }))}
          options={[
            { value: "PRIVATE", label: "Private seller" },
            { value: "BUSINESS", label: "Business" },
          ]}
        />
        <Segmented
          label="VAT"
          value={s.vatProfile}
          onChange={(v) => setState((st) => ({ ...st, sale: { ...st.sale, vatProfile: v } }))}
          options={[
            { value: "NOT_REGISTERED", label: "Not registered" },
            { value: "REGISTERED", label: "VAT registered" },
          ]}
        />
        {state.from && (
          <p className="calc-fine">
            Started from the <Link href={mapHref(CALCULATOR_PATHS[state.from])}>{PLATFORM_LABELS[state.from]} calculator</Link>, so {PLATFORM_LABELS[state.from]} uses your settings.
          </p>
        )}
      </div>
    </aside>
  );
}

/* ---------- Match my profit ---------- */

function MatchTargetPanel({
  state,
  setState,
  target,
  rows,
}: {
  state: CompareState;
  setState: (fn: (s: CompareState) => CompareState) => void;
  target: number;
  rows: CompareRow[];
}) {
  const ref = matchReference(state, rows);
  const [raw, setRaw] = useState(target.toFixed(2));
  const [editing, setEditing] = useState(false);
  const shownValue = editing ? raw : target.toFixed(2);
  const parsed = Number(shownValue);
  const invalid = shownValue.trim() === "" || !Number.isFinite(parsed);

  return (
    <div className="cmp-match-target">
      <label htmlFor="cmp-keep">
        Target net profit
        <span className="cmp-keep-input">
          £
          <input
            id="cmp-keep"
            type="text"
            inputMode="decimal"
            value={shownValue}
            aria-invalid={invalid || undefined}
            onFocus={(e) => {
              setEditing(true);
              setRaw(target.toFixed(2));
              e.target.select();
            }}
            onBlur={() => setEditing(false)}
            onChange={(e) => {
              setRaw(e.target.value);
              const n = Number(e.target.value);
              if (e.target.value.trim() !== "" && Number.isFinite(n)) setState((s) => ({ ...s, matchTarget: Math.round(n * 100) / 100 }));
            }}
          />
        </span>
        per order
      </label>
      <p>
        {state.matchTarget === null && ref
          ? `Starting from ${PLATFORM_LABELS[ref.platform]}'s net profit at ${formatGBP(state.sale.soldPrice)}. Type any amount to change it.`
          : "Your own target."}
        {state.matchTarget !== null && (
          <button type="button" onClick={() => setState((s) => ({ ...s, matchTarget: null }))}>Reset</button>
        )}
      </p>
    </div>
  );
}

function MatchWinner({ rows, target, sale }: { rows: MatchRow[]; target: number; sale: number }) {
  const priced = rows.filter((r) => r.price !== null);
  const waiting = rows.filter((r) => r.missing).map((r) => PLATFORM_LABELS[r.platform]);
  if (priced.length === 0) return null;
  const low = priced[0].price!;
  const tied = priced.filter((r) => Math.abs(r.price! - low) < 0.005);
  const next = priced.find((r) => Math.abs(r.price! - low) >= 0.005);
  const names = tied.map((r) => PLATFORM_LABELS[r.platform]);
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];

  return (
    <motion.div className="cmp-winner" key={joined + low.toFixed(2)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <p className="calc-eyebrow">Lowest price for {formatGBP(target)} net profit</p>
      <h2>
        {joined} <span>· list at {formatGBP(low)}</span>
      </h2>
      <p>
        {next
          ? `${formatGBP(next.price! - low)} cheaper for your buyer than ${PLATFORM_LABELS[next.platform]}, for the same profit.`
          : "Every marketplace needs the same price for this profit."}
        {Math.abs(low - sale) >= 0.005 && ` That's ${low < sale ? "below" : "above"} your current ${formatGBP(sale)}.`}
      </p>
      {waiting.length > 0 && (
        <p className="cmp-waiting">
          {waiting.join(" and ")} {waiting.length > 1 ? "aren't" : "isn't"} included yet. Choose {waiting.length > 1 ? "their categories" : "a category"} below.
        </p>
      )}
    </motion.div>
  );
}

/* ---------- Ranking ---------- */

function Winner({ rows, sale }: { rows: CompareRow[]; sale: number }) {
  const ranked = rows.filter((r) => r.result);
  const waiting = rows.filter((r) => r.missing).map((r) => PLATFORM_LABELS[r.platform]);
  const waitingNote = waiting.length > 0 && (
    <p className="cmp-waiting">
      {waiting.join(" and ")} {waiting.length > 1 ? "aren't" : "isn't"} ranked yet. Choose {waiting.length > 1 ? "their categories" : "a category"} below to include {waiting.length > 1 ? "them" : "it"}.
    </p>
  );
  if (ranked.length === 0) return null;
  const top = ranked[0].result!.estimatedProfit;
  const tied = ranked.filter((r) => Math.abs(r.result!.estimatedProfit - top) < 0.005);
  const next = ranked.find((r) => Math.abs(r.result!.estimatedProfit - top) >= 0.005);
  const names = tied.map((r) => PLATFORM_LABELS[r.platform]);
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];

  return (
    <motion.div className="cmp-winner" key={joined + top.toFixed(2)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
      <p className="calc-eyebrow">{tied.length > 1 ? "Joint highest net profit" : "Highest net profit"}</p>
      <h2>
        {joined} <span>· {formatGBP(top)} net profit</span>
      </h2>
      <p>
        {next
          ? `That's ${formatGBP(top - next.result!.estimatedProfit)} more than ${PLATFORM_LABELS[next.platform]} on a ${formatGBP(sale)} item.`
          : "Every ranked marketplace leaves you the same amount on this sale."}
      </p>
      {waitingNote}
    </motion.div>
  );
}

function RowCard({
  row,
  rank,
  best,
  state,
  updateConfig,
}: {
  row: CompareRow | MatchRow;
  rank: number;
  best: CompareRow | MatchRow;
  state: CompareState;
  updateConfig: <P extends ComparePlatform>(platform: P, patch: Partial<CompareConfigs[P]>) => void;
}) {
  const [open, setOpen] = useState<"settings" | "fees" | null>(null);
  const { platform, result } = row;
  const { mapHref = (h: string) => h } = useCalculatorEmbed();
  const label = PLATFORM_LABELS[platform];
  const isOwn = state.customised.includes(platform);
  const matchPrice = "price" in row ? row.price : undefined;
  const isMatch = matchPrice !== undefined;
  const bestPrice = "price" in best ? best.price : null;
  const top = best.result ? Math.max(best.result.estimatedProfit, 0) : 0;
  // KEEP: bar shows profit against the best. MATCH: bar shows how close the price is to the lowest.
  const width = isMatch
    ? matchPrice && bestPrice ? (bestPrice / matchPrice) * 100 : 0
    : result && top > 0 ? Math.max(0, (result.estimatedProfit / top) * 100) : 0;
  const isBest = isMatch
    ? matchPrice !== null && bestPrice !== null && Math.abs(matchPrice - bestPrice) < 0.005
    : result && best.result && Math.abs(result.estimatedProfit - best.result.estimatedProfit) < 0.005;
  const currentPrice = state.sale.soldPrice;

  const breakEven = useMemo(() => {
    if (!result || isMatch) return null;
    try {
      return suggestBreakEvenPrice(platform, scenarioOf(state.sale), linkedConfigs(state)[platform] as never);
    } catch {
      return null;
    }
  }, [platform, state, result, isMatch]);

  return (
    <li className={`cmp-row ${isBest ? "is-best" : ""}`}>
      <div className="cmp-row-main">
        <span className="cmp-rank" aria-label={`Rank ${rank}`}>{rank}</span>
        <div className="cmp-row-name">
          <h3>{label}</h3>
          <p>
            {settingsSummary(platform, state)}
            <em className={isOwn ? "own" : ""}>{isOwn ? "Your settings" : "Default"}</em>
          </p>
        </div>
        <div className="cmp-row-profit">
          {result && isMatch && matchPrice !== null ? (
            <>
              <strong>{formatGBP(matchPrice)}</strong>
              <span>list price each</span>
            </>
          ) : result ? (
            <>
              <strong className={result.estimatedProfit < 0 ? "negative" : ""}>{formatGBP(result.estimatedProfit)}</strong>
              <span>net profit</span>
            </>
          ) : (
            <span className="cmp-row-error">{row.missing ? "Needs a category" : "Needs a setting"}</span>
          )}
        </div>
      </div>

      <div className="cmp-bar" aria-hidden="true"><i style={{ width: `${width}%` }} /></div>

      {result && isMatch && matchPrice !== null && (
        <dl className="cmp-row-stats">
          <div>
            <dt>vs your {formatGBP(currentPrice)}</dt>
            <dd className={matchPrice > currentPrice + 0.004 ? "up" : matchPrice < currentPrice - 0.004 ? "down" : ""}>
              {Math.abs(matchPrice - currentPrice) < 0.005 ? "same price" : `${matchPrice > currentPrice ? "+" : "−"}${formatGBP(Math.abs(matchPrice - currentPrice))}`}
            </dd>
          </div>
          <div><dt>{label} fees</dt><dd>{formatGBP(result.totalCashFees)}</dd></div>
          <div><dt>Net profit</dt><dd>{formatGBP(result.estimatedProfit)}</dd></div>
        </dl>
      )}
      {result && !isMatch && (
        <dl className="cmp-row-stats">
          <div><dt>{label} fees</dt><dd>{formatGBP(result.totalCashFees)}{result.grossRevenue > 0 && <small> ({((result.totalCashFees / result.grossRevenue) * 100).toFixed(1)}%)</small>}</dd></div>
          <div><dt>Margin</dt><dd>{result.marginPct === null ? "–" : `${result.marginPct.toFixed(1)}%`}</dd></div>
          <div><dt>Break even</dt><dd>{breakEven === null ? "–" : formatGBP(breakEven)}</dd></div>
        </dl>
      )}

      {result && result.exclusions.length > 0 && (
        <p className="cmp-excluded">Not included: {result.exclusions.map((e) => e.split(/ — |\. /)[0].replace(/\.$/, "")).join("; ")}</p>
      )}
      {row.missing && <p className="cmp-check"><TriangleAlert size={14} /> {row.missing} We won't rank {label} until you do.</p>}
      {row.error && <p className="cmp-check"><TriangleAlert size={14} /> {isMatch ? row.error : "Open the settings to finish this one."}</p>}

      <div className="cmp-row-actions">
        <button type="button" className={open === "settings" ? "active" : ""} onClick={() => setOpen(open === "settings" ? null : "settings")} aria-expanded={open === "settings"}>
          <Settings2 size={14} /> {row.missing ? "Choose category" : "Change settings"}
        </button>
        {result && (
          <button type="button" className={open === "fees" ? "active" : ""} onClick={() => setOpen(open === "fees" ? null : "fees")} aria-expanded={open === "fees"}>
            <ChevronDown size={14} /> Fee breakdown
          </button>
        )}
        <Link href={mapHref(calculatorHref(platform, state))} className="cmp-row-link">Full calculator <ArrowUpRight size={13} /></Link>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="cmp-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
          >
            <div className="cmp-drawer-inner">
              {open === "settings" ? <SettingsEditor platform={platform} state={state} updateConfig={updateConfig} /> : result && <FeeBreakdown result={result} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

function FeeBreakdown({ result }: { result: NonNullable<CompareRow["result"]> }) {
  return (
    <div className="cmp-fees">
      <ul>
        {result.feeLines.map((line) => (
          <li key={line.id}>
            <span>
              {line.label}
              {line.formula && <small>{line.formula}</small>}
            </span>
            <strong>{formatGBP(line.amountExVat + (line.vatAmount ?? 0))}</strong>
          </li>
        ))}
      </ul>
      {result.exclusions.length > 0 && (
        <>
          <p className="calc-eyebrow">Not included</p>
          <ul className="calc-notes">{result.exclusions.map((e) => <li key={e}>{e}</li>)}</ul>
        </>
      )}
      <p className="calc-fine calc-rounding">{ROUNDING_NOTE}</p>
    </div>
  );
}

/* ---------- Per-marketplace settings ---------- */

/** A number setting that keeps what the person types, and only saves valid values. */
function NumberSetting({
  label,
  note,
  value,
  onCommit,
  parse,
  prefix,
  suffix,
  placeholder,
}: {
  label: string;
  note?: string;
  value: number | null;
  onCommit: (n: number | null) => void;
  parse: (raw: string) => ValidationResult<number | null>;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}) {
  const [raw, setRaw] = useState(value === null ? "" : String(value));
  const r = parse(raw);
  return (
    <TextField
      label={label}
      note={note}
      value={raw}
      placeholder={placeholder}
      prefix={prefix}
      suffix={suffix}
      onChange={(v: string) => {
        setRaw(v);
        const next = parse(v);
        if (next.ok) onCommit(next.value);
      }}
      error={r.ok ? undefined : r.error}
    />
  );
}

const pctToFraction = (r: ValidationResult<number>): ValidationResult<number | null> => r;
const fractionToPct = (n: number | null) => (n === null ? null : +(n * 100).toFixed(4));

function SettingsEditor({
  platform,
  state,
  updateConfig,
}: {
  platform: ComparePlatform;
  state: CompareState;
  updateConfig: <P extends ComparePlatform>(platform: P, patch: Partial<CompareConfigs[P]>) => void;
}) {
  const c = linkedConfigs(state);
  const isPrivate = state.sale.sellerType === "PRIVATE";

  switch (platform) {
    case "SHOPIFY": {
      const s = c.SHOPIFY;
      return (
        <EditorGrid>
          <OptionCards
            label="Shopify plan"
            value={s.plan}
            columns={3}
            onChange={(plan: ShopifyPlan) => updateConfig("SHOPIFY", { plan })}
            options={(Object.keys(SHOPIFY_PLANS) as ShopifyPlan[]).map((id) => ({ value: id, title: SHOPIFY_PLANS[id].label, detail: `£${SHOPIFY_PLANS[id].monthlySubscription} a month` }))}
          />
          <OptionCards
            label="How the buyer paid"
            value={s.processor}
            onChange={(processor: ShopifyPaymentProcessor) => updateConfig("SHOPIFY", { processor, thirdPartyProcessor: processor === "SHOPIFY_PAYMENTS" ? null : s.thirdPartyProcessor })}
            options={[
              { value: "SHOPIFY_PAYMENTS", title: "Shopify Payments" },
              { value: "PAYPAL_WITH_SHOPIFY_PAYMENTS", title: "PayPal", extra: "Shopify Payments is main" },
              { value: "PAYPAL_WITHOUT_SHOPIFY_PAYMENTS", title: "PayPal", extra: "Shopify Payments isn't main" },
              { value: "THIRD_PARTY", title: "Another provider" },
            ]}
          />
          {s.processor === "SHOPIFY_PAYMENTS" ? (
            <Segmented
              label="Card used"
              value={s.cardType}
              onChange={(cardType) => updateConfig("SHOPIFY", { cardType })}
              options={[
                { value: "STANDARD", label: "UK card" },
                { value: "INTERNATIONAL_AMEX", label: "International or Amex" },
              ]}
            />
          ) : (
            <p className="calc-fine">Your provider's own fee isn't included here. Add it in the full Shopify calculator.</p>
          )}
          <NumberSetting
            label="Orders per month"
            note="optional, spreads your plan cost"
            placeholder="e.g. 100"
            value={s.expectedMonthlyOrders ?? null}
            onCommit={(n) => updateConfig("SHOPIFY", { expectedMonthlyOrders: n })}
            parse={(v) => parseOptionalPositiveInteger(v, "Orders per month")}
          />
        </EditorGrid>
      );
    }

    case "EBAY": {
      const s = c.EBAY;
      const cat = EBAY_CATEGORIES.find((x) => x.id === s.categoryId);
      const needsRate = s.categoryId === UNSUPPORTED_CATEGORY_ID || (cat !== undefined && !cat.schedule);
      if (isPrivate) {
        return (
          <EditorGrid>
            <OptionCards
              label="Buyer location"
              value={s.region === "DOMESTIC" ? "DOMESTIC" : "OTHER"}
              onChange={(region) => updateConfig("EBAY", { region })}
              options={[
                { value: "DOMESTIC", title: "UK", detail: "No fee" },
                { value: "OTHER", title: "Outside the UK", detail: "+3%" },
              ]}
            />
            <Toggle checked={!!s.privateInsertionFee} onChange={(privateInsertionFee) => updateConfig("EBAY", { privateInsertionFee })} title="I've used my 300 free listings this month" detail="eBay then charges 35p a listing." />
          </EditorGrid>
        );
      }
      return (
        <EditorGrid>
          <SearchablePicker label="Category" value={s.categoryId} onChange={(categoryId) => updateConfig("EBAY", { categoryId })} options={EBAY_CATEGORY_OPTIONS} placeholder="Search 74 categories" required emptyText="Choose your category" />
          {needsRate && (
            <NumberSetting
              key={s.categoryId}
              label="Final value fee rate"
              suffix="%"
              placeholder="e.g. 12.9"
              value={fractionToPct(s.manualCategoryRate ?? null)}
              onCommit={(n) => updateConfig("EBAY", { manualCategoryRate: n })}
              parse={(v) => pctToFraction(parseManualCategoryRate(v))}
            />
          )}
          <OptionCards
            label="Buyer location"
            value={s.region}
            onChange={(region) => updateConfig("EBAY", { region })}
            options={[
              { value: "DOMESTIC", title: "UK" },
              { value: "EU_NORTHERN_EUROPE", title: "Europe", detail: "+1.05%" },
              { value: "US_CANADA", title: "US & Canada", detail: "+1.8%" },
              { value: "OTHER", title: "Rest of world", detail: "+2%" },
            ]}
          />
          <Toggle checked={s.topRatedPremiumService} onChange={(topRatedPremiumService) => updateConfig("EBAY", { topRatedPremiumService })} title="Top Rated discount" detail="10% off the final value fee." />
        </EditorGrid>
      );
    }

    case "ETSY": {
      const s = c.ETSY;
      const ads = s.offsiteAdsRate === null ? "NONE" : String(s.offsiteAdsRate);
      return (
        <EditorGrid>
          <OptionCards
            label="Offsite Ads"
            value={ads}
            columns={3}
            onChange={(v) => updateConfig("ETSY", { offsiteAdsRate: v === "NONE" ? null : (Number(v) as EtsyOffsiteAdsRate) })}
            options={[
              { value: "NONE", title: "No Offsite Ads" },
              { value: "0.15", title: "Offsite Ads 15%" },
              { value: "0.12", title: "Offsite Ads 12%" },
            ]}
          />
          <Toggle checked={s.currencyConversionSelected} onChange={(currencyConversionSelected) => updateConfig("ETSY", { currencyConversionSelected })} title="Etsy converted the currency" detail="Adds Etsy's 2.5% conversion fee." />
          {state.sale.vatProfile === "REGISTERED" ? (
            <Toggle checked={s.vatIdSupplied} onChange={(vatIdSupplied) => updateConfig("ETSY", { vatIdSupplied })} title="I've given Etsy my VAT number" detail="Etsy then doesn't add VAT to its fees." />
          ) : (
            <p className="calc-fine">Etsy adds 20% VAT to its fees for sellers without a VAT number.</p>
          )}
        </EditorGrid>
      );
    }

    case "TIKTOK": {
      const s = c.TIKTOK;
      return (
        <EditorGrid>
          <SearchablePicker label="Category" value={s.categoryId} onChange={(categoryId) => updateConfig("TIKTOK", { categoryId })} options={TIKTOK_CATEGORY_OPTIONS} placeholder="Search 343 categories" required emptyText="Choose your category" />
          {s.categoryId === UNSUPPORTED_CATEGORY_ID && (
            <NumberSetting
              label="Commission rate"
              suffix="%"
              placeholder="e.g. 9"
              value={fractionToPct(s.manualCategoryRate ?? null)}
              onCommit={(n) => updateConfig("TIKTOK", { manualCategoryRate: n })}
              parse={(v) => pctToFraction(parseManualCategoryRate(v))}
            />
          )}
          <NumberSetting
            label="Creator commission"
            note="optional, 1–80%"
            suffix="%"
            placeholder="Blank if none"
            value={fractionToPct(s.affiliateCommissionRate ?? null)}
            onCommit={(n) => updateConfig("TIKTOK", { affiliateCommissionRate: n })}
            parse={(v) => parseOptionalAffiliateRate(v)}
          />
          <NumberSetting
            label="Other TikTok Shop costs"
            note="fulfilment, ads, incl. VAT"
            prefix="£"
            value={s.otherActualCosts || null}
            onCommit={(n) => updateConfig("TIKTOK", { otherActualCosts: n ?? 0 })}
            parse={(v) => parseNonNegativeAmount(v, "Other costs")}
          />
        </EditorGrid>
      );
    }

    case "VINTED":
      return <VintedEditor isPrivate={isPrivate} cost={c.VINTED.visibilityServiceCost ?? null} onCommit={(n) => updateConfig("VINTED", { visibilityServiceCost: n })} />;
  }
}

/** Bump/Showcase: nothing is counted until the person enters what they actually paid. */
function VintedEditor({ isPrivate, cost, onCommit }: { isPrivate: boolean; cost: number | null; onCommit: (n: number | null) => void }) {
  const [on, setOn] = useState(cost !== null);
  return (
    <EditorGrid>
      <p className="calc-fine">{isPrivate ? "Private seller" : "Pro seller"}, set by "How you sell" on the left.</p>
      <Toggle
        checked={on}
        onChange={(v) => {
          setOn(v);
          if (!v) onCommit(null);
        }}
        title="I paid for a Bump or Showcase"
        detail="Enter what you actually paid. Nothing is added until you do."
      />
      {on && (
        <NumberSetting
          label="Amount paid"
          prefix="£"
          placeholder="e.g. 1.95"
          value={cost}
          onCommit={(n) => onCommit(n)}
          parse={(v) => parseRequiredPositiveAmount(v, "Amount paid")}
        />
      )}
    </EditorGrid>
  );
}

function EditorGrid({ children }: { children: ReactNode }) {
  return <div className="cmp-editor">{children}</div>;
}

/* ---------- Honest differences ---------- */

function Differences({ state }: { state: CompareState }) {
  const id = useId();
  const c = linkedConfigs(state);
  const notes: string[] = [];
  const vinted = !state.off.includes("VINTED");
  if (state.sale.sellerType === "PRIVATE") {
    notes.push(`On ${vinted ? "Vinted and on " : ""}eBay private sales, the buyer pays a Buyer Protection fee on top of your price. It doesn't come out of your money, but it does change what the buyer sees.`);
  } else if (vinted) {
    notes.push("On Vinted, the buyer pays a Buyer Protection fee on top of your price.");
  }
  if (!c.SHOPIFY.expectedMonthlyOrders) notes.push(`Shopify's monthly plan (from £${SHOPIFY_PLANS.BASIC.monthlySubscription}) isn't included. Add your orders per month in Shopify's settings to share it across sales.`);
  notes.push("Shopify is your own shop, so you bring the buyers. The others are marketplaces with their own shoppers.");
  if (c.TIKTOK.otherActualCosts === 0) notes.push("TikTok Shop fulfilment and ad costs aren't included unless you add them.");

  return (
    <section className="cmp-diffs" aria-labelledby={id}>
      <h3 id={id}><Check size={15} /> Worth knowing before you choose</h3>
      <ul>{notes.map((n) => <li key={n}>{n}</li>)}</ul>
    </section>
  );
}
