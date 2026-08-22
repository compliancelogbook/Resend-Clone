# Reference Evidence Record

## Scope

The local implementation follows the user-supplied `https://resend.com/` homepage and the supplied section screenshots. It is a reference-led reproduction intended for local review; the original site’s public runtime and supplied screenshots are the evidence baseline.

## Public Runtime Findings

| Evidence area | Observed finding | Implementation consequence |
|---|---|---|
| Framework | Public runtime exposes `/_next/static/immutable/` chunks and a Turbopack bootstrap file. | The original is a Next.js runtime; this reproduction uses the existing React + Vite project scaffold while preserving the visible page behaviour. |
| Global state | The root uses `dark` and `scroll-smooth` classes. | Use a fixed dark visual mode and smooth in-page anchor behaviour. |
| Font families | The runtime preloads ABC Favorit, Domaine, Commit Mono, and Inter. | Use the recovered public font assets: Domaine for the hero display, ABC Favorit for interface/body, and Commit Mono for code/data. |
| Hero type | The observed `h1` is `96px / 96px`, `letter-spacing: -0.96px`, and rendered in Domaine. | Match desktop hero typography exactly where the responsive viewport permits. |
| Page extent | Observed runtime page height is approximately `12,256px` at a `1280 × 1100` viewport. | Preserve the same broad section cadence and amount of editorial whitespace. |
| Navigation | The header is sticky and `58px` high. | Keep a sticky, translucent black header with a quiet hairline boundary. |
| Shared content | The source page supplies all page copy, section hierarchy, tab labels, code samples, link labels, footer groups, and product labels. | Do not rephrase page content. |

## Recovered Public Visual Assets

| Reference asset | Managed implementation asset |
|---|---|
| Hero floor image | `/manus-storage/bg-hero-1_70d280af.jpg` |
| Light ray background | `/manus-storage/bg-light_280ddaa3.png` |
| Broadcast editor image | `/manus-storage/broadcast-email-header_9491a1e4.jpg` |
| Audience panel image | `/manus-storage/screenshot-zoom-audience_24a264c7.png` |
| Analytics panel image | `/manus-storage/screenshot-zoom-analytics_362794c2.png` |
| Metrics dashboard image | `/manus-storage/screenshot-metrics_95f656ab.png` |
| ABC Favorit Book | `/manus-storage/abc-favorit-book_e608c48a.woff2` |
| ABC Favorit Medium | `/manus-storage/abc-favorit-medium_5253ffa8.woff2` |
| Domaine Regular | `/manus-storage/domaine-regular_96798b33.woff2` |
| Commit Mono Regular | `/manus-storage/commit-mono-regular_2c9ce43c.woff2` |

## Source Availability and Constraints

The official GitHub organisation exposes SDKs, examples, and related packages, but no homepage source repository was identified in the public repository search. The source map/recon utility could not complete because its required internal browser-loader module is not distributed with the skill. The reconstruction therefore uses the publicly served runtime evidence, page content, provided screenshots, recovered first-party assets, and the browser-observed HTML structure. No analytics or tracking scripts will be included in the local implementation.

## Local Verification Note

The local page loaded with the intended sticky navigation, reference section sequence, dark visual system, hero composition, SDK choice controls, framework tabs, code panel, product visuals, control selector, testimonials, and footer. Desktop and mobile full-page checks were captured. The framework selector was then exercised to `Next.js`; its active state changed and the code panel rendered the expected `process.env.RESEND_API_KEY` and `export async function POST()` variant. Managed visual assets reported complete, the scroll behaviour reported `smooth`, and the local browser console reported no runtime error entries.
