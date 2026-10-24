/** Pricing: plans, compare all features, common questions. */
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PlanCards from "@/components/PlanCards";
import PlanCompare from "@/components/PlanCompare";
import "./early-access.css";
import "./pricing.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const FAQS: { q: string; a: ReactNode }[] = [
  { q: "Are the fee calculators really free?", a: <p>Yes. The calculators for Shopify, eBay, Etsy, TikTok Shop and Vinted, and Compare, are free for every seller, private or business. You don't need an account to use them.</p> },
  { q: "When do paid plans launch?", a: <p>Paid plans launch with Scan. We'll publish prices before anything is charged. <Link href="/early-access#signup">Join early access</Link> and we'll email you first.</p> },
  { q: "What does Scan check?", a: <p>Scan reads your product listings and shows what buyers, marketplaces and AI shopping agents can and can't read: titles, prices, brands, barcodes, stock, delivery, images and alt text. Each fix shows why it matters and which products it affects.</p> },
  { q: "Can AI shopping agents be guaranteed to show my products?", a: <p>No one can promise that. Scan checks your product data against the standards agents read. It can't control where they show your products.</p> },
  { q: "Can I cancel?", a: <p>Yes, paid plans can be cancelled any time, and you keep your plan until the end of the period you've paid for.</p> },
  { q: "How does EasyFeezy make money?", a: <p>From paid plans, and from clearly labelled partner links that never affect our calculations. <Link href="/affiliate-disclosure">How we make money</Link></p> },
];

export default function Pricing() {
  useEffect(() => {
    document.title = "Pricing · EasyFeezy";
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="ea-hero pr-hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <h1>Start free.<br />Grow when you're ready.</h1>
          <p>Fee calculators and Compare are free for every seller. Paid plans add Scan, alt text and, later, Readiness.</p>
          <a href="#compare" className="pr-jump">Compare all features <ChevronDown size={15} /></a>
        </motion.div>
      </section>

      <section className="pr-section">
        <PlanCards mode="site" />
      </section>

      <section className="pr-section" id="compare">
        <h2>Compare all features</h2>
        <PlanCompare />
      </section>

      <section className="pr-section pr-faq">
        <h2>Questions</h2>
        <div className="pr-faq-list">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}<ChevronDown size={18} /></summary>
              <div>{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="pr-cta">
        <h2>Check your numbers today</h2>
        <p>Free fee calculators for five marketplaces. No sign-up.</p>
        <div className="pr-cta-actions">
          <Link href="/compare" className="button">Compare your sale <ArrowRight size={15} /></Link>
          <Link href="/early-access#signup" className="pr-ghost">Join early access</Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
