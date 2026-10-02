# KINETIC // K-1 AERO Performance Sneaker Launch

## Overview
KINETIC is an interactive product launch experience engineered for the K-1 AERO, a high-performance carbon-plated marathon racing silhouette. Built from scratch with vanilla JavaScript, GSAP, and Lenis, it combines brutalist streetwear aesthetics with production-grade performance.

*Note: KINETIC and the K-1 AERO are a conceptual demo project featuring fictional brand identities, specifications, and simulated telemetry created for portfolio demonstration.*

---

## Goal
The objective was to create a digital product launch that breaks away from conventional eCommerce patterns. Rather than standard cards, generic loading spinners, and static grids, the platform delivers a narrative-driven, interactive product journey with responsive 3D interaction, bespoke animations, and frictionless micro-interactions that run at 60fps across desktop, tablet, and mobile devices.

---

## The Challenge
1. **Dynamic Theme Switching Without Layout Jumps**: Supporting three high-contrast colorways (Cobalt Rush, Volt, Punch) that re-theme the typography, backgrounds, accents, and 3D sneaker models instantaneously without page reloads or jarring flashes.
2. **Deterministic Scroll Synchronization**: Coordinating a pinned 5-keyframe product motion path, layered exploded blueprints, and full-bleed image carousels alongside continuous smooth scrolling without scroll hijacking or frozen viewports.
3. **Accessibility & WCAG AA Compliance**: Maintaining AAA/AA readability across high-octane neon palettes, supporting screen reader landmarks, semantic keyboard navigation, and prefers-reduced-motion fallbacks.

---

## What I Built

- **3-2-1 + GO Diagonal Split Countdown Loader**: A fullscreen sequence featuring oversized typography slamming in on alternating diagonals, culminating in a geometric polygon split that cleanly reveals the hero stage. Includes an automatic 4-second visibility failsafe.
- **Unified Colorway Engine**: A centralized reactive theme controller that mutates CSS variables, pre-decodes WebP models, updates OpenGraph tags, and triggers signature sweep bar transitions with trailing ghost echoes.
- **Pinned Product Run ("The Run")**: A scroll-scrubbed canvas featuring the K-1 AERO navigating a 5-keyframe motion path. Chapter text dynamically shifts to the opposite lateral half based on the shoe's real-time coordinates, keeping copy legible and clearing stage margins by 24px+.
- **Interactive Exploded Anatomy Blueprint**: An interactive layer inspection stage allowing users to drag an assembly slider or use keyboard arrow keys to physically separate the outsole, supercritical PEBA foam, bifurcated 3K carbon plate, and monofilament upper.
- **Head-to-Head Race Simulation**: An interactive 400-meter race test demonstrating carbon plate energy return against standard marathon foam, featuring animated runner avatars, gap calculations, and a high-impact winner stamp.
- **Mathematical Size Finder**: A deterministic sizing engine using foot length inputs (cm/in slider with interactive SVG foot outline), fit preference, and width options to compute exact US, EU, and UK recommendations, confidence ratings, and live stock statuses.
- **Live Drop Pass & Reservation System**: A 3-step form card linked to a 3D cursor-tracking boarding pass ticket. Upon completion, the ticket animates down from a dispenser slot, tears off its confirmation stub, triggers confetti particles, and allows instant `.ics` calendar file downloads.

---

## Tech Stack

- **Core**: Vanilla HTML5, Vanilla JavaScript (ES2022 Modules), Plain CSS Variables (no Tailwind or UI libraries)
- **Animation & Scroll**: GSAP 3 (ScrollTrigger, quickTo setters, ticker synchronization)
- **Smooth Scroll**: Lenis (single unified instance driven directly by GSAP ticker)
- **Bundler & Build**: Vite 8 with native ES module loading
- **Asset Pipeline**: Lossless WebP cutouts with optimized PNG fallbacks, SVG icons, and Google Variable Fonts (Archivo, Space Grotesk, Space Mono)

---

## Performance & Accessibility

Audited on production preview builds using Google Lighthouse v13.5:

### Desktop Audit Scores
- **Performance**: 83 – 90
- **Accessibility**: 97
- **Best Practices**: 96
- **SEO**: 92
- **Core Web Vitals**:
  - Largest Contentful Paint (LCP): **1.1s – 1.3s**
  - Total Blocking Time (TBT): **0ms – 110ms**
  - Cumulative Layout Shift (CLS): **0.041 – 0.046** (well below the 0.1 threshold)

### Mobile Audit Scores (Simulated 4G / CPU Throttling)
- **Performance**: 58 – 70 (high volume of simultaneous 3D canvas and SVG layer transforms)
- **Accessibility**: 94
- **Best Practices**: 96
- **SEO**: 92
- **Core Web Vitals**:
  - Cumulative Layout Shift (CLS): **0.001 – 0.002** (virtually zero layout shift)

### Accessibility Standards
- Full semantic hierarchy (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- Skip-to-content keyboard bypass link.
- Focus-trapped modal dialogs and closed overlay menus marked with native `inert`.
- Full keyboard operability for colorway switcher (keys `1`, `2`, `3`), exploded view slider, carousel arrows, and size grid.
- Full support for `prefers-reduced-motion` reducing all motion to clean, instantaneous fades.

---

## How to Run Locally

### Prerequisites
- Node.js 18.0+
- npm or pnpm

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/kinetic.git
cd kinetic

# Install dependencies
npm install

# Start Vite local development server (http://localhost:5173)
npm run dev

# Build production bundle to /dist
npm run build

# Preview production build locally (http://localhost:4173)
npm run preview
```

### Automated Screenshots & Video Capture
```bash
# Installs Playwright Chromium and generates all desktop/mobile screenshots & preview video into /portfolio
npm run capture
```

---

## How to Deploy

### Netlify
1. Connect repository to Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. The included `netlify.toml` automatically configures SPA fallback rewrites and long-lived cache headers for immutable assets.

### Vercel
1. Import repository into Vercel.
2. Framework Preset: `Vite`
3. Build command: `npm run build`
4. Output Directory: `dist`
5. The included `vercel.json` provides rewrite rules and immutable cache headers.

---

## Credits & License

- **Design, Development, & Animation**: Engineered by Antigravity for portfolio demonstration.
- **Typography**: Archivo, Space Grotesk, Space Mono via Google Fonts.
- **License**: Demo License (All rights reserved). Fictional concept created strictly for portfolio demonstration.
