# CITYGRAM — Full Figma landing page prompt

Use this document as the **canonical creative brief** for the marketing landing page in Figma. It extends the product context in [`CITYGRAM.md`](../CITYGRAM.md) and design tokens in `src/app/globals.css` (light/dark, foreground, background, muted, accent).

**Production note:** The live route is [`src/app/page.tsx`](../src/app/page.tsx). Until design is implemented, on-page copy and layout may differ from this brief—treat this file as the **target** flagship marketing experience.

---

## Brief

**Design a high-impact, modern landing page for a social platform called CITYGRAM.** This page should feel exciting, cultural, premium, and emotionally immediate — not like a generic SaaS homepage. The goal is to make users instantly feel that this app is different and that their city is the center of the experience. The visual direction should build on the existing CITYGRAM marketing landing structure and messaging in the handoff notes provided, including the city-first concept, live cities section, Passport Mode, and closing CTA.

### Overall Creative Direction

Create a landing page that feels like:

- the internet for your city
- culture moving in real time
- local energy, relevance, and urgency
- a premium social product with strong editorial taste
- modern, mobile-first, and visually magnetic

This should not look like a basic startup template. It should feel like a real product with momentum. Think **city culture + premium social UI + bold editorial design + mobile-native energy**.

### Brand Feel

CITYGRAM is a city-first social network where your home city is the default world. The design should communicate:

- local first, not algorithm first
- neighborhood energy
- real people, places, and city movement
- discovery through proximity and culture
- travel through “Passport Mode”

The user should immediately think:

**“This is my city’s network. I want in.”**

---

## Page Structure

Design a full landing page with these sections:

### 1. Sticky Header

A clean sticky top navigation with:

- CITYGRAM logo lockup on the left
- Sign In text link
- Join / Claim Your City primary button on the right

Style:

- translucent background
- subtle blur
- thin bottom border
- premium, clean, modern
- compact but polished

---

### 2. Hero Section

This is the most important section.

#### Layout

Use a **split layout**:

- left side: headline, subheadline, CTA, support text
- right side: layered mobile app mockups showing the CITYGRAM product in action

#### Hero Headline

Use:

**Your city has its own internet.**

#### Subheadline

Use:

**CITYGRAM turns your city into the main character. See what’s happening around you first — the people, places, neighborhoods, and energy that actually matter where you live.**

#### Support Contrast Line

Add a short contrast statement under the subheadline:

**Most social apps show you the world.  
CITYGRAM shows you home first.**

#### Buttons

Primary:

**Claim Your City**

Secondary:

**See How It Works**

#### Hero Visual

On the right side, design a premium stacked mobile mockup composition showing:

- a local city feed
- neighborhood-based content
- nearby happenings
- creator or community posts
- a city switch / Passport Mode preview
- subtle social activity indicators

The phones should feel alive and dimensional:

- layered depth
- soft glow
- floating UI cards
- blurred gradient background
- subtle map/grid texture
- motion-ready composition

This hero should feel like the city is active inside the screens.

---

### 3. Live Cities Section

Turn the existing “Live Cities” section into something more energetic and visually impressive. The handoff already includes Atlanta, Austin, and Portland with stat ideas, so preserve that concept but make it feel more alive and premium.

#### Section Heading

**Already moving in real cities**

#### Layout

Three high-design city cards in a responsive grid:

- Atlanta
- Austin
- Portland

Each card should include:

- city name
- short cultural tagline
- activity stat
- subtle signal/status dot
- distinct city tint or accent mood

Suggested city card feel:

- Atlanta: bold, fast, warm, electric
- Austin: creative, fresh, teal, independent
- Portland: cool, curated, neighborhood-driven

Cards should feel like mini city portals, not boring info boxes.

---

### 4. Why CITYGRAM Feels Different

Before going into mechanics, create a benefits section that sells why this product matters.

#### Section Heading

**Why CITYGRAM feels different**

#### 3 Feature Columns

**Your city comes first**  
No fighting a global algorithm to find what matters around you.

**Neighborhood energy**  
Follow the local pockets, scenes, and communities that shape your real-world experience.

**Travel with context**  
Passport Mode lets you tap into another city like someone who lives there, not like an outsider.

