/** Privacy, Terms and affiliate disclosure share one calm reading layout. */
import { useEffect } from "react";
import { Link } from "wouter";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { COMPANY, LEGAL_DOCS, type LegalDoc } from "@/content/legal";
import "./legal.css";

const NAV: { slug: LegalDoc["slug"]; label: string }[] = [
  { slug: "privacy", label: "Privacy" },
  { slug: "terms", label: "Terms" },
  { slug: "affiliate-disclosure", label: "How we make money" },
];

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function Legal({ slug }: { slug: LegalDoc["slug"] }) {
  const doc = LEGAL_DOCS[slug];
  useEffect(() => {
    document.title = `${doc.title} · EasyFeezy`;
    window.scrollTo(0, 0);
  }, [doc.title]);

  return (
    <main className="site-shell">
      <SiteHeader />
      <article className="legal">
        <header className="legal-head">
          <nav className="legal-tabs" aria-label="Legal pages">
            {NAV.map((n) => (
              <Link key={n.slug} href={`/${n.slug}`} className={n.slug === slug ? "active" : ""} aria-current={n.slug === slug ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <h1>{doc.title}</h1>
          <p>{doc.intro}</p>
          <time dateTime={doc.updated}>Last updated {formatDate(doc.updated)}</time>
        </header>
        <div className="legal-body">
          <ol className="legal-toc" aria-label="On this page">
            {doc.sections.map((s, i) => (
              <li key={s.heading}><a href={`#s${i + 1}`}>{s.heading}</a></li>
            ))}
          </ol>
          <div className="legal-sections">
            {doc.sections.map((s, i) => (
              <section key={s.heading} id={`s${i + 1}`}>
                <h2>{s.heading}</h2>
                {s.body.map((p) => <p key={p}>{p}</p>)}
                {s.links && (
                  <ul className="legal-links">
                    {s.links.map((l) => (
                      <li key={l.href}><a href={l.href} target="_blank" rel="noopener noreferrer">{l.label} ↗</a></li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            <footer className="legal-foot">
              {COMPANY.operatorName}, trading as {COMPANY.tradingName}. Company number {COMPANY.companyNumber}, registered in {COMPANY.registeredIn}. {COMPANY.registeredOffice}. <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
            </footer>
          </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
