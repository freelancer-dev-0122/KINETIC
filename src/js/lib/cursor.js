import { gsap } from 'gsap';

export function initCustomCursor() {
  // Disable on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) {
    return;
  }

  let cursorEl = document.querySelector('.custom-cursor');
  if (!cursorEl) {
    cursorEl = document.createElement('div');
    cursorEl.className = 'custom-cursor';
    cursorEl.innerHTML = `
      <div class="cursor-box">
        <span class="cursor-arrow">→</span>
        <span class="cursor-label"></span>
      </div>
    `;
    document.body.appendChild(cursorEl);
  }

  const cursorBox = cursorEl.querySelector('.cursor-box');
  const cursorArrow = cursorEl.querySelector('.cursor-arrow');
  const cursorLabel = cursorEl.querySelector('.cursor-label');

  // Quick setters for ultra smooth tracking
  const xTo = gsap.quickTo(cursorEl, 'x', { duration: 0.12, ease: 'power2.out' });
  const yTo = gsap.quickTo(cursorEl, 'y', { duration: 0.12, ease: 'power2.out' });

  let lastX = 0;
  let lastY = 0;
  let isHovered = false;

  window.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;

    cursorEl.style.opacity = '1';
    xTo(clientX);
    yTo(clientY);

    // Calculate heading angle for arrow rotation
    const dx = clientX - lastX;
    const dy = clientY - lastY;
    const dist = Math.hypot(dx, dy);

    if (dist > 3) {
      const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
      gsap.to(cursorArrow, {
        rotation: angleDeg,
        duration: 0.15,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    }

    lastX = clientX;
    lastY = clientY;
  });

  // Hide when leaving window
  document.documentElement.addEventListener('mouseleave', () => {
    cursorEl.style.opacity = '0';
  });

  document.documentElement.addEventListener('mouseenter', () => {
    cursorEl.style.opacity = '1';
  });

  // Handle interactive hover targets with single delegated event listeners
  document.addEventListener('pointerover', (e) => {
    const target = e.target.closest('[data-cursor], a, button, .magnetic, .shoe-interactive-wrap');
    if (!target) return;

    isHovered = true;
    cursorEl.classList.add('cursor-expanded');
    const customText = target.getAttribute('data-cursor') || (target.tagName === 'A' ? 'OPEN' : (target.tagName === 'BUTTON' ? 'VIEW' : ''));
    if (customText) {
      cursorLabel.textContent = customText;
      cursorEl.classList.add('has-label');
    } else {
      cursorLabel.textContent = '';
      cursorEl.classList.remove('has-label');
    }
  });

  document.addEventListener('pointerout', (e) => {
    const target = e.target.closest('[data-cursor], a, button, .magnetic, .shoe-interactive-wrap');
    if (!target) return;
    // Check if moving to an element within the same interactive container
    if (e.relatedTarget && target.contains(e.relatedTarget)) return;

    isHovered = false;
    cursorEl.classList.remove('cursor-expanded');
    cursorEl.classList.remove('has-label');
    cursorLabel.textContent = '';
  });
}
