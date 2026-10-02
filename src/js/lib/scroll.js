import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance = null;
let currentVelocity = 0;
const velocityListeners = new Set();

let lockCount = 0;
let previousActiveElement = null;

/**
 * Unified Scroll Lock Manager with counter.
 * Guarantees that multiple overlays (lightbox, mobile menu) don't conflict,
 * compensates scrollbar width, marks background inert, traps focus,
 * and guarantees lenis.start() on ALL exit paths.
 */
export const ScrollLockManager = {
  lock(overlayEl) {
    lockCount++;
    if (lockCount === 1) {
      if (lenisInstance) lenisInstance.stop();
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      document.body.classList.add('scroll-locked');
      document.documentElement.classList.add('scroll-locked');
    }

    if (overlayEl) {
      previousActiveElement = document.activeElement;
      const main = document.querySelector('main');
      if (main && main !== overlayEl && !overlayEl.contains(main)) {
        main.setAttribute('inert', '');
      }
      const rail = document.querySelector('.rail-nav');
      if (rail && rail !== overlayEl && !overlayEl.contains(rail)) {
        rail.setAttribute('inert', '');
      }
      overlayEl.removeAttribute('inert');
      const focusable = overlayEl.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) {
        setTimeout(() => focusable.focus(), 50);
      }
    }
  },

  unlock(overlayEl) {
    if (lockCount > 0) {
      lockCount--;
    }
    if (lockCount === 0) {
      if (lenisInstance) lenisInstance.start();
      document.body.style.paddingRight = '';
      document.body.classList.remove('scroll-locked');
      document.documentElement.classList.remove('scroll-locked');
      const main = document.querySelector('main');
      if (main) main.removeAttribute('inert');
      const rail = document.querySelector('.rail-nav');
      if (rail) rail.removeAttribute('inert');

      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
        previousActiveElement = null;
      }
    }
  },

  forceUnlock() {
    lockCount = 0;
    if (lenisInstance) lenisInstance.start();
    document.body.style.paddingRight = '';
    document.body.classList.remove('scroll-locked');
    document.documentElement.classList.remove('scroll-locked');
    const main = document.querySelector('main');
    if (main) main.removeAttribute('inert');
    const rail = document.querySelector('.rail-nav');
    if (rail) rail.removeAttribute('inert');
  }
};

/**
 * Initializes the unified Lenis + GSAP Scroll Engine.
 * Enforces single source of truth for scrolling and frame updates.
 */
export function initScrollEngine() {
  if (lenisInstance) return lenisInstance;

  lenisInstance = new Lenis({
    lerp: 0.1,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    smoothWheel: true,
    autoRaf: false // Driven strictly by GSAP ticker below
  });

  // Link Lenis to GSAP ScrollTrigger
  lenisInstance.on('scroll', (e) => {
    currentVelocity = e.velocity || 0;
    ScrollTrigger.update();
    velocityListeners.forEach(fn => fn(currentVelocity));
  });

  // Drive Lenis directly from GSAP ticker
  gsap.ticker.add((time) => {
    lenisInstance.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Pause when document is hidden to conserve cycles
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lenisInstance.stop();
    } else {
      if (lockCount === 0) {
        lenisInstance.start();
      }
      ScrollTrigger.refresh();
    }
  });

  // Window resize handler with debounce
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 900) {
        const mobileMenu = document.querySelector('.mobile-overlay-menu');
        if (mobileMenu && mobileMenu.classList.contains('is-open')) {
          mobileMenu.classList.remove('is-open');
          ScrollLockManager.unlock(mobileMenu);
        }
      }
      ScrollTrigger.refresh();
    }, 100);
  });

  // Guaranteed unlock handlers on exit paths
  window.addEventListener('orientationchange', () => ScrollLockManager.forceUnlock());
  window.addEventListener('beforeunload', () => ScrollLockManager.forceUnlock());
  window.addEventListener('pagehide', () => ScrollLockManager.forceUnlock());
  window.addEventListener('hashchange', () => ScrollLockManager.forceUnlock());

  return lenisInstance;
}

/**
 * Returns the single Lenis instance
 */
export function getLenis() {
  return lenisInstance;
}

/**
 * Returns the current normalized scroll velocity
 */
export function getScrollVelocity() {
  return currentVelocity;
}

/**
 * Subscribe to velocity updates
 */
export function onScrollVelocity(callback) {
  velocityListeners.add(callback);
  return () => velocityListeners.delete(callback);
}

/**
 * Refresh ScrollTrigger safely
 */
export function refreshScrollTrigger() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}
