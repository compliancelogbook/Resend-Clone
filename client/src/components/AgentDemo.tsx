/**
 * Homepage agentic commerce demo: an AI shopping agent reads two listings
 * against a shopper's request, skips the one it can't verify, and Scan shows
 * the fix. Entirely illustrative — labelled as such, with no promise that any
 * real agent will recommend a product.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, RotateCcw, ScanSearch, Shirt, Sparkles, X } from "lucide-react";
import { Link } from "wouter";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const REQUEST = "I need a cotton hoodie in size M, under £40, delivered by Friday.";

type Check = { label: string; value: string; ok: boolean };
type Listing = { who: string; title: string; price: string; checks: Check[] };

const CHECK_LABELS = ["Price", "Size", "Material", "Delivery"];

function listings(fixed: boolean): { yours: Listing; other: Listing } {
  return {
    yours: {
      who: "Your listing",
      title: "Navy Hoodie",
      price: "£35.00",
      checks: [
        { label: "Price", value: "£35, under £40", ok: true },
        { label: "Size", value: fixed ? "S, M, L, XL" : "Not stated", ok: fixed },
        { label: "Material", value: fixed ? "100% cotton" : "Not stated", ok: fixed },
        { label: "Delivery", value: "Arrives Thursday", ok: true },
      ],
    },
    other: {
      who: "Another seller",
      title: "Cotton Pullover Hoodie",
      price: "£38.00",
      checks: [
        { label: "Price", value: "£38, under £40", ok: true },
        { label: "Size", value: "M in stock", ok: true },
        { label: "Material", value: "100% cotton", ok: true },
        { label: "Delivery", value: "Arrives Friday", ok: true },
      ],
    },
  };
}

// Timeline (ms from start): request, agent replies, listings appear, checks tick in, verdict, Scan suggestion.
const STEPS = [0, 900, 1900, 2600, 4200, 5200];

export default function AgentDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();
  const [fixed, setFixed] = useState(false);
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setStep(STEPS.length - 1);
      return;
    }
    setStep(-1);
    const timers = STEPS.map((t, i) => window.setTimeout(() => setStep(i), t));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, run, reduced]);

  const { yours, other } = listings(fixed);
  const yourWins = fixed;
  const showChecks = step >= 3;
  const showVerdict = step >= 4;

  function replay(nextFixed: boolean) {
    setFixed(nextFixed);
    setRun((r) => r + 1);
  }

  return (
    <div className="agd" ref={ref}>
      <div className="agd-window">
        <div className="agd-bar">
          <span className="agd-dots" aria-hidden="true"><i /><i /><i /></span>
          <span>AI shopping agent</span>
          <span className="agd-tag">Illustrative example</span>
        </div>

        <div className="agd-chat" aria-live="polite">
          <AnimatePresence>
            {step >= 0 && (
              <motion.p key={`q${run}`} className="agd-msg is-shopper" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
                {REQUEST}
              </motion.p>
            )}
            {step >= 1 && (
              <motion.p key={`a${run}`} className="agd-msg is-agent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
                <Sparkles size={14} />
                {step < 4 ? "Checking listings against your size, material, budget and delivery date…" : yourWins ? "Both match. I'd go with the Navy Hoodie: it's £3 cheaper and arrives sooner." : "I found one hoodie I can confirm matches everything you asked for."}
              </motion.p>
            )}
          </AnimatePresence>

          {step >= 2 && (
            <div className="agd-listings">
              {[yours, other].map((l, i) => {
                const recommended = showVerdict && (i === 0 ? yourWins : !yourWins);
                const skipped = showVerdict && i === 0 && !yourWins;
                return (
                  <motion.article
                    key={`${l.who}${run}`}
                    className={`agd-card ${recommended ? "is-picked" : ""} ${skipped ? "is-skipped" : ""}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.12, ease }}
                  >
                    <div className="agd-card-head">
                      <span className="agd-thumb"><Shirt size={26} strokeWidth={1.4} /></span>
                      <div>
                        <small>{l.who}</small>
                        <b>{l.title}</b>
                        <span>{l.price}</span>
                      </div>
                    </div>
                    <ul>
                      {l.checks.map((c, ci) => (
                        <motion.li
                          key={c.label}
                          className={showChecks ? (c.ok ? "ok" : "bad") : ""}
                          initial={false}
                          animate={{ opacity: showChecks ? 1 : 0.35 }}
                          transition={{ duration: 0.3, delay: showChecks ? ci * 0.18 : 0 }}
                        >
                          <span className="agd-icon">{showChecks ? (c.ok ? <Check size={12} /> : <X size={12} />) : null}</span>
                          <span>{CHECK_LABELS[ci]}</span>
                          <em>{showChecks ? c.value : "…"}</em>
                        </motion.li>
                      ))}
                    </ul>
                    <div className="agd-verdict">
                      {showVerdict && (recommended ? <span className="picked">Recommended</span> : skipped ? <span className="skipped">Skipped: size and material unclear</span> : <span className="also">Also matches</span>)}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step >= 5 && (
          <motion.aside key={`scan${fixed}${run}`} className={`agd-scan ${fixed ? "is-fixed" : ""}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }}>
            <span className="agd-scan-icon"><ScanSearch size={18} /></span>
            <div>
              <p className="agd-scan-title">{fixed ? "Scan: no gaps found" : "Scan found 2 gaps"}</p>
              <p>{fixed ? "Size and material are now stated in your listing, so agents can match it to this request." : "Agents couldn't confirm the size or material, so your listing was skipped even though it's cheaper."}</p>
            </div>
            {fixed ? (
              <button type="button" onClick={() => replay(false)}><RotateCcw size={14} /> Replay</button>
            ) : (
              <button type="button" className="primary" onClick={() => replay(true)}>Apply fixes <ArrowRight size={14} /></button>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AgentDemoSection() {
  return (
    <section className="section agd-section" id="agentic">
      <motion.div className="centre-heading" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.54, ease }}>
        <span className="calc-pill">Agentic commerce</span>
        <h2>Prepare your catalogue{" "}<br />for AI shopping agents</h2>
        <p>Shoppers are asking AI agents to find and buy products for them. Agents pass over listings they can't verify.{" "}<br />Scan reads your catalogue the way they do, and shows exactly what to fix.</p>
      </motion.div>
      <AgentDemo />
      <p className="agd-footnote">
        Illustrative example. AI shopping agents are rolling out market by market, and no tool can guarantee an agent will recommend your products.{" "}
        <Link href="/early-access">Get early access to Scan</Link>
      </p>
    </section>
  );
}
