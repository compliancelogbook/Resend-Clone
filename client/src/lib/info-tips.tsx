/**
 * Plain-English explanations behind the ⓘ icons on the calculators.
 * Rates quoted here must match the fee data in client/src/data.
 */
import type { ReactNode } from "react";

export const TIPS: Record<string, Record<string, ReactNode>> = {
  etsy: {
    offsiteAds: (
      <>
        <p>Etsy advertises listings on sites like Google, Instagram and Pinterest. If a buyer clicks one of those ads and buys from you, Etsy charges a fee on the order total, including postage, capped at US$100 per order.</p>
        <ul>
          <li>15% for most shops.</li>
          <li>12% for shops with over US$10,000 in Etsy sales in the last 12 months.</li>
        </ul>
        <p><b>Not sure?</b> Open the order in Etsy. If you see “Offsite Ad fee” under Marketing costs, it applied, and that line shows the rate.</p>
      </>
    ),
    currency: (
      <p>Etsy charges 2.5% when it converts a sale from your listing currency into your payment account currency. A UK shop pricing in pounds with a UK bank account usually won't pay it.</p>
    ),
    vat: (
      <p>Etsy adds 20% VAT to its fees unless you've added a VAT number to your Etsy account. VAT-registered sellers may be able to reclaim it.</p>
    ),
    vatNumber: (
      <p>With a VAT number on your Etsy account, Etsy doesn't add VAT to its fees. You account for it yourself under the reverse charge. Without one, Etsy adds 20%, including on Offsite Ads.</p>
    ),
    fx: (
      <p>Etsy's listing fee is US$0.20, charged in dollars. At 0.75 that's £0.15, or £0.18 with VAT. Your Etsy bill shows the exact amount.</p>
    ),
  },
  ebay: {
    sellerType: (
      <>
        <p><b>Private:</b> selling your own belongings. UK private sellers pay no selling fees, except on vehicles.</p>
        <p><b>Business:</b> buying to resell, making items to sell, or selling regularly for profit. eBay requires a business account, and fees depend on the category.</p>
      </>
    ),
    category: <p>eBay's final value fee depends on the category you list in. Choose the same category as your eBay listing.</p>,
    regionBusiness: (
      <p>eBay adds an international fee when the buyer's delivery address is outside the UK: 1.05% for the Eurozone and Northern Europe, 1.8% for the US and Canada, and 2% elsewhere.</p>
    ),
    regionPrivate: <p>Private sellers only pay eBay a fee when the buyer's delivery address is outside the UK: 3% of the total sale, including postage.</p>,
    currency: <p>If eBay converts the payment into a different currency, it charges a conversion fee: 2.5%, rising to 2.75% from 1 December 2026.</p>,
    topRated: (
      <p>Top Rated Sellers get 10% off the final value fee on listings that meet eBay's Top Rated Plus requirements. It doesn't reduce the per-order fee. Look for the Top Rated Plus badge on your listing.</p>
    ),
    vat: <p>eBay's business fees don't include VAT, so eBay adds 20% on top. VAT-registered sellers may be able to reclaim it.</p>,
    freeListings: <p>UK private sellers get 300 free listings a month, or 400 with an eBay Shop. After that, each new listing costs 35p.</p>,
  },
  shopify: {
    plan: <p>Your Shopify subscription. Higher plans cost more each month but charge less per card payment. You can check yours in Shopify under Settings, then Plan.</p>,
    payment: (
      <>
        <p><b>Shopify Payments</b> is Shopify's own card processing.</p>
        <p>With any other provider, Shopify adds its own transaction fee on top of that provider's fees. The exception is PayPal orders when Shopify Payments is your main provider.</p>
      </>
    ),
    card: <p>UK cards pay the standard rate. Cards issued abroad, and American Express, pay a higher rate.</p>,
    planCost: <p>Your monthly plan isn't taken from each sale, but it's still a cost. Enter roughly how many orders you get a month to share it across each one.</p>,
  },
  tiktok: {
    category: <p>TikTok Shop charges commission on each sale: 5% or 9% depending on the category, already including VAT.</p>,
    promo: <p>Some sellers, often new ones, get a lower commission rate for a limited time. Only use this if TikTok has confirmed a rate for your shop.</p>,
    sellerDiscount: <p>A discount you pay for, like a voucher you created. It lowers the price TikTok charges commission on.</p>,
    platformDiscount: <p>A promotion TikTok pays for. TikTok still charges commission on the full price, because it covers the discount itself.</p>,
    creator: <p>If the sale came from a creator's video or live, you pay them the commission you agreed, between 1% and 80%. Leave blank if no creator was involved.</p>,
    other: <p>Anything else TikTok charged you for this order that has no set price list, like Fulfilled by TikTok, ads or returns. Use the amount on your statement.</p>,
    vat: <p>TikTok Shop's commission rates already include VAT. VAT-registered sellers may be able to reclaim it.</p>,
  },
  vinted: {
    sellerType: (
      <>
        <p><b>Private:</b> selling your own things. Vinted charges sellers no selling fee. The buyer pays a Buyer Protection fee instead.</p>
        <p><b>Pro:</b> a registered business on Vinted Pro. Your prices must already include any VAT you owe.</p>
      </>
    ),
    bump: <p>Bumps and Showcase are optional paid boosts that move your items up in search. Vinted shows the price when you buy one.</p>,
  },
};
