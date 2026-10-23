/** Scans: the list of past scans, and one scan's results grouped by the four seller questions. */
import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Barcode,
  Check,
  ChevronDown,
  CircleCheck,
  Globe,
  ImageOff,
  Loader2,
  PackageCheck,
  Pencil,
  RefreshCw,
  Scale,
  Sparkles,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { BASE } from "./Shell";

/* ---------- Example data (fictional) ---------- */

type Source = "website" | "etsy" | "ebay";
const SCANS = [
  { id: "running", name: "jadesshop.co.uk", source: "website" as Source, when: "Now", products: 48, score: null, change: 0, fixes: 0, urgent: 0, status: "running" as const, progress: 62 },
  { id: "example", name: "jadesshop.co.uk", source: "website" as Source, when: "Today, 09:12", products: 48, score: 82, change: 4, fixes: 32, urgent: 3, status: "done" as const, progress: 100 },
  { id: "etsy-oct", name: "JadeMakes", source: "etsy" as Source, when: "16 Oct", products: 31, score: 73, change: -1, fixes: 21, urgent: 4, status: "done" as const, progress: 100 },
  { id: "web-oct", name: "jadesshop.co.uk", source: "website" as Source, when: "9 Oct", products: 47, score: 78, change: 5, fixes: 29, urgent: 2, status: "done" as const, progress: 100 },
  { id: "ebay-sep", name: "jadesshop_uk", source: "ebay" as Source, when: "28 Sep", products: 22, score: 69, change: 0, fixes: 18, urgent: 5, status: "done" as const, progress: 100 },
];
const SOURCE_LABEL: Record<Source, string> = { website: "Website", etsy: "Etsy", ebay: "eBay" };

type Question = "Discoverable" | "Matchable" | "Purchasable" | "Profitable";
const QUESTIONS: { name: Question; score: number }[] = [
  { name: "Discoverable", score: 86 },
  { name: "Matchable", score: 71 },
  { name: "Purchasable", score: 79 },
  { name: "Profitable", score: 91 },
];

const ALT_TEXT = [
  { product: "Linen tote, natural", hue: 38, draft: "Natural linen tote bag with long cotton handles, shown flat on a white background.", state: "suggested" },
  { product: "Soy candle, fig", hue: 18, draft: "Fig-scented soy candle in a ribbed amber glass jar with a wooden lid.", state: "approved" },
  { product: "Linen tote, sage", hue: 120, draft: "Sage green linen tote bag hanging from a wooden peg, front pocket visible.", state: "suggested" },
];

const FIXES: { q: Question; icon: typeof Tag; title: string; why: string; count: string; urgent?: boolean; action: string; detail?: "alt" }[] = [
  { q: "Discoverable", icon: ImageOff, title: "14 images have no alt text", why: "AI agents and screen readers can't tell what these photos show.", count: "8 products", urgent: true, action: "Write alt text", detail: "alt" },
  { q: "Matchable", icon: Tag, title: "6 listings are missing a brand", why: "Google and marketplaces use brand to match your products to searches.", count: "6 products", urgent: true, action: "Add brands" },
  { q: "Matchable", icon: Barcode, title: "4 listings have no barcode (GTIN)", why: "Barcodes let shopping agents confirm it's the exact product a buyer asked for.", count: "4 products", action: "Add barcodes" },
  { q: "Purchasable", icon: Truck, title: "9 listings have no delivery time", why: "Buyers and agents skip products when delivery is unclear.", count: "9 products", action: "Add delivery" },
  { q: "Purchasable", icon: PackageCheck, title: "2 products show in stock but have 0 left", why: "Orders for these would fail or need refunding.", count: "2 products", urgent: true, action: "Fix stock" },
  { q: "Profitable", icon: Scale, title: "3 products sell below break-even on Etsy", why: "After fees and Offsite Ads, each sale of these loses money.", count: "3 products", urgent: true, action: "See prices" },
];

const CHECKS_PASSED = [
  "Every product has a title and price",
  "Prices match between your site and its product data",
  "Product pages load for automated visitors",
  "Return policy is published",
  "Images are large enough for Google Shopping",
];

/* ---------- Scans list ---------- */

function SourceIcon({ source }: { source: Source }) {
  return <span className={`db-src db-src-${source}`}>{source === "website" ? <Globe size={14} /> : <Store size={14} />}</span>;
}

export function ScansList() {
  const [filter, setFilter] = useState<"all" | Source>("all");
  const rows = SCANS.filter((s) => filter === "all" || s.source === filter);
  return (
    <>
      <div className="db-usage db-card">
        <div>
          <span className="db-eyebrow">Scans this month</span>
          <strong>4 <small>of 10</small></strong>
        </div>
        <div className="db-bar wide"><i style={{ width: "40%" }} /></div>
        <p>Resets on 1 November. Each scan checks up to 500 products.</p>
      </div>

      <section className="db-card">
        <div className="db-toolbar">
          <div className="db-seg">
            {(["all", "website", "etsy", "ebay"] as const).map((f) => (
              <button key={f} type="button" className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : SOURCE_LABEL[f]}
              </button>
            ))}
          </div>
          <span className="db-muted-note">{rows.length} scans</span>
        </div>
        <div className="db-table scans">
          <div className="db-tr db-th"><span>Shop</span><span>Date</span><span>Products</span><span>Fixes</span><span>Score</span></div>
          {rows.map((s) =>
            s.status === "running" ? (
              <div key={s.id} className="db-tr is-running">
                <span className="db-td-main"><SourceIcon source={s.source} />{s.name}</span>
                <span className="db-running"><Loader2 size={13} className="db-spin" /> Scanning · {s.progress}%</span>
                <span>{s.products}</span>
                <span className="db-progress"><i style={{ width: `${s.progress}%` }} /></span>
                <span>–</span>
              </div>
            ) : (
              <Link key={s.id} href={`${BASE}/scans/${s.id}`} className="db-tr">
                <span className="db-td-main"><SourceIcon source={s.source} /><span>{s.name}<small>{SOURCE_LABEL[s.source]}</small></span></span>
                <span>{s.when}</span>
                <span>{s.products}</span>
                <span>{s.fixes}{s.urgent > 0 && <em className="db-urgent">{s.urgent} urgent</em>}</span>
                <span className="db-score-cell">{s.score}<em className={s.change > 0 ? "up" : s.change < 0 ? "down" : ""}>{s.change > 0 ? "+" : ""}{s.change !== 0 ? s.change : "±0"}</em></span>
              </Link>
            ),
          )}
        </div>
      </section>
    </>
  );
}

