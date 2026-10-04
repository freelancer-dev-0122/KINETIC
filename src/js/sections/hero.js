import { gsap } from 'gsap';
import { getImage } from '../lib/images.js';
import { getCurrentColorway } from '../lib/theme.js';
import { onScrollVelocity, getScrollVelocity } from '../lib/scroll.js';
import { Odometer, splitTextMasked, isReducedMotion, DROP_DATE } from '../lib/utils.js';

export function initHeroSection() {
  const heroEl = document.querySelector('.hero-section');
  const titleBase = document.querySelector('.hero-title-base');
  const titleOutline = document.querySelector('.hero-title-outline');
  const shoeStage = document.querySelector('.shoe-stage-wrap');
  const shoeContainer = document.querySelector('.shoe-img-container');
  const shoeMainImg = document.querySelector('.shoe-main-img');
  const shoeShadow = document.querySelector('.shoe-ground-shadow');
  const ghost1 = document.querySelector('.ghost-1');
  const ghost2 = document.querySelector('.ghost-2');
  const ghost3 = document.querySelector('.ghost-3');
  const stickers = document.querySelectorAll('.badge-sticker');
  const ribbonTrack = document.querySelector('.ribbon-track');

  let titleLetters = [];

  // --------------------------------------------------------------------------
  // 1. DYNAMIC FONT SIZING FOR "KINETIC" TITLE
  // Fills width minus rail and 32px padding, never taller than 46% hero height
  // --------------------------------------------------------------------------
  function resizeTitle() {
    if (!titleBase || !heroEl) return;
    const isMobile = window.innerWidth < 900;
    const railWidth = isMobile ? 0 : 72;
    const availableWidth = window.innerWidth - railWidth - (isMobile ? 32 : 64);
    const heroHeight = heroEl.offsetHeight || window.innerHeight;
    const maxAllowedHeight = heroHeight * 0.46;

    // Approximate width-to-height ratio for "KINETIC" in Archivo wdth 125 wght 900 italic is ~4.5
    // Calculate size that fits both constraints
    let calculatedSize = availableWidth / 4.4;
    if (calculatedSize > maxAllowedHeight) {
      calculatedSize = maxAllowedHeight;
    }
    calculatedSize = Math.max(calculatedSize, 48);

    titleBase.style.fontSize = `${calculatedSize}px`;
    if (titleOutline) {
      titleOutline.style.fontSize = `${calculatedSize}px`;
    }
  }

  window.addEventListener('resize', resizeTitle);
  resizeTitle();

  // Split title into masked letters for stagger slam
  if (titleBase) {
    titleLetters = splitTextMasked(titleBase, 'chars');
  }

  // --------------------------------------------------------------------------
  // 2. SHOE SETUP & IMAGE SWAP LISTENER
  // --------------------------------------------------------------------------
  function updateShoeImage(colorway) {
    const imgUrl = getImage(colorway.image, colorway.accent);
    shoeMainImg.src = imgUrl;
    if (ghost1) ghost1.src = imgUrl;
    if (ghost2) ghost2.src = imgUrl;
    if (ghost3) ghost3.src = imgUrl;
  }

  // Set initial shoe image
  updateShoeImage(getCurrentColorway());

  // Listen to colorway changes for signature transition animation
  window.addEventListener('colorway:change', (e) => {
    const newCw = e.detail.colorway;
    if (!newCw) return;

    // Shoe exit left with skew + ghost copies
    if (!isReducedMotion()) {
      const exitTl = gsap.timeline();
      [ghost1, ghost2, ghost3].forEach(g => {
        if (g) {
          g.style.display = 'block';
          gsap.set(g, { xPercent: 0, skewX: 0 });
        }
      });

      exitTl.to([shoeMainImg, ghost1, ghost2, ghost3], {
        xPercent: -130,
        skewX: 18,
        duration: 0.35,
        stagger: 0.03,
        ease: 'power2.in',
        onComplete: () => {
          updateShoeImage(newCw);
          // Enter from right with overshoot
          gsap.fromTo([shoeMainImg, ghost1, ghost2, ghost3],
            { xPercent: 140, skewX: -18 },
            {
              xPercent: 0,
              skewX: 0,
              duration: 0.55,
              stagger: 0.04,
              ease: 'back.out(1.4)',
              onComplete: () => {
                [ghost1, ghost2, ghost3].forEach(g => {
                  if (g) g.style.display = 'none';
                });
              }
            }
          );
        }
      });

      // Title letters ripple stagger in new color
      if (titleLetters.length > 0) {
        gsap.fromTo(titleLetters,
          { yPercent: 40, skewY: 8, opacity: 0.4 },
          { yPercent: 0, skewY: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'back.out(2)' }
        );
      }
    } else {
      updateShoeImage(newCw);
    }
  });

  // --------------------------------------------------------------------------
  // 3. SHOE IDLE FLOAT & 3D CURSOR TILT
  // --------------------------------------------------------------------------
  let floatTween = null;
  if (!isReducedMotion() && shoeContainer) {
    floatTween = gsap.to(shoeContainer, {
      y: -10,
      rotation: -8.5,
      duration: 3.5,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });

    if (shoeShadow) {
      gsap.to(shoeShadow, {
        scaleX: 0.92,
        scaleY: 0.35,
        opacity: 0.25,
        duration: 3.5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }
  }

  // 3D tilt towards cursor (rotateX, rotateY max 8deg)
  const rotXTo = gsap.quickTo(shoeStage, 'rotationX', { duration: 0.3, ease: 'power2.out' });
  const rotYTo = gsap.quickTo(shoeStage, 'rotationY', { duration: 0.3, ease: 'power2.out' });

  // Stickers Parallax (max 20px)
  const stickerQuickTos = Array.from(stickers).map(st => ({
    xTo: gsap.quickTo(st, 'x', { duration: 0.4, ease: 'power2.out' }),
    yTo: gsap.quickTo(st, 'y', { duration: 0.4, ease: 'power2.out' })
  }));

  window.addEventListener('mousemove', (e) => {
    if (isReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;
    const { clientX, clientY } = e;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    const normX = (clientX - cx) / cx;
    const normY = (clientY - cy) / cy;

    // Max 8deg tilt
    rotXTo(-normY * 8);
    rotYTo(normX * 8);

    // Parallax stickers
    stickerQuickTos.forEach((sq, i) => {
      const factor = (i + 1) * 6;
      sq.xTo(normX * factor);
      sq.yTo(normY * factor);
    });
  });

  // --------------------------------------------------------------------------
  // 4. TITLE OUTLINE DRIFT WITH SCROLL VELOCITY
  // --------------------------------------------------------------------------
  const outlineXTo = titleOutline ? gsap.quickTo(titleOutline, 'x', { duration: 0.2, ease: 'power1.out' }) : null;

  onScrollVelocity((velocity) => {
    if (outlineXTo) {
      // Horizontal drift proportional to scroll velocity
      const drift = Math.max(-60, Math.min(60, velocity * 12));
      outlineXTo(14 + drift);
    }

    // Ribbon skew up to 5deg when scrolling fast
    if (ribbonTrack) {
      const skew = Math.max(-5, Math.min(5, velocity * 1.5));
      gsap.to(ribbonTrack, {
        skewX: skew,
        duration: 0.2,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    }
  });

  // --------------------------------------------------------------------------
  // 5. DROP COUNTDOWN (TARGET = DROP_DATE: 2026-10-31T10:00:00)
  // Live countdown updating every second, clamped at 0, showing "DROP LIVE" when done
  // --------------------------------------------------------------------------
  const daysEl = document.querySelector('.countdown-days');
  const hoursEl = document.querySelector('.countdown-hours');
  const minsEl = document.querySelector('.countdown-mins');
  const secsEl = document.querySelector('.countdown-secs');
  const tagEl = document.querySelector('.countdown-header-tag');

  const daysOdo = daysEl ? new Odometer(daysEl, { initialValue: '00' }) : null;
  const hoursOdo = hoursEl ? new Odometer(hoursEl, { initialValue: '00' }) : null;
  const minsOdo = minsEl ? new Odometer(minsEl, { initialValue: '00' }) : null;
  const secsOdo = secsEl ? new Odometer(secsEl, { initialValue: '00' }) : null;

  function updateCountdown() {
    const diff = Math.max(0, DROP_DATE.getTime() - Date.now());
    if (diff <= 0) {
      if (tagEl) {
        tagEl.innerHTML = '<span class="countdown-live-dot"></span><span>DROP LIVE</span>';
      }
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
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // --------------------------------------------------------------------------
  // 6. CONTINUOUS DIAGONAL RIBBON MARQUEE
  // Speed follows scroll velocity
  // --------------------------------------------------------------------------
  let ribbonPos = 0;
  gsap.ticker.add((time, deltaTime) => {
    if (!ribbonTrack || document.hidden || isReducedMotion()) return;
    const baseSpeed = 1.2;
    const velSpeed = Math.abs(getScrollVelocity()) * 0.08;
    const dtFactor = (deltaTime || 16.6) / 16.6;

    ribbonPos -= (baseSpeed + velSpeed) * dtFactor;
    // Single loop width calculation
    const halfWidth = ribbonTrack.scrollWidth / 2;
    if (Math.abs(ribbonPos) >= halfWidth) {
      ribbonPos = 0;
    }
    ribbonTrack.style.transform = `translateX(${ribbonPos}px)`;
  });

  // --------------------------------------------------------------------------
  // 7. HERO ENTRANCE (Called after loader exits)
  // --------------------------------------------------------------------------
  return {
    animateIn: () => {
      const enterTl = gsap.timeline();

      // Unhide hero wrapper
      gsap.set(heroEl, { visibility: 'visible', opacity: 1 });

      // Title letters slam up with skewY and stagger
      if (titleLetters.length > 0) {
        enterTl.fromTo(titleLetters,
          { yPercent: 120, skewY: 15, opacity: 0 },
          { yPercent: 0, skewY: 0, opacity: 1, duration: 0.65, stagger: 0.05, ease: 'expo.out' }
        );
      }

      // Title outline fades and slides into offset position
      if (titleOutline) {
        enterTl.fromTo(titleOutline,
          { opacity: 0, x: -20, y: -20 },
          { opacity: 1, x: 14, y: 14, duration: 0.5, ease: 'power2.out' },
          '-=0.4'
        );
      }

      // Shoe entry: slides in from right with skewX(-18deg) + 3 ghost copies
      [ghost1, ghost2, ghost3].forEach(g => {
        if (g) g.style.display = 'block';
      });

      enterTl.fromTo([shoeMainImg, ghost1, ghost2, ghost3],
        { xPercent: 130, skewX: -18, opacity: 0 },
        {
          xPercent: 0,
          skewX: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.04,
          ease: 'expo.out',
          onComplete: () => {
            // Fade ghosts out as settled
            gsap.to([ghost1, ghost2, ghost3], {
              opacity: 0,
              duration: 0.35,
              onComplete: () => {
                [ghost1, ghost2, ghost3].forEach(g => {
                  if (g) {
                    g.style.display = 'none';
                    g.style.opacity = '';
                  }
                });
              }
            });
          }
        },
        '-=0.5'
      );

      // Stickers pop in with scale overshoot
      enterTl.fromTo(stickers,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'back.out(2.4)' },
        '-=0.3'
      );

      // Countdown card and meta badge
      enterTl.fromTo(['.hero-top-row', '.hero-bottom-row'],
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
        '-=0.3'
      );
    }
  };
}
