/**
 * EasyFeezy homepage: hero with a live example, the agentic commerce demo,
 * products, how we keep numbers trustworthy, and a closing call to action.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CalendarClock, ChevronRight, Coins, Link2, Scale, Target } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HeroResultCard from "@/components/HeroResultCard";
import { AgentDemoSection } from "@/components/AgentDemo";
import "@/components/agent-demo.css";
import "./home.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.54, ease },
};

const PRODUCTS = [
  {
    name: "Fees",
    status: "Free",
    copy: "Verified fee calculators for Shopify, eBay, Etsy, TikTok Shop and Vinted, with break-even and target-margin pricing built in.",
    href: "/shopify-fee-calculator",
    cta: "Calculate fees",
    sample: [
      ["Sale total", "£30.00"],
      ["Shopify fees", "−£0.85"],
      ["Net profit", "£19.15"],
    ],
  },
  {
    name: "Compare",
    status: "Free",
    copy: "Rank every marketplace by net profit on the same sale, or find the list price each one needs for your target profit.",
    href: "/compare",
    cta: "Compare marketplaces",
    sample: [
      ["Vinted", "£20.00"],
      ["Shopify", "£19.15"],
      ["TikTok Shop", "£17.30"],
    ],
  },
  {
    name: "Scan",
    status: "Coming soon",
    copy: "See your catalogue the way AI shopping agents read it, checked against open standards such as the Universal Commerce Protocol.",
    href: "/early-access",
    cta: "Get early access",
    sample: [
      ["Size", "Missing"],
      ["Material", "Missing"],
      ["Price", "Confirmed"],
    ],
  },
];

const TRUST = [
  { icon: Link2, title: "Sourced to the marketplace", copy: "Every rate links to the marketplace's own fee page, so you can check it yourself." },
  { icon: CalendarClock, title: "Dated and kept current", copy: "Each rate shows when it was last verified. Announced changes, like eBay's December rise, switch over automatically." },
  { icon: BadgeCheck, title: "Never guessed", copy: "If a fee depends on something we don't know, we say it's not included. It's never quietly counted as £0." },
  { icon: Coins, title: "VAT made clear", copy: "VAT on fees, and what a VAT-registered seller may reclaim, are shown separately from your profit." },
  { icon: Target, title: "Prices that hold", copy: "Suggested prices never fall short of your target, checked to the penny against the full fee calculation." },
  { icon: Scale, title: "Same rules everywhere", copy: "Calculators, Compare and every suggestion use one set of fee rules, backed by more than 750 automated tests." },
];

export default function Home() {
  useEffect(() => {
    document.title = "EasyFeezy · Commerce intelligence for online sellers";
    if (window.location.hash) {
      window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth" }), 120);
    }
  }, []);

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="hero hero-ef" id="top">
        <div className="hero-glow" aria-hidden="true" />
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }}>
          <Link className="forward-pill" href="/early-access">Coming soon: Readiness for AI shopping agents <ChevronRight size={14} /></Link>
          <h1>Commerce intelligence{" "}<br />to grow your margins</h1>
          <p>Calculate marketplace fees, compare where to sell and get your products ready for AI shopping agents, from your first sale to your ten-thousandth.</p>
          <div className="hero-actions">
            <Link className="button" href="/compare">Start for free</Link>
            <Link className="text-link" href="/early-access">Get early access <ChevronRight size={15} /></Link>
          </div>
        </motion.div>
        <motion.div className="hero-object has-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18, ease }}>
          <HeroResultCard />
        </motion.div>
      </section>

      <section className="home-marketplaces" aria-label="Supported marketplaces">
        <p>Fees and net profit for</p>
        <ul>
          {["Shopify", "eBay", "Etsy", "TikTok Shop", "Vinted"].map((m) => <li key={m}>{m}</li>)}
        </ul>
      </section>

      <AgentDemoSection />

      <section className="section home-products" id="products">
        <motion.div className="centre-heading" {...fadeUp}>
          <span className="calc-pill">Products</span>
          <h2>From the first sale{" "}<br />to every marketplace</h2>
          <p>Start free with Fees and Compare. Add Scan as AI shopping agents arrive.</p>
        </motion.div>
        <div className="home-product-grid">
          {PRODUCTS.map((p, i) => (
            <motion.article key={p.name} className={`home-product ${p.status === "Coming soon" ? "is-soon" : ""}`} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <div className="home-product-top">
                <h3>{p.name}</h3>
                <span>{p.status}</span>
              </div>
              <p>{p.copy}</p>
              <dl className="home-product-sample" aria-hidden="true">
                {p.sample.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd className={v === "Missing" ? "bad" : v === "Confirmed" ? "good" : ""}>{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href={p.href} className="home-product-link">{p.cta} <ArrowRight size={15} /></Link>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="section home-trust" id="verified">
        <motion.div className="centre-heading" {...fadeUp}>
          <span className="calc-pill">Built on verified numbers</span>
          <h2>Numbers you can{" "}<br />build a business on</h2>
          <p>Fee calculators are easy to get almost right. We make sure ours are right, and show our working.</p>
        </motion.div>
        <div className="benefit-grid">
          {TRUST.map(({ icon: Icon, title, copy }) => (
            <motion.div className="benefit-card" key={title} {...fadeUp}>
              <Icon size={24} strokeWidth={1.6} />
              <h3>{title}</h3>
              <p>{copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="section home-founder" aria-label="From the founder">
        <motion.figure {...fadeUp}>
          <span className="home-founder-mark" aria-hidden="true"><i /></span>
          <blockquote>We help you keep your profit, and your products, in the green.</blockquote>
          <figcaption>
            <b>Jade Collins</b>
            <span>Founder, EasyFeezy</span>
          </figcaption>
        </motion.figure>
      </section>

      <section className="section home-cta">
        <motion.div className="home-cta-card" {...fadeUp}>
          <h2>Ready to get started?</h2>
          <p>Calculate fees and compare marketplaces for free. No sign-up needed.</p>
          <div className="hero-actions centred-actions">
            <Link className="button" href="/compare">Start for free</Link>
            <Link className="text-link" href="/early-access">Get early access <ChevronRight size={15} /></Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </main>
  );
}
