import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { CALCULATOR_LINKS } from "@/lib/calculator-links";

export const MARK = "/manus-storage/resend-clone-mark_105e07a8.png";

const navGroups = ["Features", "Calculators", "Resources", "Help", "Docs", "AI"];

export default function SiteHeader() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [location] = useLocation();
  const onHome = location === "/";

  return (
    <header className="site-nav">
      <a className="wordmark" href={onHome ? "#top" : "/"} aria-label="EasyFeezy home">
        <img className="wordmark-mark" src={MARK} alt="" />
        <span>EasyFeezy</span>
      </a>
      <nav className="nav-links" aria-label="Primary navigation">
        {navGroups.map((item) => (
          <div className="nav-menu" key={item} onMouseEnter={() => setOpenMenu(item)} onMouseLeave={() => setOpenMenu(null)}>
            <button type="button" aria-expanded={openMenu === item} onClick={() => setOpenMenu(openMenu === item ? null : item)}>
              {item}<ChevronDown size={13} strokeWidth={1.7} />
            </button>
            <div className={`nav-popover ${openMenu === item ? "is-open" : ""}`}>
              {item === "Calculators" ? (
                <>
                  <span>Free fee calculators</span>
                  <ul className="nav-popover-list">
                    {CALCULATOR_LINKS.map((calc) => (
                      <li key={calc.name}>
                        {calc.href ? (
                          <Link href={calc.href} onClick={() => setOpenMenu(null)}>{calc.name}</Link>
                        ) : (
                          <span className="nav-popover-soon">{calc.name}<em>Soon</em></span>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <span>{item} at EasyFeezy</span>
                  <p>Explore the developer email platform.</p>
                </>
              )}
            </div>
          </div>
        ))}
        <a href="#pricing">Pricing</a>
      </nav>
      <div className="nav-actions">
        <a className="login-link" href="#login">Log in</a>
        <a className="button button-small" href="#get-started">Get started</a>
      </div>
    </header>
  );
}
