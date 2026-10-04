import { gsap } from 'gsap';

export const DROP_DATE = new Date('2026-10-31T10:00:00');

/**
 * Checks for user reduced-motion preference
 */
export function isReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Caps device pixel ratio to 2 for optimal high-DPI rendering performance
 */
export function getClampedDPR() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/**
 * Initializes magnetic pull for interactive buttons (radius: 80px)
 */
export function initMagneticButtons() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const magneticElements = document.querySelectorAll('.magnetic, [data-magnetic]');

  magneticElements.forEach((el) => {
    let bounds = null;

    el.addEventListener('mouseenter', () => {
      bounds = el.getBoundingClientRect();
    });

    el.addEventListener('mousemove', (e) => {
      if (!bounds) bounds = el.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const pullFactor = 0.35;

      gsap.to(el, {
        x: dx * pullFactor,
        y: dy * pullFactor,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });

    el.addEventListener('mouseleave', () => {
      bounds = null;
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto'
      });
    });
  });
}

/**
 * Splits text into masked chars or words preserving word boundaries.
 * Wraps each word in a span with display: inline-block and white-space: nowrap,
 * putting characters inside it and keeping normal spaces between words so lines
 * ONLY break between words, never mid-word.
 * Applies line-height: 0.95 and padding-bottom: 0.12em with margin-bottom: -0.12em
 * so tall ascenders and deep descenders are never clipped.
 */
export function splitTextMasked(element, type = 'chars') {
  if (!element) return [];

  // Parse words and preserve child node styling classes (e.g. .tone-on-tone, .accent-word)
  const childNodes = Array.from(element.childNodes);
  const wordTokens = [];

  childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/\s+/).filter(Boolean);
      parts.forEach(p => wordTokens.push({ text: p, className: '' }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const parts = node.textContent.trim().split(/\s+/).filter(Boolean);
      parts.forEach(p => wordTokens.push({ text: p, className: node.className || '' }));
    }
  });

  if (wordTokens.length === 0) {
    const raw = element.textContent.trim();
    raw.split(/\s+/).filter(Boolean).forEach(p => wordTokens.push({ text: p, className: '' }));
  }

  element.innerHTML = '';
  element.classList.add('masked-headline-container');

  const items = [];

  wordTokens.forEach((token, wIdx) => {
    // Word boundary wrapper: NEVER breaks mid-word
    const wordBoundary = document.createElement('span');
    wordBoundary.className = `word-boundary-wrap ${token.className}`.trim();
    wordBoundary.style.display = 'inline-block';
    wordBoundary.style.whiteSpace = 'nowrap';
    wordBoundary.style.lineHeight = '0.95';
    wordBoundary.style.paddingBottom = '0.12em';
    wordBoundary.style.marginBottom = '-0.12em';
    wordBoundary.style.verticalAlign = 'top';

    if (type === 'chars') {
      const chars = Array.from(token.text);
      chars.forEach((char) => {
        const wrap = document.createElement('span');
        wrap.className = 'char-mask-wrap';

        const inner = document.createElement('span');
        inner.className = 'char-inner';
        inner.textContent = char;

        wrap.appendChild(inner);
        wordBoundary.appendChild(wrap);
        items.push(inner);
      });
    } else {
      // type === 'words'
      const wrap = document.createElement('span');
      wrap.className = 'word-mask-wrap';

      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = token.text;

      wrap.appendChild(inner);
      wordBoundary.appendChild(wrap);
      items.push(inner);
    }

    element.appendChild(wordBoundary);

    // Keep a normal space between words so lines only break between words
    if (wIdx < wordTokens.length - 1) {
      element.appendChild(document.createTextNode(' '));
    }
  });

  return items;
}

/**
 * Odometer digit counter.
 * ALWAYS renders the final value by default in the DOM for SSR/immediate visibility,
 * and animates on top.
 */
export class Odometer {
  constructor(container, options = {}) {
    this.container = container;
    this.value = options.initialValue ?? container.textContent.trim();
    this.renderInitial(this.value);
  }

  renderInitial(val) {
    this.container.innerHTML = '';
    this.container.classList.add('odometer-track-wrap');

    const str = String(val);
    this.digitStrips = [];

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const col = document.createElement('span');
      col.className = 'odometer-col';

      if (/\d/.test(char)) {
        col.dataset.digit = char;
        const strip = document.createElement('span');
        strip.className = 'odometer-strip';
        // Render 0-9 digits vertically
        for (let d = 0; d <= 9; d++) {
          const num = document.createElement('span');
          num.className = 'odometer-num';
          num.textContent = d;
          strip.appendChild(num);
        }
        col.appendChild(strip);
        // Default position directly to final value!
        const targetPercent = parseInt(char, 10) * -10;
        strip.style.transform = `translateY(${targetPercent}%)`;
        this.digitStrips.push({ col, strip, isNumber: true, currentVal: parseInt(char, 10) });
      } else {
        col.className = 'odometer-static';
        col.textContent = char;
        this.digitStrips.push({ col, isNumber: false, char });
      }

      this.container.appendChild(col);
    }
  }

  setValue(newVal, animate = true) {
    const str = String(newVal);
    // If length changed or characters changed, recreate
    if (str.length !== this.digitStrips.length) {
      this.renderInitial(str);
      return;
    }

    let digitIdx = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const entry = this.digitStrips[i];
      if (entry.isNumber) {
        const targetNum = parseInt(char, 10);
        if (!isNaN(targetNum)) {
          const targetPercent = targetNum * -10;
          if (animate && !isReducedMotion()) {
            gsap.to(entry.strip, {
              yPercent: targetPercent,
              duration: 0.6,
              ease: 'power3.out',
              delay: digitIdx * 0.04
            });
          } else {
            entry.strip.style.transform = `translateY(${targetPercent}%)`;
          }
          entry.currentVal = targetNum;
          digitIdx++;
        }
      } else {
        entry.col.textContent = char;
      }
    }
  }
}
