/**
 * Privacy, Terms and affiliate disclosure, kept as data so tests can check
 * the claims. Every claim must match what the site actually does today.
 * Update these pages BEFORE adding analytics, cookies, accounts or payments.
 */

export const COMPANY = {
  operatorName: "Compliance Logbook Ltd",
  tradingName: "EasyFeezy",
  companyNumber: "16932013",
  registeredIn: "England and Wales",
  registeredOffice: "71–75 Shelton Street, Covent Garden, London, WC2H 9JQ",
  contactEmail: "info@easyfeezy.com",
} as const;

export interface LegalSection {
  heading: string;
  body: string[];
  links?: { label: string; href: string }[];
}

export interface LegalDoc {
  slug: "privacy" | "terms" | "affiliate-disclosure";
  title: string;
  intro: string;
  updated: string; // ISO date
  sections: LegalSection[];
}

const C = COMPANY;
const who = `EasyFeezy is a trading name of ${C.operatorName} (company number ${C.companyNumber}), registered in ${C.registeredIn}. Registered office: ${C.registeredOffice}.`;

export const PRIVACY: LegalDoc = {
  slug: "privacy",
  title: "Privacy policy",
  intro: "What we collect, why, and the choices you have. In short: the calculators keep your numbers in your browser, and we only hold your email address if you give it to us.",
  updated: "2026-10-23",
  sections: [
    {
      heading: "Who we are",
      body: [`${who} ${C.operatorName} is the controller for the personal data described in this policy.`],
    },
    {
      heading: "The calculators and Compare",
      body: [
        "The fee calculators and Compare run in your browser. The figures you enter, such as prices, costs, postage and categories, are used to work out a result on your screen. They are not sent to us or stored by us.",
        "Some links carry your figures in the web address, for example when you move from Compare to a calculator. That address stays in your browser unless you choose to share it.",
      ],
    },
    {
      heading: "Contact form",
      body: [
        "When you send a message through our contact form, we receive your name, email address, the topic and any marketplaces you pick, and your message. We use this to read and reply to you.",
        "Our email provider, Resend, delivers the message to our inbox, which is hosted by Google Workspace. We keep correspondence for as long as we need to deal with it and for our reasonable business records. You can ask us to delete it at any time.",
        "Our lawful basis is legitimate interests: replying to a message you chose to send us.",
      ],
    },
    {
      heading: "Newsletter",
      body: [
        "If you sign up, we hold your email address and the newsletters you chose (The Weekly Brief, Daily Brief and Product Updates). We only add you after you click the link in our confirmation email.",
        "Our lawful basis is your consent. Every email includes an unsubscribe link, and you can withdraw consent at any time by using it or by emailing us. We keep your email address while you are subscribed, and remove or suppress it when you unsubscribe so we don't email you again.",
        "Resend stores your address, the date you confirmed and the newsletters you chose, and sends our emails on our behalf. This lets us show that you agreed.",
      ],
    },
    {
      heading: "Cookies and tracking",
      body: [
        "EasyFeezy does not set cookies, use browser storage, or run analytics, advertising or tracking scripts. Because nothing non-essential is stored on your device, we don't show a cookie banner.",
        "If we ever add analytics or similar tools, we will update this policy first and ask for your consent where the law requires it.",
      ],
    },
    {
      heading: "Security and technical information",
      body: [
        "To protect our forms from abuse, our server briefly keeps the IP address of each form submission in memory, for up to 10 minutes, to limit repeated attempts. It is not written to a database.",
        "Like any website, our hosting provider may process technical information when you visit, such as your IP address, browser type, the page requested and the time. We don't use it to identify you. Retention is set by the hosting provider.",
      ],
    },
    {
      heading: "Who we share data with",
      body: [
        "We don't sell your personal data. We share it only with the providers who help us run the site:",
        "Resend, for sending and receiving email and managing newsletter subscriptions. Google Workspace, for our inbox. Our website hosting provider, for delivering the site.",
        "Some of these providers may process data outside the UK, including in the United States. Where they do, we rely on the safeguards the law allows, such as the UK International Data Transfer Addendum or the UK–US data bridge.",
      ],
      links: [
        { label: "Resend privacy policy", href: "https://resend.com/legal/privacy-policy" },
        { label: "Google privacy policy", href: "https://policies.google.com/privacy" },
      ],
    },
    {
      heading: "Affiliate links",
      body: [
        "Some pages may include a clearly labelled partner link. If you click one, you leave EasyFeezy and the partner's own privacy policy applies. We don't share your calculator figures or contact details with partners. See our affiliate disclosure for more.",
      ],
    },
    {
      heading: "Your rights",
      body: [
        "Under UK data protection law, you can ask to see the personal data we hold about you, correct it, delete it, restrict or object to how we use it, or receive a copy in a portable format. Some rights depend on the circumstances.",
        `To make a request, email ${C.contactEmail}. We aim to reply within one month.`,
        "You can also complain to the Information Commissioner's Office (ICO). We'd appreciate the chance to put things right first.",
      ],
      links: [{ label: "ICO: your data protection rights", href: "https://ico.org.uk/for-the-public/" }],
    },
    {
      heading: "Changes to this policy",
      body: ["We'll update this page when what we do with data changes, and change the date at the top."],
    },
  ],
};

