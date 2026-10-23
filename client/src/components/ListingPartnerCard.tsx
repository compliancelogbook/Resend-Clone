/** Labelled ad for a cross-listing tool. Sits beside results; never changes them. */
import { ArrowUpRight, Check } from "lucide-react";
import { Link } from "wouter";
import { LISTING_PARTNER, listingPartner } from "@/lib/partners";
import "./listing-partner.css";

/** `example` shows the layout with placeholder text, for design previews only. */
export default function ListingPartnerCard({ example = false }: { example?: boolean }) {
  const live = listingPartner();
  const p = live ?? (example ? { ...LISTING_PARTNER, name: "Partner name" } : null);
  if (!p) return null;
  return (
    <aside className="lp" aria-label={`Ad: ${p.name}`}>
      <div className="lp-head">
        <b>{p.name}</b>
        <em>{example && !live ? "Example ad" : "Ad"}</em>
      </div>
      <h3>{p.headline}</h3>
      <p>{p.text}</p>
      <ul>
        {p.points.map((pt) => <li key={pt}><Check size={14} /> {pt}</li>)}
        {p.offer && <li><Check size={14} /> {p.offer}</li>}
      </ul>
      <a className="lp-cta" href={live ? p.url : "#"} target="_blank" rel="sponsored noopener noreferrer" onClick={(e) => { if (!live) e.preventDefault(); }}>
        Try {p.name} <ArrowUpRight size={15} />
      </a>
      <small>We may earn a commission if you sign up, at no cost to you. It never affects our calculations. <Link href="/affiliate-disclosure">How we make money</Link></small>
    </aside>
  );
}
