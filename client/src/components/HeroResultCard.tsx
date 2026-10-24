/**
 * Homepage hero: a live example sale run through the real fee engines,
 * cycling through each marketplace. Numbers are calculated, not typed in.
 */
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { formatGBP } from "@/lib/format";
import {
  calculatorHref,
  comparedPlatforms,
  defaultCompareState,
  PLATFORM_LABELS,
  runComparison,
  type ComparePlatform,
} from "@/lib/compare/compare-state";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** The example: a £30 item that cost £10, sold by a business seller. Categories are set explicitly, never guessed. */
function exampleState() {
  const state = defaultCompareState();
  state.configs.EBAY.categoryId = "EVERYTHING_ELSE";
  state.configs.TIKTOK.categoryId = "WOMENSWEAR_UNDERWEAR__ALL";
  state.customised = ["EBAY", "TIKTOK"];
  return state;
}

const EXAMPLE_NOTES: Record<ComparePlatform, string> = {
  SHOPIFY: "Basic plan, Shopify Payments, UK card",
  EBAY: "Business seller, Everything Else category",
  ETSY: "No Offsite Ads, no VAT number",
  TIKTOK: "Womenswear & Underwear, 9% commission",
  VINTED: "Business seller (Vinted Pro), no Bump",
};

export default function HeroResultCard() {
  const state = useMemo(exampleState, []);
  const rows = useMemo(() => runComparison(state), [state]);
  // Same marketplaces as Compare (Vinted is off by default there too).
  const platforms = useMemo(() => comparedPlatforms(state), [state]);
  const [active, setActive] = useState<ComparePlatform>("SHOPIFY");
  const [paused, setPaused] = useState(false);

  // Gently cycle through the marketplaces until someone interacts.
  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setActive((a) => platforms[(platforms.indexOf(a) + 1) % platforms.length]);
    }, 3200);
    return () => window.clearInterval(t);
  }, [paused, platforms]);

  const row = rows.find((r) => r.platform === active) ?? rows[0];
  const r = row.result!;
  const scale = r.grossRevenue || 1;
  const parts = [
    { key: "cost", width: (r.cogs / scale) * 100 },
    { key: "fees", width: (r.totalCashFees / scale) * 100 },
    { key: "profit", width: (Math.max(r.estimatedProfit, 0) / scale) * 100 },
  ];

  return (
    <div className="hero-card" onMouseEnter={() => setPaused(true)} onFocus={() => setPaused(true)}>
      <div className="hero-card-top">
        <span>Example sale</span>
        <span className="hero-card-live"><i /> Calculated live</span>
      </div>
      <p className="hero-card-sale">£30.00 item · cost you £10.00</p>

      <div className="hero-card-tabs" role="tablist" aria-label="Marketplace">
        {platforms.map((p) => (
          <button key={p} type="button" role="tab" aria-selected={p === active} className={p === active ? "active" : ""} onClick={() => { setActive(p); setPaused(true); }}>
            {PLATFORM_LABELS[p]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease }}>
          <p className="hero-card-label">Net profit</p>
          <p className="hero-card-profit">{formatGBP(r.estimatedProfit)}</p>
          <p className="hero-card-fees">
            {PLATFORM_LABELS[active]} fees <b>{formatGBP(r.totalCashFees)}</b>
            {r.vatOnFees > 0 && " incl. VAT"} · {EXAMPLE_NOTES[active]}
          </p>
          <div className="hero-card-bar" aria-hidden="true">
            {parts.map((p) => (p.width > 0 ? <i key={p.key} className={`seg-${p.key}`} style={{ width: `${p.width}%` }} /> : null))}
          </div>
          <Link href={calculatorHref(active, state)} className="hero-card-link">
            Calculate with your numbers <ArrowRight size={15} />
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
