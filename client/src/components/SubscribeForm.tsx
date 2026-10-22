/**
 * Newsletter sign-up. Posts to /api/subscribe, which emails a confirmation link
 * (double opt-in). Nobody joins a list until they click it.
 */
import { type FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, MailCheck } from "lucide-react";
import { NEWSLETTER_LISTS, type NewsletterListId } from "@shared/subscribe-options";
import "./subscribe.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "failed"; message: string };

export default function SubscribeForm({
  title = "Commerce intelligence, in your inbox",
  intro = "Marketplace insights, agentic commerce news and EasyFeezy updates. Choose what you get, and unsubscribe any time.",
  defaultLists = ["weekly"],
  compact = false,
}: {
  title?: string;
  intro?: string;
  defaultLists?: NewsletterListId[];
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [lists, setLists] = useState<NewsletterListId[]>(defaultLists);
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const errors = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? undefined : "Enter a valid email address.",
    lists: lists.length ? undefined : "Choose at least one email.",
    consent: consent ? undefined : "Tick the box to agree to receive these emails.",
  };
  const shown: Partial<typeof errors> = tried ? errors : {};
  const hasErrors = Object.values(errors).some(Boolean);

  function toggle(id: NewsletterListId) {
    setLists((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (hasErrors) return;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lists, consent, company }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      setStatus(res.ok && json.ok ? { kind: "sent" } : { kind: "failed", message: json.message ?? "We couldn't sign you up just now. Please try again shortly." });
    } catch {
      setStatus({ kind: "failed", message: "We couldn't reach our server. Check your connection and try again." });
    }
  }

  return (
    <div className={`sb ${compact ? "is-compact" : ""}`}>
      <AnimatePresence mode="wait">
        {status.kind === "sent" ? (
          <motion.div key="sent" className="sb-sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} role="status">
            <span className="sb-sent-icon"><MailCheck size={24} /></span>
            <div>
              <h3>Check your inbox</h3>
              <p>We've sent a confirmation link to {email.trim()}. Click it to start receiving emails. It expires in 48 hours.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" noValidate onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sb-head">
              <h3>{title}</h3>
              <p>{intro}</p>
            </div>

            <div className="sb-lists" role="group" aria-label="Choose your emails">
              {NEWSLETTER_LISTS.map((l) => {
                const on = lists.includes(l.id);
                return (
                  <button key={l.id} type="button" aria-pressed={on} className={`sb-list ${on ? "active" : ""}`} onClick={() => toggle(l.id)}>
                    <span className="sb-check" aria-hidden="true">{on && <Check size={12} />}</span>
                    <span>
                      <b>{l.name}</b>
                      {!compact && <small>{l.detail}</small>}
                    </span>
                  </button>
                );
              })}
            </div>
            {shown.lists && <small className="sb-error">{shown.lists}</small>}

            <div className="sb-row">
              <div className={`sb-input ${shown.email ? "has-error" : ""}`}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@yourshop.com"
                  aria-label="Email address"
                  aria-invalid={shown.email ? true : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="sb-submit" disabled={status.kind === "sending"}>
                {status.kind === "sending" ? <Loader2 size={17} className="ct-spin" /> : <>Subscribe <ArrowRight size={16} /></>}
              </button>
            </div>
            {shown.email && <small className="sb-error">{shown.email}</small>}

            <label className={`sb-consent ${shown.consent ? "has-error" : ""}`}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to receive the emails I've chosen from EasyFeezy. I can unsubscribe at any time.</span>
            </label>
            {shown.consent && <small className="sb-error">{shown.consent}</small>}

            <div className="ct-trap" aria-hidden="true">
              <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>

            {status.kind === "failed" && <p className="sb-failed" role="alert">{status.message}</p>}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
