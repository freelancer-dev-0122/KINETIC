import { gsap } from 'gsap';
import './styles/main.css';
import { DEFAULT_COLORWAY } from './data/colorways.js';
import { initScrollEngine, refreshScrollTrigger } from './js/lib/scroll.js';
import { applyThemeVariables } from './js/lib/theme.js';
import { initCustomCursor } from './js/lib/cursor.js';
import { initMagneticButtons } from './js/lib/utils.js';
import { runLoader } from './js/sections/loader.js';
import { initRailNav } from './js/sections/rail.js';
import { initHeroSection } from './js/sections/hero.js';
import { initColorwaySwitcher } from './js/sections/switcher.js';
import { initDropSection } from './js/sections/drop.js';
import { initTechSection } from './js/sections/tech.js';
import { initGallerySection } from './js/sections/gallery.js';
import { initReserveSection } from './js/sections/reserve.js';
import { initFooterSection } from './js/sections/footer.js';

// Pre-decode all three shoe images (WebP & PNG) for instant transitions
['shoe-cobalt', 'shoe-volt', 'shoe-punch'].forEach(name => {
  const imgWebp = new Image();
  imgWebp.src = `/src/assets/img/${name}.webp`;
  if (imgWebp.decode) imgWebp.decode().catch(() => {});

  const imgPng = new Image();
  imgPng.src = `/src/assets/img/${name}.png`;
  if (imgPng.decode) imgPng.decode().catch(() => {});
});

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Initialize CSS variables to default colorway
  applyThemeVariables(DEFAULT_COLORWAY);

  // 2. Initialize single Lenis scroll engine driven by GSAP ticker
  initScrollEngine();

  // 3. Initialize custom difference cursor
  initCustomCursor();

  // 4. Initialize magnetic buttons
  initMagneticButtons();

  // 5. Initialize sections
  const railControls = initRailNav();
  const heroControls = initHeroSection();
  const switcherControls = initColorwaySwitcher();
  initDropSection();
  initTechSection();
  initGallerySection();
  initReserveSection();
  initFooterSection();

  // 6. Ensure fonts are ready before running loader
  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch (e) {
    console.warn('Font loading check complete:', e);
  }

  // 7. Run signature 3-2-1 + GO diagonal split countdown loader
  await runLoader();

  // 8. Animate in the Hero, Rail, and Switcher only after the loader has fully exited
  if (railControls && railControls.animateIn) {
    railControls.animateIn();
  }

  if (heroControls && heroControls.animateIn) {
    heroControls.animateIn();
  }

  if (switcherControls && switcherControls.animateIn) {
    switcherControls.animateIn();
  }

  // 9. Refresh ScrollTrigger calculations after everything is revealed and rendered
  refreshScrollTrigger();

  // 10. 4s Failsafe: forces any element still hidden into its final visible state
  setTimeout(() => {
    const revealedElements = document.querySelectorAll(
      '.reserve-statement, .launch-headline, .reserve-card, .drop-pass-card, ' +
      '.checkered-finish-band, .mini-countdown-card, .drop-alert-section, .footer-wordmark, ' +
      '.char-inner, .word-inner, .word-boundary-wrap'
    );
    revealedElements.forEach(el => {
      if (el.style.opacity === '0' || getComputedStyle(el).opacity === '0') {
        gsap.set(el, { opacity: 1, y: 0, yPercent: 0, skewY: 0, skewX: 0, clearProps: 'transform,opacity' });
      }
    });
    refreshScrollTrigger();
  }, 4000);
});
