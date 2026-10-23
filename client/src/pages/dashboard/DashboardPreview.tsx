/**
 * Hidden design preview of the signed-in dashboard (/preview/dashboard).
 * Example data only: no login, no database. Not linked from the site.
 * ?v=a | b | c switches between the three Home layouts being compared.
 */
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  ChevronsUpDown,
  CircleHelp,
  CreditCard,
  House,
  ImageOff,
  LayoutList,
  MessageSquare,
  MoreHorizontal,
  Radar,
  Scale,
  ScanSearch,
  Settings,
  Sparkles,
  Calculator,
  TriangleAlert,
  Tag,
  PackageCheck,
} from "lucide-react";
import "./dashboard.css";

type Variant = "a" | "b" | "c";

/* ---------- Example data (fictional) ---------- */

const SCORE_HISTORY = [58, 61, 60, 66, 64, 71, 74, 73, 78, 82];
const SCORE_LABELS = ["14 Aug", "", "", "", "", "", "", "", "", "Today"];

const FIXES = [
  { icon: ImageOff, title: "14 images have no alt text", detail: "AI agents and screen readers can't tell what these photos show.", area: "AI ready", urgent: true, action: "Write alt text" },
  { icon: Tag, title: "6 listings are missing a brand", detail: "Google and marketplaces use brand to match your products to searches.", area: "Listings", urgent: true, action: "Add brands" },
  { icon: Scale, title: "3 products sell below break-even on Etsy", detail: "After fees and Offsite Ads, these lose money on each sale.", area: "Profit", urgent: true, action: "See prices" },
  { icon: PackageCheck, title: "9 listings have no delivery time", detail: "Buyers and agents skip products with unclear delivery.", area: "Listings", urgent: false, action: "Add delivery" },
];

const SCANS = [
  { name: "jadesshop.co.uk", when: "Today, 09:12", products: 48, score: 82, change: +4 },
  { name: "jadesshop.co.uk", when: "16 Oct", products: 47, score: 78, change: +5 },
  { name: "Etsy · JadeMakes", when: "9 Oct", products: 31, score: 73, change: -1 },
];

const SAVED = [
  { title: "Linen tote · Etsy", meta: "£24.99 · profit £18.85", when: "Today" },
  { title: "Linen tote · compared", meta: "Best: Shopify, £20.41", when: "Yesterday" },
  { title: "Candle set · eBay", meta: "£32.00 · profit £21.07", when: "18 Oct" },
];

/* ---------- Shell ---------- */

const NAV: { group: string; items: { label: string; icon: typeof House; active?: boolean; soon?: boolean }[] }[] = [
  { group: "Your shop", items: [
    { label: "Home", icon: House, active: true },
    { label: "Scans", icon: ScanSearch },
    { label: "Listings", icon: LayoutList },
    { label: "Saved", icon: Bookmark },
  ] },
  { group: "Tools", items: [
    { label: "Fees", icon: Calculator },
    { label: "Compare", icon: Scale },
    { label: "Readiness", icon: Radar, soon: true },
  ] },
  { group: "Account", items: [
    { label: "Settings", icon: Settings },
    { label: "Billing", icon: CreditCard },
  ] },
];

