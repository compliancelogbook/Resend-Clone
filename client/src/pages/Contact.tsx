/**
 * Contact page. Posts to /api/contact, which validates the message and sends it
 * through the Resend API (server/contact.ts). Errors are shown honestly: if
 * sending isn't set up, the page says so rather than pretending it worked.
 */
import { type FormEvent, useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2, MessageSquareHeart, Receipt, Sparkles } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { CONTACT_MARKETPLACES, CONTACT_TOPICS, MESSAGE_MAX } from "@shared/contact-options";
import "./contact.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
type Topic = (typeof CONTACT_TOPICS)[number];
type Errors = Partial<Record<"name" | "email" | "topic" | "message", string>>;
type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; name: string } | { kind: "failed"; message: string };

const REASONS = [
  { icon: MessageSquareHeart, title: "Shape what we build", copy: "Tell us what would make EasyFeezy more useful. Feedback goes straight into the roadmap." },
  { icon: Receipt, title: "Spotted a fee change?", copy: "Marketplaces update their fees. If a rate looks wrong, tell us and we'll check it against the source." },
  { icon: Sparkles, title: "Early access and partnerships", copy: "Interested in Scan, Readiness or working together? We'd like to hear from you." },
];

function clientErrors(v: { name: string; email: string; topic: Topic | null; message: string }): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (!v.topic) e.topic = "Choose what your message is about.";
  if (v.message.trim().length < 10) e.message = "Tell us a little more (at least 10 characters).";
  return e;
}

export default function Contact() {
  useEffect(() => {
    document.title = "Contact · EasyFeezy";
    window.scrollTo(0, 0);
  }, []);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [marketplaces, setMarketplaces] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // hidden trap for bots
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Once someone has tried to send, keep errors in step as they fix things.
  const shown = tried ? clientErrors({ name, email, topic, message }) : errors;

  function toggleMarketplace(m: string) {
    setMarketplaces((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    const found = clientErrors({ name, email, topic, message });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, marketplaces, message, company }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; errors?: Errors };
      if (res.ok && json.ok) {
        setStatus({ kind: "sent", name: name.trim().split(/\s+/)[0] });
      } else if (json.errors) {
        setErrors(json.errors);
        setStatus({ kind: "idle" });
      } else {
        setStatus({ kind: "failed", message: json.message ?? "We couldn't send your message just now. Please try again shortly." });
      }
    } catch {
      setStatus({ kind: "failed", message: "We couldn't reach our server. Check your connection and try again." });
    }
  }

  function reset() {
    setName("");
    setEmail("");
    setTopic(null);
    setMarketplaces([]);
    setMessage("");
    setTried(false);
    setErrors({});
    setStatus({ kind: "idle" });
  }

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="ct-layout">
        <motion.div className="ct-intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="calc-pill">Contact</span>
          <h1>Talk to the{" "}<br />EasyFeezy team</h1>
          <p>Questions, feedback or ideas. Every message is read by a person, and we reply from a real inbox.</p>
          <ul className="ct-reasons">
            {REASONS.map(({ icon: Icon, title, copy }) => (
              <li key={title}>
                <span><Icon size={18} /></span>
                <div>
                  <b>{title}</b>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div className="ct-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease }}>
          <AnimatePresence mode="wait">
            {status.kind === "sent" ? (
              <motion.div key="sent" className="ct-sent" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease }} role="status">
                <span className="ct-sent-icon"><Check size={28} /></span>
                <h2>Thanks, {status.name}</h2>
                <p>Your message is on its way. We'll reply to {email.trim()}.</p>
                <div className="ct-sent-actions">
                  <button type="button" className="button" onClick={reset}>Send another</button>
                  <Link href="/compare" className="text-link">Compare marketplaces <ArrowRight size={15} /></Link>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" noValidate onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <div className="ct-row">
                  <Field label="Name" value={name} onChange={setName} error={shown.name} autoComplete="name" />
                  <Field label="Email" type="email" value={email} onChange={setEmail} error={shown.email} autoComplete="email" />
                </div>

                <fieldset className={`ct-group ${shown.topic ? "has-error" : ""}`}>
                  <legend>What's it about?</legend>
                  <div className="ct-chips" role="radiogroup">
                    {CONTACT_TOPICS.map((t) => (
                      <button key={t} type="button" role="radio" aria-checked={topic === t} className={topic === t ? "active" : ""} onClick={() => setTopic(t)}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {shown.topic && <small className="ct-error">{shown.topic}</small>}
                </fieldset>

                <fieldset className="ct-group">
                  <legend>Where do you sell? <span>Optional</span></legend>
                  <div className="ct-chips">
                    {CONTACT_MARKETPLACES.map((m) => (
                      <button key={m} type="button" aria-pressed={marketplaces.includes(m)} className={marketplaces.includes(m) ? "active" : ""} onClick={() => toggleMarketplace(m)}>
                        {marketplaces.includes(m) && <Check size={13} />}
                        {m}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Field label="Message" textarea value={message} onChange={(v) => setMessage(v.slice(0, MESSAGE_MAX))} error={shown.message} counter={`${message.length} / ${MESSAGE_MAX}`} />

                {/* Hidden from people; bots tend to fill it in. */}
                <div className="ct-trap" aria-hidden="true">
                  <label>
                    Company
                    <input tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </label>
                </div>

                {status.kind === "failed" && <p className="ct-failed" role="alert">{status.message}</p>}

                <div className="ct-submit">
                  <button type="submit" className="calc-cta" disabled={status.kind === "sending"}>
                    {status.kind === "sending" ? (
                      <>
                        <Loader2 size={18} className="ct-spin" /> Sending
                      </>
                    ) : (
                      <>
                        Send message <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                  <p>We only use your details to reply to you.</p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  textarea,
  autoComplete,
  counter,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  textarea?: boolean;
  autoComplete?: string;
  counter?: string;
}) {
  const id = useId();
  const common = {
    id,
    value,
    placeholder: " ",
    autoComplete,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : undefined,
  };
  return (
    <div className={`ct-field ${error ? "has-error" : ""} ${textarea ? "is-area" : ""}`}>
      <div className="ct-box">
        {textarea ? (
          <textarea {...common} rows={6} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input {...common} type={type} onChange={(e) => onChange(e.target.value)} />
        )}
        <label htmlFor={id}>{label}</label>
        {counter && <span className="ct-counter">{counter}</span>}
      </div>
      {error && <small id={`${id}-err`} className="ct-error">{error}</small>}
    </div>
  );
}
