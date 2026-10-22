/**
 * Posts for 22 October 2026, written from the owner's raw morning brief.
 * Stories marked verified: false still need their claims checked against the
 * original source before the post can be published.
 */
import type { BlogPost } from "./types";

const ETSY_TRENDS = { name: "Etsy trend report", date: "14 October 2026", url: "https://www.etsy.com/trends" };
const ZMEDIA = { name: "Z Media (third-party TikTok Shop UK tracking)", date: "Week ending 11 October 2026" };

export const POSTS_2026_10_22: BlogPost[] = [
  {
    slug: "daily-brief-2026-10-22",
    category: "Daily Brief",
    date: "2026-10-22",
    title: "Personal gifts lead Christmas demand as AI agents start to buy",
    summary:
      "Etsy shoppers are searching for personalised, shared experiences. TikTok Shop UK buyers are getting more selective. And in agentic commerce, the conversation is shifting from infrastructure to real purchases.",
    readMinutes: 3,
    status: "draft",
    blocks: [
      {
        type: "takeaways",
        items: [
          "Christmas demand on Etsy is turning personal: craft kits, friendship gifts and decorated tables are all rising fast in search.",
          "TikTok Shop UK is showing sharp week-on-week swings. Strong category sales don't guarantee a product will keep selling.",
          "Retailers and payment providers are building formal routes for AI shopping agents, with permissions and spending limits.",
        ],
      },
      { type: "h2", text: "Marketplaces" },
      {
        type: "p",
        text: "Etsy's latest trend data points to gifting that feels personal or shared: DIY craft activities, gifts for friends and pets, and coordinated Christmas tables. On TikTok Shop UK, autumn outerwear looks to be cooling, and affordable make-up is holding up better than some once-viral beauty devices.",
      },
      { type: "cta", label: "Read the marketplace insights", href: "/blog/etsy-christmas-tiktok-shop-uk-2026-10-22" },
      { type: "h2", text: "Agentic commerce" },
      {
        type: "p",
        text: "Meta is reported to have shared the first figures on people buying through its Muse AI agent. Walmart and Stripe are setting clearer rules for what agents can access, buy and pay for. Shopify's Shop MCP, opened to compatible agents on 13 October, is already live.",
      },
      { type: "cta", label: "Read the agentic commerce update", href: "/blog/agentic-commerce-update-2026-10-22" },
      { type: "h2", text: "What it means for sellers" },
      {
        type: "p",
        text: "Fast-growing searches are a signal, not a margin. Personalised and bundled products bring extra making time, packaging and postage, so check the numbers before you commit stock. And as more shopping runs through AI agents, clear sizes, materials, prices and stock levels in your listings matter more than ever.",
      },
      { type: "cta", label: "Compare your margins across marketplaces", href: "/compare" },
    ],
  },
  {
    slug: "etsy-christmas-tiktok-shop-uk-2026-10-22",
    category: "Marketplace Insights",
    date: "2026-10-22",
    title: "Christmas on Etsy turns personal, while TikTok Shop UK buyers get selective",
    summary:
      "Search interest in craft kits, friendship gifts and decorative tables is climbing on Etsy. On TikTok Shop UK, outerwear is cooling and affordable make-up is outlasting viral beauty devices.",
    readMinutes: 5,
    status: "draft",
    blocks: [
      {
        type: "callout",
        title: "About this data",
        text: "Etsy's figures cover signed-in US shoppers over the three months to 14 September 2026, compared with a year earlier. They show search interest, not confirmed UK sales. TikTok Shop figures come from third-party tracking, not audited platform totals.",
      },
      { type: "h2", text: "Etsy" },
      {
        type: "story",
        title: "Christmas craft experiences",
        status: "Accelerating",
        stats: [{ value: "+8,500%", label: "Searches for DIY activities, year on year" }],
        body: [
          "Christmas crafting is becoming something people do together. Shoppers are looking for activities they can share, not just finished decorations.",
          "Opportunity: DIY decoration kits, beginner-friendly craft bundles and personalised group activities.",
        ],
        caveat:
          "This is growth in searches, not purchases. Kits sell best with clear contents, quantities and photos of the finished project.",
        sources: [ETSY_TRENDS],
        verified: false,
      },
      {
        type: "story",
        title: "Gifts for friends and pets",
        status: "Accelerating, seasonal",
        stats: [
          { value: "+1,400%", label: "Personalised friend gifts" },
          { value: "2×", label: "Pet gift searches" },
          { value: "+37%", label: "\"Friendsmas\" party supply sales" },
        ],
        body: [
          "Gifting is reaching beyond family. Etsy's own holiday trend edit describes traditions widening to include friends and pets.",
          "Opportunity: friendship keepsakes, personalised pet decorations and small group-gifting sets.",
        ],
        caveat:
          "Personalisation adds making time and the cost of mistakes. Build both into your price before Christmas orders arrive.",
        sources: [ETSY_TRENDS],
        verified: false,
      },
      {
        type: "story",
        title: "Decorative Christmas tables",
        status: "Accelerating, seasonal",
        stats: [
          { value: "+841%", label: "Ruffle tablecloths" },
          { value: "+68%", label: "Lace table items" },
          { value: "+33%", label: "Custom napkins" },
        ],
        body: [
          "Hosts are moving towards coordinated, decorative tables rather than purely practical tableware.",
          "Opportunity: personalised place settings, napkin accessories and small hosting bundles.",
        ],
        caveat: "Bundles can raise order value, but packaging and postage can quickly eat the extra margin.",
        sources: [ETSY_TRENDS],
        verified: false,
      },
      { type: "h2", text: "TikTok Shop UK" },
      {
        type: "story",
        title: "Autumn outerwear is cooling",
        status: "Seasonal, slowing",
        stats: [
          { value: "£94k", label: "PUFFIT rain jacket, reported weekly sales" },
          { value: "£220k", label: "Trespass, entering the UK top ten" },
        ],
        body: [
          "Seasonal demand is clear, but several established outerwear and workwear products fell week on week. The early autumn surge may already be easing.",
          "For sellers: strong category sales aren't a reason to pay ever-higher creator commissions.",
        ],
        sources: [ZMEDIA],
        verified: false,
      },
      {
        type: "story",
        title: "Affordable make-up outlasts viral devices",
        status: "Diverging",
        stats: [
          { value: "+23%", label: "P.Louise Treat Trio, week on week (about £234k)" },
          { value: "−35%", label: "medicube UK, brand level" },
        ],
        body: [
          "Affordable products that are easy to demonstrate on camera are proving more resilient than some once-viral skincare devices, which may be reaching saturation.",
        ],
        sources: [ZMEDIA],
        verified: false,
      },
      {
        type: "story",
        title: "One to watch: pirate-inspired boots",
        status: "Early signal",
        stats: [{ value: "+153%", label: "Searches for men's pirate boots on Etsy" }],
        body: ["An unusual niche that may outlast Halloween: theatrical and historically inspired footwear."],
        caveat: "Search growth alone doesn't show lasting demand or profit.",
        sources: [ETSY_TRENDS],
        verified: false,
      },
      { type: "cta", label: "Check your Etsy margins", href: "/etsy-fee-calculator", text: "Personalised and bundled products cost more to make and post. See what you actually keep." },
    ],
  },
  {
    slug: "agentic-commerce-update-2026-10-22",
    category: "Agentic Commerce",
    date: "2026-10-22",
    title: "Agentic commerce moves from infrastructure to real purchases",
    summary:
      "Meta is reported to have shared the first figures on people buying through its Muse agent, Walmart and Stripe are formalising what agents can do, and Shopify's Shop MCP is live for compatible agents.",
    readMinutes: 5,
    status: "draft",
    blocks: [
      {
        type: "takeaways",
        items: [
          "Reported Muse figures would be among the first evidence of shoppers actually buying through an AI agent at scale.",
          "Retailers and payment providers are adding permissions, spending limits and approval steps for agents.",
          "None of these developments is confirmed for UK shoppers yet.",
        ],
      },
      {
        type: "story",
        title: "Meta shares Muse shopping figures",
        status: "Live in the US and Canada",
        stats: [
          { value: "10m+", label: "Muse accounts reported, US and Canada" },
          { value: "25%+", label: "Of users reported to have bought through it" },
          { value: "$200+", label: "Reported average purchase" },
        ],
        body: [
          "Muse is Meta's personal AI agent. It can help with shopping as well as other tasks, with payments handled by partners such as Link by Stripe and Shop Pay.",
          "Reported comments from Meta's third-quarter results suggest people are buying through it, not just browsing. Meta hasn't said how merchants are chosen or ranked.",
        ],
        caveat:
          "These are company-reported figures, not audited data. Muse's September launch and shopping features are confirmed; the user and purchase figures still need checking against Meta's results.",
        sources: [
          { name: "Meta Q3 2026 results (reported by AP News and MarketWatch)", date: "21 October 2026" },
          { name: "Communicate Online: Meta launches Muse", url: "https://communicateonline.me/news/meta-launches-muse-ai-agent-to-send-emails-book-trips-and-shop-online/" },
        ],
        verified: false,
      },
      {
        type: "story",
        title: "Walmart sets rules for shopping agents",
        status: "US, launching from November",
        body: [
          "Walmart is reported to be introducing a formal route for approved AI assistants to shop with it: separate agent profiles with their own permissions and spending limits, a gateway built on MCP, and terms covering customer approval and data access.",
          "Walmart says agents must see the same prices as human shoppers.",
        ],
        caveat: "Announced for the US. No UK rollout has been announced.",
        sources: [{ name: "Walmart News", date: "21 October 2026" }],
        verified: false,
      },
      {
        type: "story",
        title: "Stripe gives agents a way to pay",
        status: "Rolling out",
        body: [
          "Stripe's Link wallet lets agents pay on a shopper's behalf, issuing a single-use card for each task, with the shopper approving every payment.",
          "Stripe is also reported to be extending its Treasury product so businesses can let agents check balances, pay invoices and move money, with human approval where they choose.",
        ],
        caveat:
          "Link wallets for agents are confirmed by Stripe. The Treasury extension still needs checking. UK availability isn't confirmed for either.",
        sources: [
          { name: "Stripe Sessions 2026", url: "https://stripe.com/gb/newsroom/news/sessions-2026" },
          { name: "Stripe announcement", date: "21 October 2026" },
        ],
        verified: false,
      },
      {
        type: "story",
        title: "Shopify opens Shop MCP to compatible agents",
        status: "Live",
        body: [
          "Since 13 October, compatible AI agents can search Shopify's catalogue, build carts and complete approved Shop Pay purchases without a separate partnership.",
          "Search needs no API key; checkout needs the shopper's approval. Shopify says existing catalogue integrations don't need any changes.",
        ],
        caveat: "Shopify hasn't shared how many sales come through agents, so the commercial impact for individual merchants isn't yet measurable.",
        sources: [{ name: "Shopify developer changelog", url: "https://shopify.dev/changelog/posts/add-shopping-and-shop-pay-checkout-to-any-agent-with-shop-mcp", date: "13 October 2026" }],
        verified: false,
      },
      {
        type: "story",
        title: "Google's agentic checkout is still invite-only",
        status: "Restricted",
        body: [
          "Google's checkout through the Universal Commerce Protocol is limited to selected merchants with eligible products in the US, Canada and Australia. UK eligibility isn't confirmed.",
          "A product-level setting decides whether a product shows Google's agentic checkout button, so complete product data on its own doesn't make you eligible.",
        ],
        sources: [{ name: "Google Merchant Center: UCP profile guide", url: "https://developers.google.com/merchant/ucp/guides/overview/ucp-profile" }],
        verified: false,
      },
      { type: "h2", text: "What it means for sellers" },
      {
        type: "p",
        text: "The question is shifting from \"can an AI agent find my product?\" to \"can an approved agent understand it, buy it and record the sale?\" That puts a premium on clear, complete product data: variants, stock, prices and policies an agent can read without guessing.",
      },
      { type: "cta", label: "See how AI agents read listings", href: "/#agentic", text: "Scan, coming soon, shows what agents can and can't read in your catalogue." },
    ],
  },
];
