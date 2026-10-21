import { Link, useLocation } from "wouter";
import { CALCULATOR_LINKS } from "@/lib/calculator-links";

type FooterLink = { label: string; href?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Products",
    links: [
      { label: "Fees", href: "/shopify-fee-calculator" },
      { label: "Compare", href: "/compare" },
      { label: "Scan" },
      { label: "Readiness" },
      { label: "Alt Text" },
    ],
  },
  { title: "Calculators", links: CALCULATOR_LINKS.map((c) => ({ label: c.name, href: c.href })) },
  {
    title: "Solutions",
    links: [
      { label: "Agentic commerce", href: "/early-access" },
      { label: "Cross-listing", href: "/compare" },
      { label: "Pricing for profit", href: "/compare?mode=match" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Early access", href: "/early-access" },
      { label: "Pricing", href: "/early-access#pricing" },
      { label: "Privacy" },
      { label: "Terms" },
    ],
  },
];

export default function SiteFooter() {
  const [location] = useLocation();
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-intro">
          <a className="wordmark footer-wordmark" href={location === "/" ? "#top" : "/"}>
            <span className="wordmark-dot" aria-hidden="true" />
            <span>EasyFeezy</span>
          </a>
          <p>Commerce intelligence for online sellers. Fee calculations are estimates based on each marketplace's published rates.</p>
          <p className="footer-copy">© {new Date().getFullYear()} EasyFeezy</p>
        </div>
        <div className="footer-links">
          {COLUMNS.map((column) => (
            <section key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map((link) =>
                link.href ? (
                  <Link href={link.href} key={link.label}>{link.label}</Link>
                ) : (
                  <span className="footer-soon" key={link.label}>{link.label} <em>Soon</em></span>
                ),
              )}
            </section>
          ))}
        </div>
      </div>
    </footer>
  );
}
