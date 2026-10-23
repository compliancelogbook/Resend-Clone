/** Dashboard frame: shop and plan switcher, grouped menu, profile, top bar and Ask. */
import { useState, type ReactNode } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Bookmark,
  Calculator,
  ChevronsUpDown,
  CircleHelp,
  CreditCard,
  House,
  LayoutList,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Radar,
  Scale,
  ScanSearch,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

export const BASE = "/preview/dashboard";

type NavItem = { label: string; icon: typeof House; href?: string; soon?: boolean };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Your shop", items: [
    { label: "Home", icon: House, href: BASE },
    { label: "Scans", icon: ScanSearch, href: `${BASE}/scans` },
    { label: "Listings", icon: LayoutList, soon: true },
    { label: "Saved", icon: Bookmark },
  ] },
  { group: "Tools", items: [
    { label: "Fees", icon: Calculator },
    { label: "Compare", icon: Scale },
    { label: "Readiness", icon: Radar, soon: true },
  ] },
  { group: "Account", items: [
    { label: "Settings", icon: Settings },
    { label: "Billing", icon: CreditCard },
  ] },
];

function isActive(location: string, href?: string) {
  if (!href) return false;
  return href === BASE ? location === BASE || location === `${BASE}/` : location.startsWith(href);
}

function Sidebar() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  return (
    <aside className={`db-side ${open ? "open" : ""}`}>
      <button className="db-menu-btn" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <button className="db-shop" type="button">
        <span className="db-shop-mark">J</span>
        <span className="db-shop-name">Jade's Shop</span>
        <span className="db-plan">Plus</span>
        <ChevronsUpDown size={15} className="db-shop-chev" />
      </button>
      <nav className="db-nav">
        {NAV.map((g) => (
          <div className="db-nav-group" key={g.group}>
            {g.items.map((it) => {
              const cls = `db-nav-item ${isActive(location, it.href) ? "active" : ""} ${it.soon ? "soon" : ""}`;
              const inner = (
                <>
                  <it.icon size={17} strokeWidth={1.7} />
                  <span>{it.label}</span>
                  {it.soon && <em>Soon</em>}
                </>
              );
              return it.href ? (
                <Link key={it.label} href={it.href} className={cls} onClick={() => setOpen(false)}>{inner}</Link>
              ) : (
                <span key={it.label} className={cls} title="Not designed yet">{inner}</span>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="db-user">
        <span className="db-avatar">J</span>
        <span className="db-user-mail">jade@jadesshop.co.uk</span>
        <MoreHorizontal size={16} />
      </div>
    </aside>
  );
}

/** Preview-only switch between a returning user and a first visit (no scans yet). */
function PreviewBar() {
  const [location] = useLocation();
  const first = new URLSearchParams(useSearch()).get("state") === "empty";
  const scans = `${BASE}/scans`;
  return (
    <div className="db-preview-bar">
      <span className="db-preview-label">Preview · example data</span>
      <Link href={scans} className={!first && location.startsWith(scans) ? "on" : ""}>Returning user</Link>
      <Link href={`${scans}?state=empty`} className={first ? "on" : ""}>First visit</Link>
    </div>
  );
}

export function Shell({ title, crumb, action, children }: { title: string; crumb?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="db">
      <PreviewBar />
      <div className="db-frame">
        <Sidebar />
        <main className="db-main">
          <header className="db-top">
            <div>
              {crumb && <div className="db-crumb">{crumb}</div>}
              <h1>{title}</h1>
            </div>
            <div className="db-top-right">
              <a href="#" onClick={(e) => e.preventDefault()}><CircleHelp size={15} /> Help</a>
              <a href="#" className="db-feedback" onClick={(e) => e.preventDefault()}><MessageSquare size={14} /> Feedback</a>
              {action}
            </div>
          </header>
          <div className="db-content">{children}</div>
        </main>
      </div>
      <button className="db-ask" type="button"><Sparkles size={15} /> Ask</button>
    </div>
  );
}
