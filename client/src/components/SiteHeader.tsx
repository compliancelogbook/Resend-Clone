import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { CALCULATOR_LINKS } from "@/lib/calculator-links";

type NavItem = { name: string; desc: string; href?: string };
type NavMenu = { label: string; badge?: string; columns: { title: string; items: NavItem[] }[]; footer?: { text: string; href: string } };

const CALCULATOR_DESCRIPTIONS: Record<string, string> = {
  Shopify: "Plans, Shopify Payments and PayPal",
  eBay: "Private and business sellers",
  Etsy: "Listing, transaction and Offsite Ads fees",
  "TikTok Shop": "Commission, discounts and creators",
  Vinted: "Private and Pro sellers",
};

const MENUS: NavMenu[] = [
  {
    label: "Products",
    columns: [
      {
        title: "Free",
        items: [
          { name: "Fees", desc: "Verified fee calculators for five UK marketplaces", href: "/shopify-fee-calculator" },
          { name: "Compare", desc: "Rank every marketplace by net profit on the same sale", href: "/compare" },
        ],
      },
      {
        title: "Agentic commerce",
        items: [
          { name: "Scan", desc: "See what AI shopping agents can read in your listings" },
          { name: "Readiness", desc: "Can AI agents discover, match and buy your products?" },
          { name: "Alt Text", desc: "Accurate, accessible descriptions for every product photo" },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    columns: [
      {
        title: "By use case",
        items: [
          { name: "Agentic commerce", desc: "Get your products ready for AI shopping agents", href: "/early-access" },
          { name: "Cross-listing", desc: "Find the most profitable marketplace for each sale", href: "/compare" },
          { name: "Pricing for profit", desc: "The list price each marketplace needs for your target profit", href: "/compare?mode=match" },
          { name: "VAT and tax", desc: "Plain-English guidance for UK online sellers" },
        ],
      },
      {
        title: "By marketplace",
        items: CALCULATOR_LINKS.map((c) => ({ name: c.name, desc: CALCULATOR_DESCRIPTIONS[c.name] ?? "", href: c.href })),
      },
    ],
  },
  {
    label: "Agentic Commerce",
    badge: "New",
    columns: [
      {
        title: "Get ready for AI shopping agents",
        items: [
          { name: "Scan", desc: "See what AI shopping agents can and can't read in your listings" },
          { name: "Readiness", desc: "Check whether AI agents can discover, match and buy your products" },
          { name: "Alt Text", desc: "Accurate, accessible descriptions for every product photo" },
        ],
      },
      {
        title: "Learn",
        items: [{ name: "How AI shopping works", desc: "An illustrative walkthrough of an AI agent choosing products", href: "/#agentic" }],
      },
    ],
    footer: { text: "Be first to try it. Get early access", href: "/early-access" },
  },
  {
    label: "Resources",
    columns: [
      {
        title: "Resources",
        items: [
          { name: "Blog", desc: "Daily briefs, marketplace insights and agentic commerce", href: "/blog" },
          { name: "How we calculate", desc: "Our sources, check dates and rounding" },
          { name: "UK seller tax guide", desc: "Plain-English HMRC guidance for online sellers" },
          { name: "Contact", desc: "Feedback, questions and partnerships", href: "/contact" },
        ],
      },
    ],
  },
];

export default function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const onHome = location === "/";
  const navRef = useRef<HTMLElement>(null);

  // Close menus on Escape, on clicks outside, and when the page changes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  return (
    <header className="site-nav" ref={navRef}>
      <a className="wordmark" href={onHome ? "#top" : "/"} aria-label="EasyFeezy home">
        <span className="wordmark-dot" aria-hidden="true" />
        <span>EasyFeezy</span>
      </a>

      <nav className="nav-links" aria-label="Primary navigation">
        {MENUS.map((menu) => (
          <Fragment key={menu.label}>
          {/* Pricing sits just before Resources, which is last. */}
          {menu.label === "Resources" && <Link href="/early-access#pricing" className="nav-plain">Pricing</Link>}
          <div className="nav-menu" onMouseEnter={() => setOpenMenu(menu.label)} onMouseLeave={() => setOpenMenu(null)}>
            <button type="button" aria-expanded={openMenu === menu.label} onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}>
              {menu.label}
              {menu.badge && <span className="nav-badge">{menu.badge}</span>}
              <ChevronDown size={13} strokeWidth={1.7} />
            </button>
            <div className={`nav-mega ${openMenu === menu.label ? "is-open" : ""}`} role="menu">
              <div className="nav-mega-columns">
                {menu.columns.map((col) => (
                  <div className="nav-mega-col" key={col.title}>
                    <p>{col.title}</p>
                    <ul>
                      {col.items.map((item) => (
                        <li key={item.name}>
                          <NavEntry item={item} onNavigate={() => setOpenMenu(null)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {menu.footer && (
                <Link href={menu.footer.href} className="nav-mega-footer" onClick={() => setOpenMenu(null)}>
                  {menu.footer.text} <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
          </Fragment>
        ))}
      </nav>

      <div className="nav-actions">
        <Link href="/early-access" className="button button-small">Get early access</Link>
        <button type="button" className="nav-burger" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="nav-mobile" role="dialog" aria-label="Menu">
          {MENUS.map((menu) => (
            <section key={menu.label}>
              <h2>
                {menu.label}
                {menu.badge && <span className="nav-badge">{menu.badge}</span>}
              </h2>
              {menu.columns.map((col) => (
                <ul key={col.title}>
                  {col.items.map((item) => (
                    <li key={item.name}>
                      <NavEntry item={item} onNavigate={() => setMobileOpen(false)} />
                    </li>
                  ))}
                </ul>
              ))}
            </section>
          ))}
          <Link href="/early-access" className="button nav-mobile-cta" onClick={() => setMobileOpen(false)}>Get early access</Link>
        </div>
      )}
    </header>
  );
}

function NavEntry({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const body = (
    <>
      <b>
        {item.name}
        {!item.href && <em>Soon</em>}
      </b>
      <span>{item.desc}</span>
    </>
  );
  if (!item.href) return <div className="nav-entry is-soon">{body}</div>;
  if (item.href.startsWith("/#")) {
    return <a className="nav-entry" href={item.href} onClick={onNavigate}>{body}</a>;
  }
  return <Link className="nav-entry" href={item.href} onClick={onNavigate}>{body}</Link>;
}
