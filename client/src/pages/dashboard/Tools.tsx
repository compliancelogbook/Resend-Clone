/** Fees and Compare inside the dashboard: the website calculators, plus Save. */
import type { ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { CalculatorEmbed } from "@/components/calculator/CalculatorParts";
import ShopifyCalculator from "@/pages/ShopifyCalculator";
import EbayCalculator from "@/pages/EbayCalculator";
import EtsyCalculator from "@/pages/EtsyCalculator";
import TikTokCalculator from "@/pages/TikTokCalculator";
import VintedCalculator from "@/pages/VintedCalculator";
import ComparePage from "@/pages/ComparePage";
import { BASE } from "./Shell";

const MARKETPLACES: { slug: string; name: string; Page: ComponentType }[] = [
  { slug: "shopify-fee-calculator", name: "Shopify", Page: ShopifyCalculator },
  { slug: "ebay-fee-calculator", name: "eBay", Page: EbayCalculator },
  { slug: "etsy-fee-calculator", name: "Etsy", Page: EtsyCalculator },
  { slug: "tiktok-shop-fee-calculator", name: "TikTok Shop", Page: TikTokCalculator },
  { slug: "vinted-fee-calculator", name: "Vinted", Page: VintedCalculator },
];

/** Keeps links between calculators and Compare inside the dashboard. */
const mapHref = (href: string) => (href.startsWith("/compare") ? `${BASE}${href}` : `${BASE}/fees${href}`);

function useSave() {
  const [, navigate] = useLocation();
  return (summary: string) =>
    toast.success("Saved", {
      description: `${summary}. Find it any time under Saved.`,
      action: { label: "View", onClick: () => navigate(`${BASE}/saved`) },
    });
}

export function Fees() {
  const [location] = useLocation();
  const slug = location.split("/fees/")[1]?.split("?")[0];
  const current = MARKETPLACES.find((m) => m.slug === slug) ?? MARKETPLACES[0];
  const { Page } = current;
  const onSave = useSave();
  return (
    <>
      <nav className="db-seg db-tabs" aria-label="Marketplace">
        {MARKETPLACES.map((m) => (
          <Link key={m.slug} href={`${BASE}/fees/${m.slug}`} className={m === current ? "on" : ""}>{m.name}</Link>
        ))}
      </nav>
      <CalculatorEmbed.Provider value={{ embedded: true, onSave, mapHref }}>
        <Page key={current.slug} />
      </CalculatorEmbed.Provider>
    </>
  );
}

export function Compare() {
  const onSave = useSave();
  return (
    <CalculatorEmbed.Provider value={{ embedded: true, onSave, mapHref }}>
      <ComparePage />
    </CalculatorEmbed.Provider>
  );
}
