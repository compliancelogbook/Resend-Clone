/** Saved calculations, Settings and Billing. Example data only. */
import { useState } from "react";
import PlanCards from "@/components/PlanCards";
import { SELLER_TYPE, type SellerKind } from "@/lib/seller-type";
import { ArrowUpRight, Check, CircleAlert, Download, Mail, Scale, Calculator } from "lucide-react";

/* ---------- Saved ---------- */

type SavedKind = "calculation" | "comparison";
const SAVED: { kind: SavedKind; title: string; marketplace: string; price: string; result: string; when: string; feesChanged?: string }[] = [
  { kind: "calculation", title: "Linen tote, natural", marketplace: "Etsy", price: "£24.99", result: "£18.85 profit", when: "Today" },
  { kind: "comparison", title: "Linen tote, natural", marketplace: "5 marketplaces", price: "£24.99", result: "Best: Shopify, £20.41", when: "Yesterday" },
  { kind: "calculation", title: "Soy candle, fig", marketplace: "eBay", price: "£32.00", result: "£21.07 profit", when: "18 Oct" },
  { kind: "calculation", title: "Ceramic mug set", marketplace: "TikTok Shop", price: "£28.00", result: "£14.62 profit", when: "2 Oct", feesChanged: "TikTok Shop fees changed on 15 Oct" },
  { kind: "comparison", title: "Gift bundle", marketplace: "3 marketplaces", price: "£45.00", result: "Best: Etsy, £29.10", when: "24 Sep" },
];

