/**
 * Hidden design preview of the signed-in dashboard (/preview/dashboard).
 * Example data only: no login, no database. Not linked from the site.
 */
import { useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  ImageOff,
  TriangleAlert,
  Tag,
  PackageCheck,
  Scale,
  Plus,
} from "lucide-react";
import { BASE, Shell } from "./Shell";
import { Billing, Saved, SettingsPage } from "./Account";
import { Compare, Fees } from "./Tools";
import { NewScan, RescanButton, ScanDetail, ScansEmpty, ScansList } from "./Scans";
import "./dashboard.css";

/* ---------- Example data (fictional) ---------- */

const SCORE_HISTORY = [58, 61, 60, 66, 64, 71, 74, 73, 78, 82];
const SCORE_LABELS = ["14 Aug", "", "", "", "", "", "", "", "", "Today"];

const FIXES = [
  { icon: ImageOff, title: "14 images have no alt text", detail: "AI agents and screen readers can't tell what these photos show.", area: "Discoverable", urgent: true, action: "Write alt text" },
  { icon: Tag, title: "6 listings are missing a brand", detail: "Google and marketplaces use brand to match your products to searches.", area: "Matchable", urgent: true, action: "Add brands" },
  { icon: Scale, title: "3 products sell below break-even on Etsy", detail: "After fees and Offsite Ads, these lose money on each sale.", area: "Profitable", urgent: true, action: "See prices" },
  { icon: PackageCheck, title: "9 listings have no delivery time", detail: "Buyers and agents skip products with unclear delivery.", area: "Purchasable", urgent: false, action: "Add delivery" },
];

const SAVED = [
  { title: "Linen tote · Etsy", meta: "£24.99 · profit £18.85", when: "Today" },
  { title: "Linen tote · compared", meta: "Best: Shopify, £20.41", when: "Yesterday" },
  { title: "Candle set · eBay", meta: "£32.00 · profit £21.07", when: "18 Oct" },
];

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

/** Home: one shop score, broken into the four seller questions. */
function Home() {
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
          <p className="db-sub">Up 4 since 9 Oct. Matchable needs the most attention.</p>
          <div className="db-hero-actions">
            <Link href={`${BASE}/scans`} className="db-btn">Run a new scan</Link>
            <Link href={`${BASE}/scans/example`} className="db-btn-ghost">See all fixes</Link>
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
          <FixList limit={3} />
        </section>
        <section className="db-card db-pad">
          <div className="db-card-head"><span className="db-eyebrow">Saved calculations</span><Link href={`${BASE}/saved`} className="db-card-link">All <ArrowRight size={13} /></Link></div>
          <SavedList />
        </section>
      </div>
    </>
  );
}

/* ---------- Page ---------- */

export default function DashboardPreview() {
  const [location] = useLocation();
  useEffect(() => {
    document.title = "Dashboard preview · EasyFeezy";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  const firstVisit = new URLSearchParams(useSearch()).get("state") === "empty";

  if (location.startsWith(`${BASE}/fees`)) {
    return <Shell title="Fees"><Fees /></Shell>;
  }
  if (location.startsWith(`${BASE}/compare`)) {
    return <Shell title="Compare"><Compare /></Shell>;
  }
  if (location.startsWith(`${BASE}/saved`)) {
    return <Shell title="Saved"><Saved /></Shell>;
  }
  if (location.startsWith(`${BASE}/settings`)) {
    return <Shell title="Settings"><SettingsPage /></Shell>;
  }
  if (location.startsWith(`${BASE}/billing`)) {
    return <Shell title="Billing"><Billing /></Shell>;
  }
  if (location === `${BASE}/scans/new`) {
    return (
      <Shell title="New scan" crumb={<><Link href={`${BASE}/scans`}>Scans</Link><span>/</span>New</>}>
        <NewScan />
      </Shell>
    );
  }
  if (location.startsWith(`${BASE}/scans/`)) {
    return (
      <Shell title="jadesshop.co.uk" crumb={<><Link href={`${BASE}/scans`}>Scans</Link><span>/</span>Today, 09:12</>} action={<RescanButton />}>
        <ScanDetail />
      </Shell>
    );
  }
  if (location.startsWith(`${BASE}/scans`)) {
    return (
      <Shell title="Scans" action={<Link href={`${BASE}/scans/new`} className="db-btn small"><Plus size={14} /> New scan</Link>}>
        {firstVisit ? <ScansEmpty /> : <ScansList />}
      </Shell>
    );
  }
  return (
    <Shell title="Home" action={<Link href={`${BASE}/scans`} className="db-btn small">Run a scan <ArrowUpRight size={14} /></Link>}>
      <Home />
    </Shell>
  );
}