Design this section with strong iconography or visual accents, but keep it clean and premium.

---

### 5. How It Works

Use a 3-step section, based on the original handoff structure, but make it more visually polished and easier to scan.

#### Section Heading

**How it works**

#### Steps

**01 — Pick your city**  
Start with the place you actually live.

**02 — Follow your neighborhood**  
Build your feed around your local world.

**03 — Use Passport Mode**  
Explore other cities without losing your own home base.

Style:

- bold step numbers
- editorial spacing
- modern product explainer design
- mono or technical-style numbering is okay if tasteful

---

### 6. Passport Mode Feature Section

Make this a major premium section and a visual highlight.

#### Eyebrow

**PASSPORT MODE**

#### Heading

**Travel the culture, not just the map.**

#### Body Copy

**Switch cities and experience the local pulse like someone who actually lives there. Discover what’s moving, who’s posting, and what matters before you even arrive.**

#### Visual Direction

Show a side-by-side or transitioning mobile UI concept:

- one phone for Home City
- one phone for Passport Mode
- visual transition between cities
- maybe ATL to NYC or ATL to LA style energy

This section should feel cinematic, sleek, and aspirational.

---

### 7. Final CTA Section

Close with a bold, emotionally strong invitation.

#### Heading

**Your city is already moving. You should be in the feed.**

#### Supporting Copy

**Join CITYGRAM and experience a social network designed around where you live, not what an algorithm guesses.**

#### CTA Button

**Join CITYGRAM**

#### Microcopy

**Free to join · No algorithm-first feed · City-first by design**

This section should feel confident, clean, and conversion-focused.

---

### 8. Footer

Simple but polished footer with:

- CITYGRAM logo
- short descriptor: **City-first social**
- disclaimer: **Original product · Not affiliated with any other platform**
- optional footer links

Keep it minimal and premium.

---

## Visual Style Directions

### Aesthetic

- premium social product
- editorial layout
- mobile-native design language
- clean but emotionally charged
- subtle urban sophistication
- high-end startup meets local culture platform

### Avoid

- generic SaaS illustrations
- cartoonish assets
- bland gradients with no structure
- clutter
- overdesigned crypto-style UI
- stock-template feel

### Use

- bold typography
- sharp spacing
- layered app mockups
- soft glows
- translucent cards
- city signal motifs
- subtle grid/map overlays
- refined contrast
- motion-ready composition

---

## Typography

Use typography to create drama and clarity.

Suggested approach:

- large editorial display headline
- clean sans-serif for body/UI
- strong hierarchy
- occasional italic emphasis for sophistication
- oversized section headings
- compact high-contrast UI labels

The type should feel modern, cultural, and confident.

**In code today:** Outfit (UI/body) and Fraunces (display) are loaded in `src/app/layout.tsx`—Figma can mirror these or evolve them while keeping hierarchy consistent.

---

## Color Direction

Build from the CITYGRAM token direction in the handoff, but make it more dynamic through composition and accent use rather than random color overload.

Recommended feel:

- soft warm neutral or light background
- dark high-contrast text
- teal or signal-green accents
- city-specific tinted cards
- subtle glows behind product mockups
- premium contrast, not loud chaos

Optional alternate concept:

- dark-mode hero with glowing screens on top of a rich charcoal city-grid background
- lighter sections below for contrast

---

## UI Mockup Direction

The product mockups inside the landing page should show:

- city-based feed
- neighborhood labels
- local posts
- nearby trends or moments
- community vibes
- simple navigation cues
- city-switching / Passport concept

The mockups should look like a believable, premium mobile product, not placeholder boxes.

---

## Figma Deliverable Expectations

Create:

- desktop landing page
- tablet adaptation
- mobile landing page
- reusable components for header, buttons, city cards, feature blocks, CTA sections
- polished hero mockup composition
- clean auto-layout structure
- presentation-ready marketing design

The result should feel like a **launch-ready flagship landing page for a breakout social product centered around cities and culture**.

---

## Optional next steps

- **Tighter Figma AI prompt:** Collapse each section into 1–2 sentences + constraints for AI tools with character limits.
- **Frame blueprint:** One frame per section with suggested width (e.g. 1440 desktop, 768 tablet, 375 mobile), grid columns, and safe-area insets.
