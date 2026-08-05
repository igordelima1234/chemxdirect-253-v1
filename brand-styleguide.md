# ChemX Direct — Brand & Design System

**Read this file before building any page or component.** It's the single source of truth for colors, typography, spacing, and tone — don't invent alternatives to what's defined here.

## Positioning

ChemX Direct is a DIY-focused e-commerce brand selling industrial-grade water treatment chemicals directly to small and midsize facilities (schools, small hospitals, microbreweries, distilleries) who don't need a full-service rep relationship.

**Brand line:** "Industrial-grade water treatment chemicals, made simple enough to manage yourself."

**The core tension every design decision should resolve:** industrial-grade credibility *and* approachable simplicity — never sacrifice one for the other. Competitor sites in this category (ChemTreat, Chem-Aqua, ProChemTech) are cold, jargon-heavy, and built to funnel visitors toward "contact a rep." ChemX Direct should feel like the opposite of that — closer to a modern DTC brand that happens to sell serious industrial chemistry.

## Design principles

- **Simple over dense.** No stock photography of pipes/plants, no wall-of-text corporate copy.
- **Typography-led.** The type system should carry most of the visual weight — restrained use of imagery and decoration.
- **Guide, don't just list.** Every page should help someone figure out what they need, not just present a catalog.
- **Plain language always.** No jargon in headlines or body copy — technical terms get explained, not assumed.

## Color system

| Name | Hex | Usage |
|---|---|---|
| Deep navy | `#162229` | Primary — headings, body text, dark sections/header/footer |
| Steel blue | `#387498` | Secondary — supporting UI, secondary buttons, icons, tags |
| Bright sky | `#2A93D3` | Accent — CTAs, links, active states, highlights (use sparingly) |
| White | `#ffffff` | Base background |
| Gray 50 | `#f4f6f7` | Section backgrounds, subtle contrast |
| Gray 100 | `#e2e5e7` | Borders, dividers |
| Gray 500 | `#6b7680` | Secondary/muted text |

**Semantic colors** (status, hazard flags, order states):
- Success: `#2f9e5c`
- Warning: `#d99b1f`
- Danger / hazard: `#c94a3c`
- Info: `#2A93D3` (brand accent)

**Accessibility note:** Bright sky (`#2A93D3`) is only 3.38:1 contrast on white — fine for large text (18px+/bold), icons, and UI elements, but do not use it for white-on-sky body text or small text on a white background. Navy and steel blue both pass AA in all standard pairings.

## Typography

**Headings:** `Barlow Condensed` — bold/extrabold weights (700–800), tight line-height (1.05–1.1). Load from Google Fonts: `family=Barlow+Condensed:wght@700;800`

**Body:** `Public Sans` — regular/medium/semibold weights (400–600), generous line-height (1.5–1.6) for readability. Load from Google Fonts: `family=Public+Sans:wght@400;500;600`

**Type scale (desktop):**

| Element | Font | Weight | Size | Line-height |
|---|---|---|---|---|
| H1 (hero) | Barlow Condensed | 800 | 70px | 1.05 |
| H2 (section) | Barlow Condensed | 700 | 42px | 1.1 |
| H3 (subsection) | Barlow Condensed | 700 | 24px | 1.15 |
| Body large | Public Sans | 400 | 18px | 1.6 |
| Body | Public Sans | 400 | 16px | 1.6 |
| Small / caption | Public Sans | 500 | 13px | 1.4 |

Scale down proportionally on mobile (roughly 60–70% of desktop sizes for headings; body stays close to desktop size for readability).

## Spacing

Use an 8px base unit throughout. Common values: `8, 16, 24, 32, 48, 64, 96` (px). Section vertical padding: `64px` mobile, `96px` desktop. Max content width: `1200px`, centered, with `24px` side padding on mobile.

## Components

**Buttons**
- Primary: sky blue background, white text, bold, rounded (8px radius)
- Secondary: navy or steel blue outline, navy text, transparent background
- Never use bright sky as a button background with small/thin text — pair with bold weight or larger size

**Cards** (category cards, product cards)
- White background, `1px` gray-100 border, `12px` radius, subtle padding (`24px`)
- No drop shadows — keep it flat, consistent with the industrial-but-clean aesthetic

**Accordions** (used heavily on product pages for testing/dosing instructions)
- Navy header text, steel blue expand icon, generous padding — these carry real content weight, don't compress them

**Badges/tags** (category labels, refill indicators)
- Small, steel-blue-tinted background, navy text, rounded pill shape

## Voice and tone

- Plain-spoken, not dumbed-down — explain the "why"
- Peer, not vendor — no "industry-leading," "premium solutions," or sales language
- Confident, not clinical — warm and direct, the opposite of an SDS sheet

## Reference data

Product, category, and quiz logic already exist as structured data — build against these, don't hardcode content that lives in them:
- `decision-tree.json` — guided quiz logic and product results
- `product-test-equipment-map.json` — test kit components and equipment list

## Pages in this prototype

Build in this order:
1. **Styleguide page** — visual reference rendering every token above (colors, type scale, buttons, cards) so brand consistency can be checked at a glance
2. **Homepage** — hero, why ChemX Direct, guided selector teaser, shop by category, education/trust section, footer
3. *(later)* Guided quiz flow, category page, product page

## Notes

- This is a design/brand prototype, not the final Shopify build — don't worry about Shopify-specific constraints (Liquid, theme architecture) here.
- Full copy for each homepage section already exists — pull from the ChemX Direct messaging strategy conversation rather than writing new headlines/body copy from scratch.
