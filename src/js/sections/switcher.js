import { gsap } from 'gsap';
import { COLORWAYS } from '../../data/colorways.js';
import { setColorway, getCurrentColorway } from '../lib/theme.js';

export function initColorwaySwitcher() {
  const switcherEl = document.querySelector('.colorway-switcher');
  if (!switcherEl) return;

  const buttons = switcherEl.querySelectorAll('.colorway-btn');

  function updateActiveUI(activeId) {
    buttons.forEach(btn => {
      const isMatch = btn.getAttribute('data-cw') === activeId;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
      btn.setAttribute('tabindex', isMatch ? '0' : '-1');
    });
  }

  // Initial state setup
  updateActiveUI(getCurrentColorway().id);

  const toggleBtn = switcherEl.querySelector('.colorway-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switcherEl.classList.toggle('is-expanded');
    });
    document.addEventListener('click', (e) => {
      if (!switcherEl.contains(e.target)) {
        switcherEl.classList.remove('is-expanded');
      }
    });
  }

  // Click handlers
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cwId = btn.getAttribute('data-cw');
      setColorway(cwId);
      switcherEl.classList.remove('is-expanded');
    });
  });

  // Listen to colorway change event to ensure sync
  window.addEventListener('colorway:change', (e) => {
    updateActiveUI(e.detail.id);
  });

  // Global Keyboard Navigation (1, 2, 3, Arrow Keys, Space/Enter)
  window.addEventListener('keydown', (e) => {
    // If typing in an input, ignore
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === '1') {
      setColorway('cobalt');
    } else if (e.key === '2') {
      setColorway('volt');
    } else if (e.key === '3') {
      setColorway('punch');
    } else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      cycleColorway(-1);
    } else if (['ArrowDown', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      cycleColorway(1);
    }
  });

  function cycleColorway(direction) {
    const currentId = getCurrentColorway().id;
    const currentIndex = COLORWAYS.findIndex(c => c.id === currentId);
    let nextIndex = (currentIndex + direction + COLORWAYS.length) % COLORWAYS.length;
    setColorway(COLORWAYS[nextIndex].id);
  }

  return {
    animateIn: () => {
      gsap.to(switcherEl, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
    }
  };
}
