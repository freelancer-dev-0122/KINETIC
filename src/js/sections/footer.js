import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis, onScrollVelocity, getScrollVelocity } from '../lib/scroll.js';
import { Odometer, isReducedMotion, splitTextMasked, DROP_DATE } from '../lib/utils.js';

gsap.registerPlugin(ScrollTrigger);

export function initFooterSection() {
  const footerEl = document.querySelector('#footer');
  if (!footerEl) return;

  // --------------------------------------------------------------------------
  // 1. CHECKERED FINISH BAND (Horizontal scroll with velocity + idle drift)
  // --------------------------------------------------------------------------
  const checkeredBand = footerEl.querySelector('.checkered-finish-band');
  let checkeredPos = 0;

  if (checkeredBand && !isReducedMotion()) {
    gsap.ticker.add((time, deltaTime) => {
      if (document.hidden) return;
      const rect = footerEl.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const dt = (deltaTime || 16.6) / 16.6;
      const velocity = getScrollVelocity();
      const speed = 0.5 + Math.abs(velocity) * 0.15;
      checkeredPos -= speed * dt;

      // Loop over 28px pattern size
      if (checkeredPos <= -28) {
        checkeredPos += 28;
      }
      checkeredBand.style.transform = `translateX(${checkeredPos}px)`;
    });
  }

  // --------------------------------------------------------------------------
  // 2. LAUNCH CONTROL HEADLINE SLAM ON ENTER
  // --------------------------------------------------------------------------
  const launchHeadline = footerEl.querySelector('.launch-headline');
  if (launchHeadline && !isReducedMotion()) {
    const words = splitTextMasked(launchHeadline, 'words');

    ScrollTrigger.create({
      trigger: footerEl,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.fromTo(words,
          { yPercent: 120, skewY: 8, opacity: 0 },
          {
            yPercent: 0,
            skewY: 0,
            opacity: 1,
            duration: 0.9,
            stagger: 0.08,
            ease: 'expo.out',
            immediateRender: false
          }
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // 3. MINI DROP COUNTDOWN (Ticking with Odometers, identical target to hero)
  // --------------------------------------------------------------------------
  const cdDays = footerEl.querySelector('.mini-cd-days');
  const cdHours = footerEl.querySelector('.mini-cd-hours');
  const cdMins = footerEl.querySelector('.mini-cd-mins');
  const cdSecs = footerEl.querySelector('.mini-cd-secs');
  const cdTag = footerEl.querySelector('.mini-cd-status-tag');
  const chipCdText = footerEl.querySelector('.footer-chip-cd-text');

  const daysOdo = cdDays ? new Odometer(cdDays, { initialValue: '00' }) : null;
  const hoursOdo = cdHours ? new Odometer(cdHours, { initialValue: '00' }) : null;
  const minsOdo = cdMins ? new Odometer(cdMins, { initialValue: '00' }) : null;
  const secsOdo = cdSecs ? new Odometer(cdSecs, { initialValue: '00' }) : null;

  function updateFooterCountdown() {
    const diff = Math.max(0, DROP_DATE.getTime() - Date.now());
    if (diff <= 0) {
      if (cdTag) cdTag.textContent = 'DROP LIVE';
      if (chipCdText) chipCdText.textContent = '● DROP LIVE';
      if (daysOdo) daysOdo.setValue('00');
      if (hoursOdo) hoursOdo.setValue('00');
      if (minsOdo) minsOdo.setValue('00');
      if (secsOdo) secsOdo.setValue('00');
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);

    const pad = (n) => String(n).padStart(2, '0');

    if (daysOdo) daysOdo.setValue(pad(d));
    if (hoursOdo) hoursOdo.setValue(pad(h));
    if (minsOdo) minsOdo.setValue(pad(m));
    if (secsOdo) secsOdo.setValue(pad(s));

    if (chipCdText) {
      chipCdText.textContent = `● DROP LIVE IN T-${pad(d)}D:${pad(h)}H:${pad(m)}M`;
    }
  }

  setInterval(updateFooterCountdown, 1000);
  updateFooterCountdown();

  // Button scroll to #reserve
  const btnReserve = footerEl.querySelector('.btn-launch-reserve');
  if (btnReserve) {
    btnReserve.addEventListener('click', (e) => {
      e.preventDefault();
      const lenis = getLenis();
      const reserveTarget = document.querySelector('#reserve');
      if (lenis && reserveTarget) {
        lenis.scrollTo(reserveTarget, { duration: 1.4, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
      } else if (reserveTarget) {
        reserveTarget.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. DROP ALERT (Newsletter form)
  // --------------------------------------------------------------------------
  const newsletterForm = footerEl.querySelector('.drop-alert-form');
  const newsletterInput = footerEl.querySelector('.drop-alert-input');
  const newsletterErrBox = footerEl.querySelector('.newsletter-error-box');
  const newsletterSuccessBox = footerEl.querySelector('.newsletter-success-box');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterInput ? newsletterInput.value.trim() : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (newsletterErrBox) newsletterErrBox.textContent = 'PLEASE ENTER A VALID EMAIL ADDRESS.';
        return;
      }

      if (newsletterErrBox) newsletterErrBox.textContent = '';
      newsletterForm.style.display = 'none';
      if (newsletterSuccessBox) {
        newsletterSuccessBox.classList.add('is-active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. LINK GRID (Internal anchors scroll smoothly with Lenis)
  // --------------------------------------------------------------------------
  const footerAnchors = footerEl.querySelectorAll('.footer-nav-item a[href^="#"]');
  footerAnchors.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(targetEl, { duration: 1.4, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // --------------------------------------------------------------------------
  // 6. GIANT WORDMARK ("KINETIC" fitted by measurement, scrubbed entrance)
  // --------------------------------------------------------------------------
  const wordmark = footerEl.querySelector('.footer-wordmark');
  let wordmarkChars = [];

  function resizeWordmark() {
    if (!wordmark || !footerEl) return;
    const isMobile = window.innerWidth < 900;
    const railWidth = isMobile ? 0 : 72;
    const availableWidth = window.innerWidth - railWidth - (isMobile ? 32 : 96);

    // Archivo wdth 125 wght 900 ratio is ~4.4
    let calculatedSize = availableWidth / 4.4;
    calculatedSize = Math.max(calculatedSize, 64);
    wordmark.style.fontSize = `${calculatedSize}px`;
  }

  window.addEventListener('resize', resizeWordmark);
  resizeWordmark();

  if (wordmark) {
    wordmarkChars = splitTextMasked(wordmark, 'chars');

    if (!isReducedMotion()) {
      // Letters rise from below with skew and stagger scrubbed to scroll
      gsap.fromTo(wordmarkChars,
        {
          yPercent: 110,
          skewX: -12,
          opacity: 0.2
        },
        {
          yPercent: 0,
          skewX: 0,
          opacity: 1,
          stagger: 0.04,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerEl,
            start: 'top 85%',
            end: 'bottom bottom',
            scrub: 1
          }
        }
      );

      // Word shifts slightly with scroll velocity
      onScrollVelocity((velocity) => {
        const shift = Math.max(-20, Math.min(20, velocity * 4));
        gsap.to(wordmark, {
          x: shift,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto'
        });
      });
    }
  }

  // --------------------------------------------------------------------------
  // 7. BACK TO TOP BUTTON WITH SPEED LINES
  // --------------------------------------------------------------------------
  const btnTop = footerEl.querySelector('.btn-back-to-top');
  const speedLinesOverlay = footerEl.querySelector('.top-speed-lines-overlay');

  if (btnTop) {
    btnTop.addEventListener('click', () => {
      const lenis = getLenis();

      if (speedLinesOverlay && !isReducedMotion()) {
        speedLinesOverlay.style.display = 'block';
      }

      if (lenis) {
        lenis.scrollTo(0, {
          duration: 1.8,
          easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
          onComplete: () => {
            if (speedLinesOverlay) speedLinesOverlay.style.display = 'none';
          }
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
          if (speedLinesOverlay) speedLinesOverlay.style.display = 'none';
        }, 1200);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 8. COLORWAY SWITCHER & RAIL NAV COEXISTENCE
  // Moves up 24px and shrinks to 48px squares when footer in view
  // --------------------------------------------------------------------------
  ScrollTrigger.create({
    trigger: footerEl,
    start: 'top 80%',
    end: 'bottom bottom',
    onEnter: () => document.body.classList.add('footer-in-view'),
    onLeaveBack: () => document.body.classList.remove('footer-in-view')
  });
}
