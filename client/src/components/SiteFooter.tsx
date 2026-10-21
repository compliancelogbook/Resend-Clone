import { Github } from "lucide-react";
import { useLocation } from "wouter";
import FooterWatermark from "@/components/FooterWatermark";

const footerColumns = [
  { title: "Features", links: ["Automations", "Audiences", "Broadcasts", "Inbound", "Templates", "Webhooks", "Dedicated IPs"] },
  { title: "Resources", links: ["Changelog", "Pricing", "Enterprise", "Security", "SOC 2", "GDPR", "Brand"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Clubs", "Customers", "Humans", "Philosophy"] },
  { title: "Help", links: ["Contact", "Support", "Status", "Migrate", "Knowledge base", "Legal policies"] },
  { title: "Community", links: ["Events", "Insiders", "Open source", "Wallpapers"] },
];

export default function SiteFooter() {
  const [location] = useLocation();
  return (
    <footer className="site-footer">
      <FooterWatermark />
      <div className="footer-main">
        <div className="footer-intro"><a className="wordmark footer-wordmark" href={location === "/" ? "#top" : "/"}><span className="wordmark-dot" aria-hidden="true" /><span>EasyFeezy</span></a><p>2261 Market Street #5039<br />San Francisco, CA 94114</p><div className="socials"><a href="#x">𝕏</a><a href="#github"><Github size={17} /></a><a href="#linkedin">in</a><a href="#youtube">▶</a></div><span className="system-status"><i /> All systems operational</span></div>
        <div className="footer-links">{footerColumns.map((column) => <section key={column.title}><h3>{column.title}</h3>{column.links.map(link => <a href={`#${link.toLowerCase().replaceAll(" ", "-")}`} key={link}>{link}</a>)}</section>)}</div>
      </div>
    </footer>
  );
}