export const TERMS: LegalDoc = {
  slug: "terms",
  title: "Terms of use",
  intro: "The rules for using EasyFeezy. Please read them before relying on a result.",
  updated: "2026-10-23",
  sections: [
    {
      heading: "Who these terms are with",
      body: [`${who} "EasyFeezy", "we", "us" and "our" mean ${C.operatorName}. By using this site, you agree to these terms.`],
    },
    {
      heading: "What EasyFeezy provides",
      body: [
        "EasyFeezy provides free marketplace fee calculators, a comparison tool, articles and a newsletter. These are information tools, not personal advice.",
        "Paid products marked as coming soon are not yet available. Separate terms will apply when they launch.",
      ],
    },
    {
      heading: "Results depend on your inputs",
      body: [
        "Every result depends on the figures and options you enter. Where a fee is variable, unknown or not covered, we show it as not included rather than guessing. A result is an estimate, not a quote from the marketplace.",
      ],
    },
    {
      heading: "Fees and rules change",
      body: [
        "Marketplaces set their own fees, rules and VAT treatment, and can change them at any time. HMRC sets tax rules. Check the marketplace's current terms, and HMRC guidance where relevant, before making an important decision based on a result.",
      ],
    },
    {
      heading: "Not personal advice",
      body: [
        "Nothing on EasyFeezy is legal, tax, accounting or financial advice. For decisions that depend on your circumstances, speak to a qualified professional.",
      ],
    },
    {
      heading: "Articles and newsletter",
      body: [
        "Our articles summarise news and link to the original sources. We check them carefully, but sources can change or be corrected after publication. Follow the source links for the full story.",
      ],
    },
    {
      heading: "Partner links",
      body: [
        "Some pages may contain labelled affiliate links. We may earn a commission if you sign up through them. They never change our calculations or the order of results. Your use of a partner's service is governed by that partner's terms.",
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "You may use EasyFeezy for your own personal or business purposes. You must not scrape or copy the site at scale, overload or interfere with it, misuse our forms, or present a result as an official marketplace quote or tax assessment.",
        "The EasyFeezy name, logo, design and written content belong to us or our licensors and may not be copied or used for a competing service without permission.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "We work hard to keep EasyFeezy accurate, but we provide it as it is, without promising it is complete, error-free or always available. To the extent the law allows, we are not liable for losses arising from reliance on a result or from using, or being unable to use, the site.",
        "Nothing in these terms limits our liability for death or personal injury caused by our negligence, for fraud, or for anything else that cannot be limited under the law of England and Wales. If you are a consumer, nothing here affects your legal rights.",
      ],
    },
    {
      heading: "Third-party sites",
      body: [
        "We link to marketplaces, official guidance and news sources so you can check figures and stories. We are not responsible for their content or availability.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "We may change, add or remove features at any time, and update these terms. The date at the top shows when they last changed.",
      ],
    },
    {
      heading: "Law and contact",
      body: [
        "These terms are governed by the law of England and Wales, and its courts deal with any dispute.",
        `Questions about these terms? Email ${C.contactEmail}.`,
      ],
    },
  ],
};

export const AFFILIATE: LegalDoc = {
  slug: "affiliate-disclosure",
  title: "How we make money",
  intro: "EasyFeezy's calculators are free. Some pages include partner links, and this page explains how they work.",
  updated: "2026-10-23",
  sections: [
    {
      heading: "Partner links",
      body: [
        "Some marketplaces run affiliate programmes. When we link to one through its programme, we may earn a commission if you sign up or buy. You don't pay anything extra.",
        "Partner links are always labelled \"Ad\" and sit beside your result, never inside it.",
      ],
    },
    {
      heading: "What partners can't change",
      body: [
        "Commissions never affect our calculations, the fees we show, or the order of results in Compare. Every marketplace is calculated with the same rules, whether or not we have a partnership with it.",
        "We only add a partner link when it's useful for the page you're on, such as a free trial for sellers who don't have a store yet.",
      ],
    },
    {
      heading: "Your data",
      body: [
        "We don't share your figures or contact details with partners. If you click a partner link, the partner's own terms and privacy policy apply on their site.",
      ],
    },
    {
      heading: "Our other income",
      body: [
        "In future, we plan to offer paid products for sellers, such as Scan. These will be clearly priced and optional. The fee calculators will stay free.",
        `Questions? Email ${C.contactEmail}.`,
      ],
    },
  ],
};

export const LEGAL_DOCS = { privacy: PRIVACY, terms: TERMS, "affiliate-disclosure": AFFILIATE } as const;
