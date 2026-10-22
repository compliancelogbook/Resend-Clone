/**
 * Posts for 22 October 2026, written from the owner's morning brief. All stories checked against their sources.
 * Stories marked verified: false still need their claims checked against the
 * original source before the post can be published.
 */
import type { BlogPost } from "./types";

const ETSY_TRENDS = { name: "Etsy: Seller Trend Report, Fall and Winter 2026", date: "14 October 2026", url: "https://www.etsy.com/seller-handbook/article/1521255894814" };
const ZMEDIA = { name: "Z Media: TikTok Shop UK trending products and top creators, week ending 11 October", date: "12 October 2026", url: "https://www.z.media/insights/tiktok-shop-uk-trending-week-ending-2026-10-11" };

export const POSTS_2026_10_22: BlogPost[] = [
  {
    slug: "daily-brief-2026-10-22",
    category: "Daily Brief",
    date: "2026-10-22",
    title: "Personal gifts lead Christmas demand as AI shopping agents scale up",
    summary:
      "Etsy shoppers are searching for personalised, shared experiences. TikTok Shop UK buyers are getting more selective. And in agentic commerce, the conversation is shifting from infrastructure to real shoppers.",
    readMinutes: 3,
    status: "published",
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
        text: "Meta says more than 10 million people in the US and Canada have set up its Muse AI agent. Walmart and Stripe are setting clearer rules for what agents can access, buy and pay for. Shopify's Shop MCP, opened to compatible agents on 13 October, is already live.",
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
    status: "published",
    blocks: [
      {
        type: "callout",
        title: "About this data",
        text: "Etsy's figures compare search (and some sales) data for the three months to 14 September 2026 with the same period last year. Some figures cover US shoppers only. They show interest on Etsy, not confirmed UK sales. TikTok Shop figures come from third-party tracking, not audited platform totals.",
      },
      { type: "h2", text: "Etsy" },
      {
        type: "story",
        title: "Christmas craft experiences",
        status: "Accelerating",
        stats: [
          { value: "+8,500%", label: "DIY activities" },
          { value: "+470%", label: "Needlepoint bags, with Gen Z shoppers" },
          { value: "+125%", label: "Sewing patterns for beginners" },
        ],
        body: [
          "Christmas crafting is becoming something people do together. Shoppers are looking for activities they can share, not just finished decorations.",
          "Opportunity: DIY decoration kits, beginner-friendly craft bundles and personalised group activities.",
        ],
        caveat:
          "This is growth in searches, not purchases. Kits sell best with clear contents, quantities and photos of the finished project.",
        sources: [ETSY_TRENDS],
        verified: true,
      },
      {
        type: "story",
        title: "Gifts for friends and pets",
        status: "Accelerating, seasonal",
        stats: [
          { value: "+1,400%", label: "Personalised friend gifts" },
          { value: "2×", label: "Pet gifting searches" },
          { value: "+22%", label: "Pet tree decorations" },
          { value: "+37%", label: "\"Friendsmas\" party supply sales" },
        ],
        body: [
          "Gifting is reaching beyond family. Etsy's own holiday trend edit describes traditions widening to include friends and pets.",
          "Opportunity: friendship keepsakes, personalised pet decorations and small group-gifting sets.",
        ],
        caveat:
          "Personalisation adds making time and the cost of mistakes. Build both into your price before Christmas orders arrive.",
        sources: [ETSY_TRENDS],
        verified: true,
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
        verified: true,
      },
      { type: "h2", text: "TikTok Shop UK" },
      {
        type: "story",
        title: "Autumn outerwear is cooling",
        status: "Seasonal, slowing",
        stats: [
          { value: "£94k", label: "PUFFIT rain jacket weekly sales, down 28% on the week before" },
          { value: "£220k", label: "Trespass, entering the UK top ten" },
        ],
        body: [
          "Seasonal demand is clear, but several established outerwear and workwear products fell week on week. The early autumn surge may already be easing.",
          "For sellers: strong category sales aren't a reason to pay ever-higher creator commissions.",
        ],
        sources: [ZMEDIA],
        verified: true,
      },
      {
        type: "story",
        title: "Affordable make-up outlasts viral devices",
        status: "Diverging",
        stats: [
          { value: "+23%", label: "P.Louise Treat Trio, week on week (£234k)" },
          { value: "−35%", label: "medicube UK brand sales, £930k to £603k" },
        ],
        body: [
          "Affordable products that are easy to demonstrate on camera are proving more resilient than some once-viral skincare devices, which may be reaching saturation.",
        ],
        sources: [ZMEDIA],
        verified: true,
      },
      {
        type: "story",
        title: "One to watch: freaky festive shoes",
        status: "Early signal",
        stats: [
          { value: "+153%", label: "Men's pirate boots" },
          { value: "+155%", label: "Rain boots" },
          { value: "+55%", label: "Slip shoes" },
        ],
        body: ["Etsy calls it \"freaky festive shoes\": statement footwear that gives people something to talk about at Christmas parties, from pirate-inspired boots to weather-defying rain boots."],
        caveat: "Search growth alone doesn't show lasting demand or profit.",
        sources: [ETSY_TRENDS],
        verified: true,
      },
      { type: "cta", label: "Check your Etsy margins", href: "/etsy-fee-calculator", text: "Personalised and bundled products cost more to make and post. See what you actually keep." },
    ],
  },
  {
    slug: "agentic-commerce-update-2026-10-22",
    category: "Agentic Commerce",
    date: "2026-10-22",
    title: "Agentic commerce moves from infrastructure to real shoppers",
    summary:
      "Meta says more than 10 million people have Muse accounts, Walmart and Stripe are formalising what agents can do, and Shopify's Shop MCP is live for compatible agents.",
    readMinutes: 5,
    status: "published",
    blocks: [
      {
        type: "takeaways",
        items: [
          "Meta says more than 10 million people in the US and Canada have set up its Muse shopping agent, and about a quarter use it daily.",
          "Retailers and payment providers are adding permissions, spending limits and approval steps for agents.",
          "None of these developments is confirmed for UK shoppers yet.",
        ],
      },
      {
        type: "story",
        title: "Meta shares Muse adoption figures",
        status: "Live in the US and Canada",
        stats: [
          { value: "10m+", label: "People with Muse accounts, US and Canada" },
          { value: "~25%", label: "Of them use Muse on a given day" },
        ],
        body: [
          "Muse is Meta's personal AI agent for adults, able to help with shopping as well as other tasks, with payments handled by partners such as Link by Stripe and Shop Pay.",
          "On Meta's third-quarter results call, Mark Zuckerberg said more than 10 million people in the US and Canada have set up Muse accounts, and about a quarter use it on any given day.",
          "That's millions of people already letting an AI agent help them shop. Meta hasn't said how merchants are chosen or ranked.",
        ],
        caveat: "These are company-reported figures, not audited data. Muse isn't available in the UK.",
        sources: [
          { name: "AP News: Meta Q3 revenue tops estimates and Zuckerberg says Muse accounts have topped 10 million", url: "https://apnews.com/article/meta-earnings-facebook-instagram-muse-capex-13ecd6c459e39a3602f302bcc2412fe9", date: "21 October 2026" },
        ],
        verified: true,
      },
      {
        type: "story",
        title: "Walmart opens its doors to shopping agents",
        status: "US, profiles from November",
        body: [
          "Walmart is giving approved AI agents an official way to shop for customers. Its Agent Gateway, built on MCP, lets agents search Walmart and Sam's Club inventory and buy on a shopper's behalf, without receiving their personal details or purchase history.",
          "Agent Profiles sit inside a customer's account, keeping each agent's orders separate. Shoppers can approve every purchase or set a spending cap. Walmart compares it to adding an authorised user to a credit card, and says agents must see the same prices as people do.",
          "Coverage names Meta's Muse, ChatGPT and Gemini among the agents it expects to support. It's a sharp contrast with Amazon, which has blocked outside agents, including Muse.",
        ],
        caveat: "Announced for the US, with Agent Profiles rolling out from November and the Gateway starting in a beta. No UK rollout has been announced.",
        sources: [
          { name: "Walmart News: Making It Possible for Agents to Shop on Behalf of Customers", date: "21 October 2026" },
          { name: "TechCrunch: While Amazon blocks AI agents, Walmart rolls out the welcome mat", url: "https://techcrunch.com/2026/10/21/while-amazon-blocks-ai-agents-walmart-rolls-out-the-welcome-mat/", date: "21 October 2026" },
        ],
        verified: true,
      },
      {
        type: "story",
        title: "Stripe lets agents pay, and run business finances",
        status: "Public preview",
        body: [
          "Stripe's Link wallet lets agents pay on a shopper's behalf, issuing a single-use card for each task, with the shopper approving every payment.",
          "On 21 October Stripe launched Treasury for agents. Connected through Stripe's MCP server, agents such as ChatGPT and Claude can check balances, pay invoices, move money between accounts and convert currencies. A person must approve anything that moves live money.",
          "Card creation and agent spending limits are coming soon. Agentic commerce is spreading from the shopper's checkout into how sellers run their business.",
        ],
        caveat: "Treasury for agents is in public preview and depends on Stripe Treasury eligibility. UK availability isn't confirmed.",
        sources: [
          { name: "Stripe: Introducing Stripe Treasury for agents", url: "https://stripe.com/newsroom/news/treasury-for-agents", date: "21 October 2026" },
          { name: "Stripe docs: Agentic Treasury", url: "https://docs.stripe.com/treasury/agents" },
          { name: "Stripe Sessions 2026", url: "https://stripe.com/gb/newsroom/news/sessions-2026" },
        ],
        verified: true,
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
        sources: [{ name: "Shopify: Add shopping and Shop Pay checkout to any agent with Shop MCP", url: "https://shopify.dev/changelog/posts/add-shopping-and-shop-pay-checkout-to-any-agent-with-shop-mcp", date: "13 October 2026" }],
        verified: true,
      },
      {
        type: "story",
        title: "Google's agentic checkout is still invite-only",
        status: "Restricted",
        body: [
          "Google's checkout through the Universal Commerce Protocol is limited to selected merchants with eligible products in the US, Canada and Australia. UK eligibility isn't confirmed.",
          "Only listings using a specific product attribute, native_commerce(checkout_eligibility), show the Buy button for this checkout, and merchants must apply to join. Complete product data on its own doesn't make you eligible.",
        ],
        sources: [
          { name: "Google Merchant Center Help: About the Universal Commerce Protocol (UCP) and UCP-powered checkout", url: "https://support.google.com/merchants/answer/16837055?hl=en" },
        ],
        verified: true,
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
