/**
 * "Compare all features" table for the pricing page.
 * Allowances stay hidden (shown as included) until PRICES_PUBLIC is true.
 */
import { Fragment, useState, type ReactNode } from "react";
import { Check, ChevronDown, Minus } from "lucide-react";
import { InfoTip } from "@/components/calculator/CalculatorParts";
import { PLANS, PRICES_PUBLIC, type PlanId } from "@/components/PlanCards";
import "./plan-compare.css";

type Cell = boolean | "soon" | string;
interface Row {
  name: string;
  info?: ReactNode;
  /** A number or allowance: shown only once prices are public. */
  allowance?: boolean;
  values: Record<PlanId, Cell>;
}
interface Group {
  title: string;
  rows: Row[];
}

const all = (v: Cell): Record<PlanId, Cell> => ({ free: v, plus: v, pro: v, business: v });
const paid = (plus: Cell, pro: Cell = plus, business: Cell = pro): Record<PlanId, Cell> => ({ free: false, plus, pro, business });

export const COMPARE_GROUPS: Group[] = [
  {
    title: "Fees and Compare",
    rows: [
      { name: "Fee calculators for Shopify, eBay, Etsy, TikTok Shop and Vinted", info: <p>Every rate comes from the marketplace's own published pages, with the date we last checked it.</p>, values: all(true) },
      { name: "Compare marketplaces by net profit", values: all(true) },
      { name: "Break-even and target-margin prices", values: all(true) },
      { name: "Save calculations and comparisons", info: <p>Needs a free account. Accounts are coming soon.</p>, values: all("soon") },
      { name: "Email alerts when a marketplace changes its fees", values: { free: false, plus: false, pro: "soon", business: "soon" } },
    ],
  },
  {
    title: "Scan",
    rows: [
      { name: "Scans a month", allowance: true, values: paid("10", "50", "200") },
      { name: "Products checked per scan", allowance: true, values: paid("500") },
      { name: "Fixes in order of impact", info: <p>Each fix shows why it matters and which products it affects.</p>, values: paid(true) },
      { name: "Score history", values: paid(true) },
      { name: "Website scans", info: <p>Any online shop, including Shopify, Wix and WooCommerce.</p>, values: paid(true) },
      { name: "Etsy and eBay shop connections", info: <p>Needs approval from each marketplace, so this comes after launch.</p>, values: paid("soon") },
    ],
  },
  {
    title: "Alt text",
    rows: [
      { name: "Alt text written for your photos", allowance: true, values: paid("500 images", "2,500 images", "10,000 images") },
      { name: "You approve every suggestion", values: paid(true) },
    ],
  },
  {
    title: "Readiness",
    rows: [{ name: "Readiness checks for AI shopping agents", values: { free: false, plus: false, pro: "soon", business: "soon" } }],
  },
  {
    title: "Account and support",
    rows: [
      { name: "Shops", allowance: true, values: { free: "1", plus: "1", pro: "1", business: "Up to 5" } },
      { name: "Support", values: { free: "Email", plus: "Email", pro: "Email", business: "Priority email" } },
      { name: "Cancel any time", values: paid(true) },
    ],
  },
];

function CellView({ value, allowance }: { value: Cell; allowance?: boolean }) {
  if (value === false) return <span className="pcm-no" aria-label="Not included"><Minus size={15} /></span>;
  if (value === true || (allowance && !PRICES_PUBLIC)) return <span className="pcm-yes" aria-label="Included"><Check size={16} /></span>;
  if (value === "soon") return <span className="pcm-soon">Soon</span>;
  return <span className="pcm-text">{value}</span>;
}

const same = (r: Row) => new Set(PLANS.map((p) => JSON.stringify(r.allowance && !PRICES_PUBLIC && r.values[p.id] !== false ? true : r.values[p.id]))).size === 1;

export default function PlanCompare() {
  const [closed, setClosed] = useState<string[]>([]);
  const [diffOnly, setDiffOnly] = useState(false);
  const [mobilePlan, setMobilePlan] = useState<PlanId>("plus");

  return (
    <div className="pcm">
      <div className="pcm-tools">
        <label className="pcm-diff">
          <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
          Only show differences
        </label>
        {!PRICES_PUBLIC && <span className="pcm-note">Allowances are published with prices.</span>}
      </div>

      <div className="pcm-mobile-pick" role="radiogroup" aria-label="Plan to compare">
        {PLANS.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={mobilePlan === p.id} className={mobilePlan === p.id ? "on" : ""} onClick={() => setMobilePlan(p.id)}>{p.name}</button>
        ))}
      </div>

      <table className="pcm-table" data-plan={mobilePlan}>
        <thead>
          <tr>
            <th scope="col"><span className="pcm-sr">Feature</span></th>
            {PLANS.map((p) => (
              <th key={p.id} scope="col" data-col={p.id}>
                <b>{p.name}</b>
                <small>{p.monthly === 0 ? "£0" : PRICES_PUBLIC ? `£${p.monthly}/mo` : "Coming soon"}</small>
              </th>
            ))}
          </tr>
        </thead>
        {COMPARE_GROUPS.map((g) => {
          const isClosed = closed.includes(g.title);
          const rows = diffOnly ? g.rows.filter((r) => !same(r)) : g.rows;
          if (!rows.length) return null;
          return (
            <tbody key={g.title}>
              <tr className="pcm-group">
                <th colSpan={PLANS.length + 1} scope="colgroup">
                  <button type="button" aria-expanded={!isClosed} onClick={() => setClosed((c) => (isClosed ? c.filter((t) => t !== g.title) : [...c, g.title]))}>
                    {g.title} <ChevronDown size={16} />
                  </button>
                </th>
              </tr>
              {!isClosed &&
                rows.map((r) => (
                  <Fragment key={r.name}>
                    <tr>
                      <th scope="row">
                        <span>{r.name}</span>
                        {r.info && <InfoTip label={r.name}>{r.info}</InfoTip>}
                      </th>
                      {PLANS.map((p) => (
                        <td key={p.id} data-col={p.id}><CellView value={r.values[p.id]} allowance={r.allowance} /></td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
