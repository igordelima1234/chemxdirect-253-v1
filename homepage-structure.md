# ChemX Direct — Homepage Structure

**Read `brand-styleguide.md` first.** This file defines what goes on the homepage and in what order — all colors, fonts, spacing, and component styles come from that file, not from anything specified here.

## Purpose of this page

The homepage has one job: get a visitor to understand the DIY value proposition immediately, then move them toward either the guided quiz or direct category browsing. Every section below exists to build toward that — don't add sections not listed here without checking back first.

## Section order

1. Hero
2. Why ChemX Direct
3. How it works (guided selector teaser)
4. Shop by category
5. Education / trust
6. Footer

---

## 1. Hero

**Purpose:** Immediate value prop, first impression of brand tone.

**Layout:** Full-width section, navy or white background (try white first — let the sky-blue second headline line carry the color). Headline left-aligned or centered, generous top/bottom padding (96px+ desktop). Two CTAs side by side: primary button + secondary text link.

**Copy:**

- Headline (two lines, H1 style):
  - Line 1 (navy): "Industrial-grade chemistry."
  - Line 2 (sky blue): "Self-serve simplicity."
- Subhead (body large):
  "If your system is simple enough to check yourself, it's simple enough to treat yourself. ChemX Direct helps you find the right product, use it correctly, and know it's working — without paying for a service visit you don't need."
- Primary CTA button: "Find your product" → links to guided quiz
- Secondary CTA (text link): "Browse products" → links to category section/page

**Alternate headline** (keep in reserve, don't build both): "You don't need a rep. You need the right chemical and 5 minutes."

---

## 2. Why ChemX Direct

**Purpose:** Reframe — explain why this model exists before asking anyone to do anything. This is the section that does the actual persuading.

**Layout:** Single column, centered or left-aligned text block, max-width ~700px so the paragraph stays readable. Can sit on a light gray (`--color-gray-50`) background to visually separate from the hero.

**Copy:**

- Headline (H2): "Why pay for a rep when your system doesn't need one?"
- Body: "Full-service water treatment makes sense for complex, high-stakes systems. But if you're running a school boiler, a brewery cooling loop, or a small closed-loop system, you don't need a quarterly site visit — you need the right chemical, a simple test, and someone to call if you get stuck. That's the whole idea behind ChemX Direct."

---

## 3. How it works (guided selector teaser)

**Purpose:** Show the guided quiz is easy before asking anyone to click into it — this is "proof of simplicity."

**Layout:** Centered headline + body, followed by a 3-step visual (numbered or icon-based, horizontal row on desktop, stacked on mobile). CTA button below the steps.

**Copy:**

- Headline (H2): "Not sure what you need? Answer four questions."
- Body: "Tell us what kind of system you're treating and we'll recommend the right product — plus the testing equipment you'll need to use it correctly. No catalog to dig through, no guesswork."
- 3-step visual:
  1. Select your system
  2. Answer a few questions
  3. Get your product
- CTA button: "Start the quiz"

---

## 4. Shop by category

**Purpose:** Direct-browse path for visitors who already know what they need — sits alongside the quiz, not beneath it in priority.

**Layout:** 5-card grid (use the card component from the styleguide). 3 columns on desktop wrapping to 2, single column on mobile. Each card: category name, one-line description, subtle hover state, full card is clickable.

**Copy (5 cards):**

| Category | One-line description |
|---|---|
| Boilers | Oxygen scavengers, dispersants, steam treatment |
| Cooling Towers | Scale, corrosion, and biocide control |
| Closed Loop Systems | Set it, test it occasionally, move on |
| Feed Equipment | Pumps, injectors, and dosing hardware |
| Test Equipment | Meters, indicators, and test kits |

---

## 5. Education / trust

**Purpose:** Close the "am I really okay doing this myself" anxiety before the footer. This is the safety-net message.

**Layout:** Two-part section — main headline/body, then a distinct secondary line (can be a smaller sub-block or a light-background strip) for the contact reassurance so it doesn't get lost under the main message.

**Copy:**

- Headline (H2): "Every product page comes with a how-to, not just a how-much."
- Body: "Dosing instructions, testing steps, and short videos showing the process in action — so you know exactly what to do before the product even arrives."
- Secondary line: "Still have questions? We're one message away." — pair with a contact CTA (button or link)

---

## 6. Footer

**Layout:** Navy background, white/light gray text, standard multi-column or simple single-row layout given the small site size — don't over-build this, ~20 SKUs doesn't need a mega-footer.

**Copy:**

- Tagline: "Industrial-grade. Self-serve simple."
- Nav links: Shop, About, Contact, FAQ

---

## Build notes

- Pull all colors, fonts, spacing, and component styles (buttons, cards) from `brand-styleguide.md` — nothing in this file overrides that.
- This is copy that's already been decided — don't rewrite headlines or body text. If something reads awkwardly in the actual layout, flag it rather than silently changing it.
- The guided quiz itself, individual category pages, and product pages are separate, later builds — this file only covers the homepage.