function Sidebar() {
  return (
    <aside className="db-side">
      <button className="db-shop" type="button">
        <span className="db-shop-mark">J</span>
        <span className="db-shop-name">Jade's Shop</span>
        <span className="db-plan">Plus</span>
        <ChevronsUpDown size={15} className="db-shop-chev" />
      </button>
      <nav className="db-nav">
        {NAV.map((g) => (
          <div className="db-nav-group" key={g.group}>
            {g.items.map((it) => (
              <a key={it.label} href="#" className={`db-nav-item ${it.active ? "active" : ""} ${it.soon ? "soon" : ""}`} onClick={(e) => e.preventDefault()}>
                <it.icon size={17} strokeWidth={1.7} />
                <span>{it.label}</span>
                {it.soon && <em>Soon</em>}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className="db-user">
        <span className="db-avatar">J</span>
        <span className="db-user-mail">jade@jadesshop.co.uk</span>
        <MoreHorizontal size={16} />
      </div>
    </aside>
  );
}

function Topbar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="db-top">
      <h1>{title}</h1>
      <div className="db-top-right">
        <a href="#" onClick={(e) => e.preventDefault()}><CircleHelp size={15} /> Help</a>
        <a href="#" className="db-feedback" onClick={(e) => e.preventDefault()}><MessageSquare size={14} /> Feedback</a>
        {action}
      </div>
    </header>
  );
}

function AskButton() {
  return (
    <button className="db-ask" type="button">
      <Sparkles size={15} /> Ask
    </button>
  );
}

/* ---------- Building blocks ---------- */

function Chart({ height = 180 }: { height?: number }) {
  const w = 800;
  const h = height;
  const min = 50;
  const max = 90;
  const pts = SCORE_HISTORY.map((v, i) => [(i / (SCORE_HISTORY.length - 1)) * w, h - ((v - min) / (max - min)) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <div className="db-chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="Scan score over the last 10 scans, rising from 58 to 82">
        <defs>
          <linearGradient id="dbfill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(48,230,157,.22)" />
            <stop offset="1" stopColor="rgba(48,230,157,0)" />
          </linearGradient>
        </defs>
        {[60, 70, 80].map((g) => {
          const y = h - ((g - min) / (max - min)) * h;
          return <line key={g} x1="0" x2={w} y1={y} y2={y} className="db-grid" />;
        })}
        <path d={area} fill="url(#dbfill)" />
        <path d={line} className="db-line" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" className="db-dot" />
      </svg>
      <div className="db-chart-y">{[80, 70, 60].map((g) => <span key={g}>{g}</span>)}</div>
      <div className="db-chart-x">{SCORE_LABELS.filter(Boolean).map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  );
}

type Tone = "good" | "warn" | "bad";
function StatusCard({ label, status, tone, rows }: { label: string; status: string; tone: Tone; rows: { dot: string; name: string; count: string; value: string }[] }) {
  return (
    <section className="db-card db-status">
      <span className="db-eyebrow">{label}</span>
      <strong className={`db-status-word ${tone}`}>{status}</strong>
      <dl>
        {rows.map((r) => (
          <div key={r.name}>
            <dt><i style={{ background: r.dot }} />{r.name}</dt>
            <dd><span>{r.count}</span>{r.value}</dd>
          </div>
        ))}
      </dl>
      <a href="#" className="db-card-link" onClick={(e) => e.preventDefault()}>See details <ArrowRight size={13} /></a>
    </section>
  );
}

function FixList({ limit = 4, compact = false }: { limit?: number; compact?: boolean }) {
  return (
    <ul className={`db-fixes ${compact ? "compact" : ""}`}>
      {FIXES.slice(0, limit).map((f) => (
        <li key={f.title}>
          <span className={`db-fix-icon ${f.urgent ? "urgent" : ""}`}><f.icon size={16} /></span>
          <div>
            <b>{f.title}</b>
            {!compact && <small>{f.detail}</small>}
            <span className="db-fix-area">{f.area}{f.urgent ? " · Urgent" : ""}</span>
          </div>
          <button type="button" className="db-btn-ghost">{f.action}</button>
        </li>
      ))}
    </ul>
  );
}

function ScansTable() {
  return (
    <div className="db-table">
      <div className="db-tr db-th"><span>Scan</span><span>Date</span><span>Products</span><span>Score</span></div>
      {SCANS.map((s) => (
        <a href="#" key={s.when} className="db-tr" onClick={(e) => e.preventDefault()}>
          <span className="db-td-main">{s.name}</span>
          <span>{s.when}</span>
          <span>{s.products}</span>
          <span className="db-score-cell">{s.score}<em className={s.change >= 0 ? "up" : "down"}>{s.change >= 0 ? "+" : ""}{s.change}</em></span>
        </a>
      ))}
    </div>
  );
}

function SavedList() {
  return (
    <ul className="db-saved">
      {SAVED.map((s) => (
        <li key={s.title}>
          <div><b>{s.title}</b><small>{s.meta}</small></div>
          <span>{s.when}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Home variants ---------- */

/** A · Status cards: three plain verdicts, then the trend and recent scans. */
function HomeA() {
  return (
    <>
      <div className="db-grid-3">
        <StatusCard label="Profit" status="Healthy" tone="good" rows={[
          { dot: "#30e69d", name: "Average margin", count: "45 products", value: "31.4%" },
          { dot: "#ff6b7d", name: "Below break-even", count: "3", value: "6%" },
        ]} />
        <StatusCard label="Listings" status="Needs work" tone="warn" rows={[
          { dot: "#30e69d", name: "Complete", count: "33", value: "69%" },
          { dot: "#f5c451", name: "Missing details", count: "15", value: "31%" },
        ]} />
        <StatusCard label="AI ready" status="Good" tone="good" rows={[
          { dot: "#30e69d", name: "Readable by agents", count: "40", value: "83%" },
          { dot: "#f5c451", name: "Missing alt text", count: "8 products", value: "14 images" },
        ]} />
      </div>
      <section className="db-card db-pad">
        <div className="db-card-head">
          <div><span className="db-eyebrow">Scan score</span><strong className="db-big">82 <em className="up">+4</em></strong></div>
          <div className="db-seg"><span>30 days</span><span className="on">90 days</span><span>1 year</span></div>
        </div>
        <Chart />
      </section>
      <section className="db-card db-pad">
        <div className="db-card-head"><span className="db-eyebrow">Recent scans</span><a href="#" className="db-card-link" onClick={(e) => e.preventDefault()}>All scans <ArrowRight size={13} /></a></div>
        <ScansTable />
      </section>
    </>
  );
}

/** B · Fix list first: what to do today leads, score sits beside it. */
function HomeB() {
  return (
    <>
      <div className="db-split">
        <section className="db-card db-pad">
          <div className="db-card-head">
            <div><span className="db-eyebrow">What to fix next</span><p className="db-sub">Sorted by how much each fix helps. 3 are urgent.</p></div>
            <a href="#" className="db-card-link" onClick={(e) => e.preventDefault()}>All 32 fixes <ArrowRight size={13} /></a>
          </div>
          <FixList />
        </section>
        <div className="db-stack">
          <section className="db-card db-pad db-ring-card">
            <span className="db-eyebrow">Scan score</span>
            <Ring value={82} />
            <p className="db-sub">Up 4 since your last scan on 16 Oct.</p>
            <button type="button" className="db-btn">Run a new scan</button>
          </section>
          <section className="db-card db-pad">
            <span className="db-eyebrow">Saved</span>
            <SavedList />
          </section>
        </div>
      </div>
      <section className="db-card db-pad">
        <div className="db-card-head"><span className="db-eyebrow">Score over time</span></div>
        <Chart height={140} />
      </section>
    </>
  );
}

function Ring({ value }: { value: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="db-ring">
      <svg viewBox="0 0 120 120" aria-label={`Scan score ${value} out of 100`}>
        <circle cx="60" cy="60" r={r} className="db-ring-bg" />
        <circle cx="60" cy="60" r={r} className="db-ring-fg" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <strong>{value}<small>/100</small></strong>
    </div>
  );
}

/** C · Four questions: one score broken into Discoverable, Matchable, Purchasable, Profitable. */
function HomeC() {
  const parts = [
    { name: "Discoverable", text: "Can buyers and AI agents find your products?", value: 86, note: "14 images need alt text" },
    { name: "Matchable", text: "Do your listings have the details to match searches?", value: 71, note: "6 missing brand, 4 missing GTIN" },
    { name: "Purchasable", text: "Is price, stock and delivery clear?", value: 79, note: "9 missing delivery time" },
    { name: "Profitable", text: "Are you making money after fees?", value: 91, note: "3 below break-even on Etsy" },
  ];
  return (
    <>
      <section className="db-card db-pad db-hero">
        <div>
          <span className="db-eyebrow">Your shop today</span>
          <strong className="db-hero-score">82<small>/100</small></strong>
          <p className="db-sub">Up 4 since 16 Oct. Matchable needs the most attention.</p>
          <div className="db-hero-actions">
            <button type="button" className="db-btn">Run a new scan</button>
            <button type="button" className="db-btn-ghost">See all fixes</button>
          </div>
        </div>
        <div className="db-hero-chart"><Chart height={150} /></div>
      </section>
      <div className="db-grid-4">
        {parts.map((p) => (
          <section className="db-card db-pad db-part" key={p.name}>
            <span className="db-eyebrow">{p.name}</span>
            <strong className="db-big">{p.value}</strong>
            <div className="db-bar"><i style={{ width: `${p.value}%` }} className={p.value < 75 ? "warn" : ""} /></div>
            <p>{p.text}</p>
            <small><TriangleAlert size={12} /> {p.note}</small>
          </section>
        ))}
      </div>
      <div className="db-split even">
        <section className="db-card db-pad">
          <div className="db-card-head"><span className="db-eyebrow">Top fixes</span><a href="#" className="db-card-link" onClick={(e) => e.preventDefault()}>All <ArrowRight size={13} /></a></div>
          <FixList limit={3} compact />
        </section>
        <section className="db-card db-pad">
          <div className="db-card-head"><span className="db-eyebrow">Saved calculations</span><a href="#" className="db-card-link" onClick={(e) => e.preventDefault()}>All <ArrowRight size={13} /></a></div>
          <SavedList />
        </section>
      </div>
    </>
  );
}

/* ---------- Page ---------- */

const VARIANTS: Record<Variant, { name: string; render: () => ReactNode }> = {
  a: { name: "Status cards", render: () => <HomeA /> },
  b: { name: "Fix list first", render: () => <HomeB /> },
  c: { name: "Four questions", render: () => <HomeC /> },
};

export default function DashboardPreview() {
  const initial = (new URLSearchParams(window.location.search).get("v") ?? "a") as Variant;
  const [v, setV] = useState<Variant>(VARIANTS[initial] ? initial : "a");

  useEffect(() => {
    document.title = "Dashboard preview · EasyFeezy";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const pick = (next: Variant) => {
    setV(next);
    window.history.replaceState(null, "", `?v=${next}`);
  };

  return (
    <div className="db">
      <div className="db-preview-bar">
        <span className="db-preview-label">Preview · example data</span>
        {(Object.keys(VARIANTS) as Variant[]).map((k) => (
          <button key={k} type="button" className={k === v ? "on" : ""} onClick={() => pick(k)}>
            {k.toUpperCase()}<span className="db-vname"> · {VARIANTS[k].name}</span>
          </button>
        ))}
      </div>
      <div className="db-frame">
        <Sidebar />
        <main className="db-main">
          <Topbar title="Home" action={<button type="button" className="db-btn small">Run a scan <ArrowUpRight size={14} /></button>} />
          <div className="db-content">{VARIANTS[v].render()}</div>
        </main>
      </div>
      <AskButton />
    </div>
  );
}
