import { gsap } from 'gsap';
import { COLORWAYS, DEFAULT_COLORWAY } from '../../data/colorways.js';

let currentColorway = DEFAULT_COLORWAY;
let isTransitioning = false;
let queuedColorwayId = null;

/**
 * Initializes theme overlay elements in DOM if not present.
 */
function getTransitionOverlay() {
  let overlay = document.querySelector('.colorway-transition-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'colorway-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <div class="transition-bar bar-1"></div>
      <div class="transition-bar bar-2"></div>
      <div class="transition-bar bar-3"></div>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

/**
 * Applies CSS variables directly to :root/html
 */
export function applyThemeVariables(cw) {
  const root = document.documentElement;
  root.style.setProperty('--bg', cw.bg);
  root.style.setProperty('--fg', cw.fg);
  root.style.setProperty('--title', cw.title);
  root.style.setProperty('--accent', cw.accent);
  root.setAttribute('data-colorway', cw.id);

  // Update theme-color meta tag
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', cw.bg);
}

/**
 * Get current active colorway object
 */
export function getCurrentColorway() {
  return currentColorway;
}

/**
 * Master colorway switcher function.
 * Signature moment transition (~1.1s) with three slanted sweep bars.
 */
export function setColorway(id, skipTransition = false) {
  const target = COLORWAYS.find(c => c.id === id);
  if (!target) return Promise.resolve(currentColorway);

  if (target.id === currentColorway.id && !skipTransition) {
    return Promise.resolve(currentColorway);
  }

  // If already transitioning, queue up the newest selection
  if (isTransitioning) {
    queuedColorwayId = id;
    return Promise.resolve(currentColorway);
  }

  if (skipTransition) {
    currentColorway = target;
    applyThemeVariables(target);
    window.dispatchEvent(new CustomEvent('colorway:change', { detail: { id: target.id, colorway: target } }));
    return Promise.resolve(target);
  }

  isTransitioning = true;
  const overlay = getTransitionOverlay();
  const bars = overlay.querySelectorAll('.transition-bar');

  // Configure bar colors: new colorway color, ink (#0E0E10), cream (#F4F1EA)
  bars[0].style.backgroundColor = target.bg;
  bars[1].style.backgroundColor = '#0E0E10';
  bars[2].style.backgroundColor = '#F4F1EA';

  overlay.style.pointerEvents = 'all';
  overlay.style.visibility = 'visible';

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Clear all inline transforms so nothing stays stuck
        gsap.set(bars, { clearProps: 'all' });
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
        isTransitioning = false;

        resolve(target);

        // Check if another choice was queued
        if (queuedColorwayId && queuedColorwayId !== currentColorway.id) {
          const nextId = queuedColorwayId;
          queuedColorwayId = null;
          setColorway(nextId);
        } else {
          queuedColorwayId = null;
        }
      }
    });

    // Reset initial positions: offscreen to the left (-120%)
    gsap.set(bars, {
      xPercent: -120,
      skewX: -12,
      display: 'block'
    });

    // Bars sweep in from left (0.45s, expo.inOut)
    tl.to(bars, {
      xPercent: 0,
      duration: 0.45,
      ease: 'expo.inOut',
      stagger: 0.08
    });

    // Midpoint action: swap CSS variables, emit event
    tl.add(() => {
      currentColorway = target;
      applyThemeVariables(target);
      window.dispatchEvent(new CustomEvent('colorway:change', { detail: { id: target.id, colorway: target } }));
    }, '-=0.15');

    // Bars sweep out to the right (xPercent: 120)
    tl.to(bars, {
      xPercent: 120,
      duration: 0.48,
      ease: 'expo.inOut',
      stagger: 0.07
    }, '+=0.04');
  });
}
