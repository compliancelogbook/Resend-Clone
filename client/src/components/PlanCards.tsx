/**
 * Plan cards shared by the website pricing section and the dashboard Billing page.
 * Prices are still hypotheses: the website hides them until PRICES_PUBLIC is true.
 */
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import "./plan-cards.css";

/** Flip to true once prices are final. Until then the website shows "Coming soon". */
export const PRICES_PUBLIC = false;
/** Paying yearly costs this many months: 10 = two months free. */
export const YEARLY_MONTHS_PAID = 10;

export type PlanId = "free" | "plus" | "pro" | "business";
export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  /** Shown everywhere. */
  points: string[];
  /** Exact allowances, shown in the dashboard only while prices are private. */
  limits?: string[];
}

export const PLANS: Plan[] = [
  { id: "free", name: "Free", tagline: "For checking your numbers", monthly: 0, points: ["Fee calculators for 5 marketplaces", "Compare marketplaces by profit", "Save calculations with a free account"] },
  { id: "plus", name: "Plus", tagline: "For solo sellers", monthly: 7.99, points: ["Scan your shop for what to fix", "Alt text written for your photos", "Everything in Free"], limits: ["10 scans a month", "Alt text for 500 images"] },
  { id: "pro", name: "Pro", tagline: "For growing shops", monthly: 14.99, points: ["Everything in Plus", "Alerts when marketplace fees change", "Readiness checks when they launch"], limits: ["50 scans a month", "Alt text for 2,500 images"] },
  { id: "business", name: "Business", tagline: "For several shops", monthly: 29.99, points: ["Everything in Pro", "Several shops", "Priority support"], limits: ["Up to 5 shops", "200 scans a month", "Alt text for 10,000 images"] },
];

const gbp = (n: number) => `£${n.toFixed(2).replace(/\.00$/, "")}`;
export const yearlyTotal = (p: Plan) => Math.round(p.monthly * YEARLY_MONTHS_PAID * 100) / 100;
export const yearlyPerMonth = (p: Plan) => Math.round((yearlyTotal(p) / 12) * 100) / 100;
/** Features the website must label "Soon" because they aren't live yet. */
const SOON_ON_SITE = new Set(["Save calculations with a free account"]);

export default function PlanCards({ mode, current, showPrices = PRICES_PUBLIC }: { mode: "site" | "app"; current?: PlanId; showPrices?: boolean }) {
  const [yearly, setYearly] = useState(false);
  const freeMonths = 12 - YEARLY_MONTHS_PAID;

  return (
    <div className="pc">
      {showPrices && (
        <div className="pc-bar">
          <button type="button" role="switch" aria-checked={yearly} className={`pc-toggle ${yearly ? "on" : ""}`} onClick={() => setYearly((y) => !y)}>
            <i />
          </button>
          <span>{yearly ? "Pay yearly" : "Pay monthly"}</span>
          <em>{freeMonths} months free when you pay yearly</em>
        </div>
      )}

      <div className="pc-grid">
        {PLANS.map((p) => {
          const isCurrent = current === p.id;
          const paid = p.monthly > 0;
          const price = !paid ? "£0" : yearly ? gbp(yearlyPerMonth(p)) : gbp(p.monthly);
          return (
            <article key={p.id} className={`pc-card ${isCurrent ? "is-current" : ""} ${!paid ? "is-free" : ""}`}>
              <header>
                <h3>{p.name}</h3>
                {showPrices || !paid ? (
                  <div className="pc-price">
                    <strong>{price}</strong>
                    {paid && <span>/mo</span>}
                  </div>
                ) : (
                  <span className="pc-soon">Coming soon</span>
                )}
              </header>
              <p className="pc-tagline">{p.tagline}</p>
              {showPrices && paid && <small className="pc-billed">{yearly ? `${gbp(yearlyTotal(p))} billed yearly` : "Billed monthly"}</small>}

              <PlanAction plan={p} mode={mode} isCurrent={isCurrent} showPrices={showPrices} />

              <ul>
                {(mode === "app" && p.limits ? [...p.limits, ...p.points] : p.points).map((pt) => (
                  <li key={pt}><Check size={14} /> <span>{pt}{mode === "site" && SOON_ON_SITE.has(pt) && <em className="pc-soon-tag">Soon</em>}</span></li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
      {mode === "site" && !showPrices && <p className="pc-note">We'll publish prices before anything is charged. Free tools stay free.</p>}
    </div>
  );
}

function PlanAction({ plan, mode, isCurrent, showPrices }: { plan: Plan; mode: "site" | "app"; isCurrent: boolean; showPrices: boolean }) {
  if (isCurrent) return <span className="pc-current">Current plan</span>;
  if (mode === "site") {
    if (plan.monthly === 0) return <Link href="/compare" className="pc-btn primary">Start for free</Link>;
    if (!showPrices) return <Link href="/early-access#signup" className="pc-btn">Join early access</Link>;
    return <Link href="/early-access#signup" className="pc-btn">Choose {plan.name}</Link>;
  }
  return (
    <button type="button" className="pc-btn">
      {plan.monthly === 0 ? "Downgrade" : <>Upgrade <ArrowRight size={14} /></>}
    </button>
  );
}