/* ---------- One scan ---------- */

function AltTextPanel() {
  const [items, setItems] = useState(ALT_TEXT);
  const approve = (i: number) => setItems((all) => all.map((it, j) => (j === i ? { ...it, state: "approved" } : it)));
  return (
    <div className="db-alt">
      <p className="db-alt-note"><Sparkles size={13} /> Suggestions are written from each photo. Nothing changes on your shop until you approve it.</p>
      {items.map((it, i) => (
        <div className="db-alt-row" key={it.product}>
          <span className="db-thumb" style={{ background: `linear-gradient(135deg, hsl(${it.hue} 30% 32%), hsl(${it.hue} 25% 16%))` }} />
          <div>
            <b>{it.product}</b>
            <p>{it.draft}</p>
          </div>
          {it.state === "approved" ? (
            <span className="db-approved"><Check size={14} /> Approved</span>
          ) : (
            <div className="db-alt-actions">
              <button type="button" className="db-btn-ghost"><Pencil size={13} /> Edit</button>
              <button type="button" className="db-btn small" onClick={() => approve(i)}>Approve</button>
            </div>
          )}
        </div>
      ))}
      <div className="db-alt-foot">
        <span>3 of 14 images shown</span>
        <button type="button" className="db-btn-ghost">Approve all 14</button>
      </div>
    </div>
  );
}

export function ScanDetail() {
  const [tab, setTab] = useState<"All" | Question>("All");
  const [open, setOpen] = useState<string | null>(FIXES[0].title);
  const fixes = FIXES.filter((f) => tab === "All" || f.q === tab);
  const count = (q: Question) => FIXES.filter((f) => f.q === q).length;

  return (
    <>
      <section className="db-card db-pad db-scan-head">
        <div className="db-scan-score">
          <strong className="db-hero-score">82<small>/100</small></strong>
          <span className="db-change up">+4 since 9 Oct</span>
        </div>
        <dl className="db-scan-meta">
          <div><dt>Shop</dt><dd>jadesshop.co.uk</dd></div>
          <div><dt>Scanned</dt><dd>Today, 09:12</dd></div>
          <div><dt>Products</dt><dd>48</dd></div>
          <div><dt>Images</dt><dd>212</dd></div>
        </dl>
        <div className="db-q-mini">
          {QUESTIONS.map((q) => (
            <button key={q.name} type="button" className={tab === q.name ? "on" : ""} onClick={() => setTab(tab === q.name ? "All" : q.name)}>
              <span>{q.name}</span>
              <b>{q.score}</b>
              <div className="db-bar"><i style={{ width: `${q.score}%` }} className={q.score < 75 ? "warn" : ""} /></div>
            </button>
          ))}
        </div>
      </section>

      <div className="db-split">
        <section className="db-card db-pad">
          <div className="db-card-head">
            <div className="db-seg">
              {(["All", ...QUESTIONS.map((q) => q.name)] as const).map((t) => (
                <button key={t} type="button" className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {t} <span>{t === "All" ? FIXES.length : count(t)}</span>
                </button>
              ))}
            </div>
          </div>
          <ul className="db-fixes db-fixes-open">
            {fixes.map((f) => {
              const isOpen = open === f.title;
              return (
                <li key={f.title} className={isOpen ? "open" : ""}>
                  <button type="button" className="db-fix-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.title)}>
                    <span className={`db-fix-icon ${f.urgent ? "urgent" : ""}`}><f.icon size={16} /></span>
                    <span className="db-fix-text">
                      <b>{f.title}</b>
                      <small>{f.why}</small>
                      <span className="db-fix-area">{f.q} · {f.count}{f.urgent ? " · Urgent" : ""}</span>
                    </span>
                    <ChevronDown size={16} className="db-chev" />
                  </button>
                  {isOpen && (
                    <div className="db-fix-body">
                      {f.detail === "alt" ? (
                        <AltTextPanel />
                      ) : (
                        <div className="db-fix-generic">
                          <p>Opens the affected products with the missing field ready to fill in.</p>
                          <button type="button" className="db-btn small">{f.action} <ArrowRight size={14} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="db-stack">
          <section className="db-card db-pad">
            <span className="db-eyebrow">Passed</span>
            <ul className="db-passed">
              {CHECKS_PASSED.map((c) => <li key={c}><CircleCheck size={15} /> {c}</li>)}
            </ul>
            <a href="#" className="db-card-link" onClick={(e) => e.preventDefault()}>All 41 checks <ArrowRight size={13} /></a>
          </section>
          <section className="db-card db-pad db-explain">
            <span className="db-eyebrow">About this score</span>
            <p>The score shows how complete and consistent your product data is against Google, marketplace and agentic commerce standards.</p>
            <p>It can't guarantee where AI agents or search engines show your products.</p>
          </section>
        </div>
      </div>
    </>
  );
}

export function RescanButton() {
  return <button type="button" className="db-btn small"><RefreshCw size={14} /> Scan again</button>;
}