export function Saved() {
  const [filter, setFilter] = useState<"all" | SavedKind>("all");
  const rows = SAVED.filter((s) => filter === "all" || s.kind === filter);
  return (
    <section className="db-card">
      <div className="db-toolbar">
        <div className="db-seg">
          {(["all", "calculation", "comparison"] as const).map((f) => (
            <button key={f} type="button" className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "calculation" ? "Calculations" : "Comparisons"}
            </button>
          ))}
        </div>
        <span className="db-muted-note">{rows.length} saved</span>
      </div>
      <ul className="db-saved-list">
        {rows.map((s) => (
          <li key={s.title + s.when}>
            <span className="db-src">{s.kind === "comparison" ? <Scale size={14} /> : <Calculator size={14} />}</span>
            <div className="db-saved-main">
              <b>{s.title}</b>
              <small>{s.marketplace} · {s.price}</small>
              {s.feesChanged && <span className="db-changed"><CircleAlert size={13} /> {s.feesChanged}. Recalculate to see your new profit.</span>}
            </div>
            <span className="db-saved-result">{s.result}</span>
            <span className="db-saved-when">{s.when}</span>
            <button type="button" className="db-btn-ghost">{s.feesChanged ? "Recalculate" : "Open"}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Settings ---------- */

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <label className="db-field">
      <span>{label}</span>
      <input defaultValue={value} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Switch({ on, onChange, label, text, locked }: { on: boolean; onChange?: () => void; label: string; text: string; locked?: boolean }) {
  return (
    <div className="db-switch-row">
      <div><b>{label}</b><small>{text}</small></div>
      <button type="button" role="switch" aria-checked={on} aria-label={label} className={`db-switch ${on ? "on" : ""}`} disabled={locked} onClick={onChange}>
        <i />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const [seller, setSeller] = useState<SellerKind>("BUSINESS");
  const [vat, setVat] = useState(false);
  const [mail, setMail] = useState({ weekly: true, daily: false, updates: true });
  return (
    <div className="db-settings">
      <section className="db-card db-pad">
        <h2 className="db-h2">Profile</h2>
        <div className="db-form-grid">
          <Field label="Name" value="Jade Collins" />
          <Field label="Email" value="jade@jadesshop.co.uk" hint="We'll send a link to confirm a new address." />
        </div>
      </section>

      <section className="db-card db-pad">
        <h2 className="db-h2">Your shop</h2>
        <div className="db-form-grid">
          <Field label="Shop name" value="Jade's Shop" />
          <Field label="Website" value="https://jadesshop.co.uk" />
        </div>
        <div className="db-seller">
          <span>How you sell</span>
          <div className="db-seg">
            {(["PRIVATE", "BUSINESS"] as const).map((k) => (
              <button key={k} type="button" className={seller === k ? "on" : ""} onClick={() => setSeller(k)}>{SELLER_TYPE[k].title}</button>
            ))}
          </div>
          <small>{SELLER_TYPE[seller].detail}. Sets eBay's fees and Vinted Pro in your calculators and Compare.</small>
        </div>
        {seller === "BUSINESS" && (
          <Switch on={vat} onChange={() => setVat((v) => !v)} label="VAT registered" text="Changes how fees and profit are worked out in calculators and scans." />
        )}
      </section>

      <section className="db-card db-pad">
        <h2 className="db-h2">Emails</h2>
        <Switch on locked label="Account emails" text="Sign-in links, scan results and receipts. These can't be turned off." />
        <Switch on={mail.weekly} onChange={() => setMail((m) => ({ ...m, weekly: !m.weekly }))} label="The Weekly Brief" text="The week's best marketplace insights. Every Monday." />
        <Switch on={mail.daily} onChange={() => setMail((m) => ({ ...m, daily: !m.daily }))} label="Daily Brief" text="Every story as it happens. Each weekday morning." />
        <Switch on={mail.updates} onChange={() => setMail((m) => ({ ...m, updates: !m.updates }))} label="Product updates" text="New features and early access. A few emails a month." />
      </section>

      <section className="db-card db-pad">
        <h2 className="db-h2">Sign-in</h2>
        <div className="db-signin">
          <div><Mail size={16} /><span><b>Email link</b><small>jade@jadesshop.co.uk</small></span></div>
          <span className="db-approved"><Check size={14} /> On</span>
        </div>
        <div className="db-signin">
          <div><span className="db-g">G</span><span><b>Google</b><small>Not connected</small></span></div>
          <button type="button" className="db-btn-ghost">Connect</button>
        </div>
      </section>

      <section className="db-card db-pad db-danger">
        <div>
          <h2 className="db-h2">Delete account</h2>
          <p className="db-sub">Deletes your scans, saved calculations and settings. Cancel any paid plan first. This can't be undone.</p>
        </div>
        <button type="button" className="db-btn-danger">Delete account</button>
      </section>
    </div>
  );
}

/* ---------- Billing ---------- */

const INVOICES = [
  { date: "1 Oct 2026", amount: "£7.99", status: "Paid" },
  { date: "1 Sep 2026", amount: "£7.99", status: "Paid" },
  { date: "1 Aug 2026", amount: "£7.99", status: "Paid" },
];

export function Billing() {
  return (
    <>
      <div className="db-split">
        <section className="db-card db-pad db-plan-card">
          <span className="db-eyebrow">Current plan</span>
          <div className="db-plan-row">
            <strong className="db-big">Plus</strong>
            <span>£7.99 a month · billed monthly</span>
          </div>
          <p className="db-sub">Renews on 1 November 2026. Cancel any time and keep Plus until then.</p>
          <div className="db-usage-rows">
            <div><span>Scans</span><b>4 of 10</b><div className="db-bar"><i style={{ width: "40%" }} /></div></div>
            <div><span>Alt text</span><b>120 of 500 images</b><div className="db-bar"><i style={{ width: "24%" }} /></div></div>
          </div>
          <button type="button" className="db-btn-ghost db-manage">Manage payment and cancel <ArrowUpRight size={13} /></button>
          <small className="db-stripe-note">Payments are handled securely by Stripe. We never see your full card number.</small>
        </section>
        <section className="db-card db-pad">
          <span className="db-eyebrow">Payment method</span>
          <div className="db-card-pm">
            <span className="db-pm-chip">VISA</span>
            <div><b>Visa ending 4242</b><small>Expires 08/28</small></div>
          </div>
          <span className="db-eyebrow" style={{ marginTop: 26 }}>Invoices</span>
          <ul className="db-invoices">
            {INVOICES.map((i) => (
              <li key={i.date}>
                <span>{i.date}</span>
                <span>{i.amount}</span>
                <span className="db-approved"><Check size={13} /> {i.status}</span>
                <button type="button" aria-label={`Download invoice ${i.date}`}><Download size={14} /></button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="db-card db-pad">
        <div className="db-card-head"><span className="db-eyebrow">Plans</span><span className="db-muted-note">Example prices and limits</span></div>
        <PlanCards mode="app" current="plus" showPrices />
      </section>
    </>
  );
}
