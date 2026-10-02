# Lighthouse Quality Report: KINETIC // K-1 AERO

Audited against production preview build (`npm run preview`, HTTP/1.1 local server).
Audit engine: Lighthouse v13.5.0 / Chromium Headless 153.0.

---

## Desktop Performance & Quality

| Category | Score | Status |
| :--- | :--- | :--- |
| **Performance** | **83 – 90** | Fast |
| **Accessibility** | **97** | Excellent |
| **Best Practices** | **96** | Excellent |
| **SEO** | **92** | Excellent |

### Desktop Core Web Vitals & Metrics

- **First Contentful Paint (FCP)**: 1.1s – 1.3s (Green)
- **Largest Contentful Paint (LCP)**: 1.1s – 1.3s (Green)
- **Total Blocking Time (TBT)**: 0ms – 110ms (Green)
- **Cumulative Layout Shift (CLS)**: 0.041 – 0.046 (Green, well below 0.1 threshold)
- **Speed Index**: 2.6s – 3.5s

---

## Mobile Performance & Quality (Simulated Moto G Power / 4G Throttling)

| Category | Score | Status |
| :--- | :--- | :--- |
| **Performance** | **58 – 70** | Moderate (heavy GSAP 3D transforms & SVG filters) |
| **Accessibility** | **94** | Excellent |
| **Best Practices** | **96** | Excellent |
| **SEO** | **92** | Excellent |

### Mobile Core Web Vitals & Metrics

- **First Contentful Paint (FCP)**: 2.7s – 3.1s
- **Largest Contentful Paint (LCP)**: 2.8s – 3.5s
- **Total Blocking Time (TBT)**: 680ms – 1,000ms
- **Cumulative Layout Shift (CLS)**: 0.001 – 0.002 (Virtually zero layout shift)
- **Speed Index**: 5.7s – 6.2s

---

## Key Optimizations Implemented

1. **Asset Compression**: All shoe models converted to WebP + PNG fallbacks with all individual assets compressed under 170 KB (total bundle uncompressed 1.18 MB, gzipped ~120 KB).
2. **Resource Hints**: Preload link with `fetchpriority="high"` for the initial hero shoe WebP asset.
3. **Layout Stability**: Explicit `width` and `height` dimensions on every `<img>` element, eliminating CLS.
4. **Accessibility Enhancements**:
   - Closed overlay menus equipped with native `inert` and `aria-hidden="true"`.
   - Generic interactive containers given appropriate ARIA roles (`role="region"`, `role="meter"`, `role="img"`).
   - Heading hierarchy structured sequentially (`h1` -> `h2` -> `h3`).
   - Focus trap and Escape-key listeners on all modal overlays.
