/** Where confirmation links land after /api/subscribe/confirm. */
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, CircleAlert } from "lucide-react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { NEWSLETTER_LISTS } from "@shared/subscribe-options";

const COPY = {
  ok: { title: "You're subscribed", text: "Thanks for confirming. Your first email will arrive with the next edition." },
  expired: { title: "That link has expired", text: "Confirmation links last 48 hours. Sign up again and we'll send a fresh one." },
  invalid: { title: "That link isn't valid", text: "It may have been copied incompletely. Sign up again and we'll send a new link." },
  error: { title: "Something went wrong", text: "We couldn't confirm your subscription just now. Please try the link again shortly." },
} as const;

export default function Subscribed() {
  const params = new URLSearchParams(window.location.search);
  const status = (params.get("status") ?? "invalid") as keyof typeof COPY;
  const copy = COPY[status] ?? COPY.invalid;
  const lists = (params.get("lists") ?? "").split(",");
  const names = NEWSLETTER_LISTS.filter((l) => lists.includes(l.id)).map((l) => l.name);
  const ok = status === "ok";

  useEffect(() => {
    document.title = `${copy.title} · EasyFeezy`;
  }, [copy.title]);

  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="ea-hero">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className={`sub-icon ${ok ? "" : "is-warn"}`}>{ok ? <Check size={28} /> : <CircleAlert size={26} />}</span>
          <h1 style={{ fontSize: "clamp(38px, 4.4vw, 60px)" }}>{copy.title}</h1>
          <p>{copy.text}</p>
          {ok && names.length > 0 && <p style={{ marginTop: 14, color: "#8ff0c6" }}>{names.join(" · ")}</p>}
          <div className="hero-actions centred-actions" style={{ marginTop: 34 }}>
            <Link className="button" href={ok ? "/blog" : "/blog#subscribe"}>{ok ? "Read the latest posts" : "Sign up again"}</Link>
          </div>
        </motion.div>
      </section>
      <SiteFooter />
    </main>
  );
}
