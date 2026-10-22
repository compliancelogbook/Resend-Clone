/**
 * Early access: what's coming for paid plans. No sign-up form until an email
 * service is chosen — the page says so rather than pretending to collect emails.
 */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Check, ImageIcon, ScanSearch } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SubscribeForm from "@/components/SubscribeForm";
import "./early-access.css";

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const COMING = [
  {
    icon: ScanSearch,
    title: "Scan",
    copy: "See exactly what AI shopping agents can read in your listings: what's confirmed, what's missing and what conflicts, with clear fixes.",
  },
  {
    icon: Bot,
    title: "Readiness",
    copy: "Check whether AI shopping agents can discover your products, match them to what shoppers ask for, and complete the purchase.",
  },
  {
    icon: ImageIcon,
    title: "Alt Text",
    copy: "Accurate, accessible descriptions for every product photo, based on what's actually in the picture. You approve every word.",
  },
];

export default function EarlyAccess() {
  useEffect(() => {
    document.title = "Early access · EasyFeezy";
    if (window.location.hash) document.querySelector(window.location.hash)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, []);

  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="ea-hero">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
          <span className="calc-pill">Coming soon</span>
          <h1>Built for{" "}<br />agentic commerce</h1>
          <p>
            Shoppers are starting to ask AI agents to find and buy products for them. Scan, Readiness and Alt Text will show
            whether those agents can discover, understand and buy what you sell, and what to fix.
          </p>
        </motion.div>
      </section>

      <section className="ea-grid" aria-label="What's coming">
        {COMING.map(({ icon: Icon, title, copy }, i) => (
          <motion.article key={title} className="ea-card" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5, delay: i * 0.06, ease }}>
            <span className="ea-icon"><Icon size={20} /></span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </motion.article>
        ))}
      </section>

      <section className="ea-subscribe" id="signup">
        <SubscribeForm
          title="Be first to try Scan and Readiness"
          intro="Join early access and we'll email you as soon as they're ready. You can also get our weekly commerce brief."
          defaultLists={["updates"]}
        />
      </section>

      <section className="ea-pricing" id="pricing">
        <h2>Pricing</h2>
        <div className="ea-pricing-grid">
          <div className="ea-plan is-free">
            <p className="calc-eyebrow">Free, always</p>
            <h3>£0</h3>
            <ul>
              <li><Check size={15} /> Fees: calculators for Shopify, eBay, Etsy, TikTok Shop and Vinted</li>
              <li><Check size={15} /> Compare: rank marketplaces by net profit, or price for a target profit</li>
              <li><Check size={15} /> Break-even and target-margin prices</li>
            </ul>
            <Link href="/compare" className="button">Compare your sale <ArrowRight size={15} /></Link>
          </div>
          <div className="ea-plan">
            <p className="calc-eyebrow">Paid plans</p>
            <h3>Coming soon</h3>
            <p>Paid plans launch with Scan, Readiness and Alt Text. We'll publish prices before anything is charged.</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
