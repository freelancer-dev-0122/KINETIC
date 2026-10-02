import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getImage } from '../lib/images.js';
import { getCurrentColorway } from '../lib/theme.js';
import { getLenis, getScrollVelocity, onScrollVelocity } from '../lib/scroll.js';
import { Odometer, splitTextMasked, isReducedMotion } from '../lib/utils.js';
import { HOTSPOTS } from '../../data/hotspots.js';

gsap.registerPlugin(ScrollTrigger);

export function initDropSection() {
  const dropSection = document.getElementById('drop');
  if (!dropSection) return;

  const lenis = getLenis();

  // --------------------------------------------------------------------------
  // 0. PRE-DECODE ALL THREE SHOE IMAGES IN MEMORY
  // --------------------------------------------------------------------------
  const preloadedImages = {};
  ['cobalt', 'volt', 'punch'].forEach(cwKey => {
    const img = new Image();
    img.src = getImage(`shoe-${cwKey}`);
    if (img.decode) {
      img.decode().catch(() => {});
    }
    preloadedImages[cwKey] = img;
  });

  // Check for dev-only ?debug mode
  if (window.location.search.includes('debug') || window.location.hash.includes('debug')) {
    document.body.classList.add('debug-hotspots');
  }

  // --------------------------------------------------------------------------
  // 1. PART A: MANIFESTO INITIALIZATION
  // --------------------------------------------------------------------------
  const manifestoStatement = dropSection.querySelector('.manifesto-statement');
  const manifestoPara = dropSection.querySelector('.manifesto-para');
  const manifestoBand = dropSection.querySelector('.manifesto-stats-band');

  // Velocity skew for manifesto statement (up to 4deg)
  if (manifestoStatement && !isReducedMotion()) {
    onScrollVelocity((velocity) => {
      const skew = Math.max(-4, Math.min(4, velocity * 1.2));
      gsap.to(manifestoStatement, {
        skewX: skew,
        duration: 0.25,
        ease: 'power1.out',
        overwrite: 'auto'
      });
    });
  }

  // Odometers for stats band (always render final values by default)
  const statOdometers = [];
  const statContainers = dropSection.querySelectorAll('.stat-odometer');
  statContainers.forEach(container => {
    const finalVal = container.getAttribute('data-value') || container.textContent.trim();
    const odo = new Odometer(container, { initialValue: finalVal });
    statOdometers.push({ odo, val: finalVal });
  });

  // Entrance animation for Manifesto
  if (!isReducedMotion()) {
    ScrollTrigger.create({
      trigger: '.manifesto-wrap',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        // Words slam in on enter
        if (manifestoStatement) {
          const words = splitTextMasked(manifestoStatement, 'words');
          gsap.fromTo(words,
            { yPercent: 120, skewY: 12, opacity: 0 },
            { yPercent: 0, skewY: 0, opacity: 1, duration: 0.65, stagger: 0.05, ease: 'expo.out' }
          );
        }

        if (manifestoBand) {
          gsap.fromTo(manifestoBand,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.8)', delay: 0.2 }
          );
        }

        if (manifestoPara) {
          gsap.fromTo(manifestoPara,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.3 }
          );
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. PART B: THE RUN (PINNED SEQUENCE, SCRUB: 1)
  // --------------------------------------------------------------------------
  const pinSection = dropSection.querySelector('.the-run-pin-section');
  const bgWipeLayer = dropSection.querySelector('.run-bg-wipe-layer');
  const giantNumBg = dropSection.querySelector('.run-giant-num-bg');
  const shoeActor = dropSection.querySelector('.run-shoe-actor-wrap');
  const shoeImg = dropSection.querySelector('.run-shoe-img');
  const ghosts = [
    dropSection.querySelector('.run-ghost-1'),
    dropSection.querySelector('.run-ghost-2'),
    dropSection.querySelector('.run-ghost-3')
  ];
  const flashBar = dropSection.querySelector('.run-shoe-flash-bar');
  const distanceOdoContainer = dropSection.querySelector('.run-distance-odo');
  const chapterNameBadge = dropSection.querySelector('.run-chapter-name-badge');
  const raceTrackFill = dropSection.querySelector('.race-track-progress-fill');
  const raceTrackCursor = dropSection.querySelector('.race-track-shoe-cursor');
  const raceTicks = dropSection.querySelectorAll('.race-tick-btn');
  const chapterPanes = dropSection.querySelectorAll('.chapter-pane');
  const hotspotsLayer = dropSection.querySelector('.run-hotspots-layer');

  // Pre-split chapter headlines for discrete char transitions
  const chapterHeadlinesChars = [];
  chapterPanes.forEach(pane => {
    const hl = pane.querySelector('.chapter-headline');
    if (hl) {
      chapterHeadlinesChars.push(splitTextMasked(hl, 'chars'));
    } else {
      chapterHeadlinesChars.push([]);
    }
  });

  // Odometer for distance HUD (0 to 400 M)
  let distanceOdometer = null;
  if (distanceOdoContainer) {
    distanceOdometer = new Odometer(distanceOdoContainer, { initialValue: '0' });
  }

  // Render Hotspots into shoe wrapper
  if (hotspotsLayer) {
    hotspotsLayer.innerHTML = '';
    HOTSPOTS.forEach(hs => {
      const node = document.createElement('div');
      node.className = `hotspot-node hotspot-side-${hs.side}`;
      node.dataset.chapter = hs.chapter;
      node.style.left = `${hs.x}%`;
      node.style.top = `${hs.y}%`;

      node.innerHTML = `
        <div class="hotspot-marker" data-cursor="TECH">
          <span class="hotspot-pulse-ring"></span>
        </div>
        <div class="hotspot-connector"></div>
        <div class="hotspot-tag-box">${hs.label}</div>
        <span class="hotspot-debug-coords">${hs.x}%, ${hs.y}%</span>
      `;
      hotspotsLayer.appendChild(node);
    });
  }

  // Update shoe image helper
  function updateRunShoeImage(colorway) {
    const url = getImage(colorway.image, colorway.accent);
    if (shoeImg) shoeImg.src = url;
    ghosts.forEach(g => {
      if (g) g.src = url;
    });
    const mobileShoes = dropSection.querySelectorAll('.mobile-chapter-shoe-img');
    mobileShoes.forEach(m => {
      m.src = url;
    });
  }
  updateRunShoeImage(getCurrentColorway());

  // Listen for colorway changes with hard flash sweep
  window.addEventListener('colorway:change', (e) => {
    const newCw = e.detail.colorway;
    if (!newCw) return;

    if (flashBar && !isReducedMotion()) {
      flashBar.style.display = 'block';
      gsap.fromTo(flashBar,
        { xPercent: -150 },
        {
          xPercent: 150,
          duration: 0.22,
          ease: 'power2.inOut',
          onComplete: () => {
            flashBar.style.display = 'none';
          }
        }
      );
    }
    updateRunShoeImage(newCw);
  });

  // --------------------------------------------------------------------------
  // 5-KEYFRAME MOTION PATH CALCULATOR
  // Evaluates position, scale, and rotation at any progress (0 to 1)
  // Keeps at least 24px clear of stage edges and rail
  // --------------------------------------------------------------------------
  const keyframes = [
    { p: 0.00, x: -24, y: 12,  scale: 0.70, rot: -6 },  // 01 Launch (left side, center < 50%)
    { p: 0.25, x: 22,  y: -10, scale: 0.95, rot: -12 }, // 02 Snap (right side, center > 50%)
    { p: 0.50, x: 22,  y: 10,  scale: 1.10, rot: 6 },   // 03 Float (right side, center > 50%)
    { p: 0.75, x: -22, y: 8,   scale: 1.15, rot: -18 }, // 04 Lock (left side, center < 50%)
    { p: 1.00, x: -20, y: 0,   scale: 1.25, rot: -8 }   // Final
  ];

  function evaluateMotionPath(progress) {
    const clampedP = Math.max(0, Math.min(1, progress));
    let segIdx = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (clampedP >= keyframes[i].p && clampedP <= keyframes[i + 1].p) {
        segIdx = i;
        break;
      }
    }
    const k0 = keyframes[segIdx];
    const k1 = keyframes[segIdx + 1];
    const segT = (clampedP - k0.p) / (k1.p - k0.p);

    // Eased interpolation (power1.inOut / smoothstep)
    const easedT = segT * segT * (3 - 2 * segT);

    const x = k0.x + (k1.x - k0.x) * easedT;
    const y = k0.y + (k1.y - k0.y) * easedT;
    const scale = k0.scale + (k1.scale - k0.scale) * easedT;
    const rot = k0.rot + (k1.rot - k0.rot) * easedT;

    return { x, y, scale, rot };
  }

  // --------------------------------------------------------------------------
  // SPEED LINES ENGINE (Shared Ticker, SkewX -20deg)
  // --------------------------------------------------------------------------
  const speedLinesContainer = dropSection.querySelector('.run-speedlines-container');
  const speedLines = [];
  if (speedLinesContainer && !isReducedMotion()) {
    speedLinesContainer.innerHTML = '';
    for (let i = 0; i < 14; i++) {
      const line = document.createElement('div');
      const isCream = i % 3 === 0;
      line.className = `speed-line ${isCream ? 'line-cream' : ''}`;
      const height = 2 + (i % 5);
      const width = 120 + ((i * 37) % 440);
      const top = 10 + (i * 6.2);
      line.style.height = `${height}px`;
      line.style.width = `${width}px`;
      line.style.top = `${top}%`;
      line.style.left = `${100 + (i * 20)}%`;
      speedLinesContainer.appendChild(line);
      speedLines.push({ el: line, baseTop: top, width, x: 100 + (i * 15), speed: 1.5 + (i * 0.4) });
    }
  }

  let isPinVisible = false;
  gsap.ticker.add((time, deltaTime) => {
    if (!isPinVisible || document.hidden || isReducedMotion()) return;
    const vel = Math.abs(getScrollVelocity());
    const dtFactor = (deltaTime || 16.6) / 16.6;
    const baseSpeed = 1.0;
    const dynamicSpeed = (baseSpeed + vel * 0.18) * dtFactor;
    const targetOpacity = Math.min(0.85, 0.08 + vel * 0.08);

    speedLines.forEach(l => {
      l.x -= l.speed * dynamicSpeed;
      if (l.x < -40) {
        l.x = 110 + Math.random() * 20;
      }
      l.el.style.transform = `translateX(${l.x}vw) skewX(-20deg)`;
      l.el.style.opacity = targetOpacity;
    });
  });

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT & MASTER RENDER FUNCTION (self.progress is Single Truth)
  // --------------------------------------------------------------------------
  let currentChapter = 1;
  const chapterTitles = ['LAUNCH', 'SNAP', 'FLOAT', 'LOCK'];

  function renderRunState(progress) {
    // 1. Shoe transform
    const currentTransform = evaluateMotionPath(progress);
    const velSkew = Math.max(-5, Math.min(5, getScrollVelocity() * 0.8));

    if (shoeActor) {
      shoeActor.style.transform = `translate(calc(-50% + ${currentTransform.x}vw), calc(-50% + ${currentTransform.y}vh)) scale(${currentTransform.scale}) rotate(${currentTransform.rot}deg) skewX(${velSkew}deg)`;
    }

    // Ghosts trailing delayed along the path
    const ghostDelays = [0.02, 0.04, 0.06];
    ghosts.forEach((g, idx) => {
      if (g) {
        const delayedP = Math.max(0, progress - ghostDelays[idx]);
        const gt = evaluateMotionPath(delayedP);
        g.style.transform = `translate(calc(-50% + ${gt.x}vw), calc(-50% + ${gt.y}vh)) scale(${gt.scale}) rotate(${gt.rot}deg)`;
      }
    });

    // 2. HUD Distance & Chapter info
    const currentMeters = Math.min(400, Math.floor(progress * 400));
    if (distanceOdometer) {
      distanceOdometer.setValue(String(currentMeters), false);
    }
    if (raceTrackFill) {
      raceTrackFill.style.width = `${progress * 100}%`;
    }
    if (raceTrackCursor) {
      raceTrackCursor.style.left = `${progress * 100}%`;
    }

    // 3. Background Wipe Polygon Sweeps (0.25-0.35 and 0.60-0.70)
    if (bgWipeLayer) {
      if (progress >= 0.25 && progress < 0.60) {
        // Chapter 2: Sweep in colorway background
        const sweepP = Math.min(1, (progress - 0.25) / 0.10);
        const clipX = sweepP * 120;
        bgWipeLayer.style.clipPath = `polygon(0 0, ${clipX}% 0, ${clipX - 20}% 100%, 0 100%)`;
      } else if (progress >= 0.60 && progress < 0.70) {
        // Sweep back out to ink
        const sweepOutP = Math.min(1, (progress - 0.60) / 0.10);
        const clipX = (1 - sweepOutP) * 120;
        bgWipeLayer.style.clipPath = `polygon(0 0, ${clipX}% 0, ${clipX - 20}% 100%, 0 100%)`;
      } else if (progress >= 0.70) {
        // Chapter 4: Sweep colorway back in
        const sweep4P = Math.min(1, (progress - 0.70) / 0.08);
        const clipX = sweep4P * 120;
        bgWipeLayer.style.clipPath = `polygon(0 0, ${clipX}% 0, ${clipX - 20}% 100%, 0 100%)`;
      } else {
        bgWipeLayer.style.clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)';
      }
    }

    // 4. Chapter Switching (Exact thresholds: 0.25, 0.50, 0.75)
    let newChapter = 1;
    if (progress >= 0.75) {
      newChapter = 4;
    } else if (progress >= 0.50) {
      newChapter = 3;
    } else if (progress >= 0.25) {
      newChapter = 2;
    }

    if (newChapter !== currentChapter) {
      switchChapter(currentChapter, newChapter);
      currentChapter = newChapter;
    }
  }

  function switchChapter(oldIdx, newIdx) {
    const oldPane = chapterPanes[oldIdx - 1];
    const newPane = chapterPanes[newIdx - 1];

    // Discrete headline char exit and entrance
    if (oldPane) {
      const oldChars = chapterHeadlinesChars[oldIdx - 1];
      if (oldChars && oldChars.length > 0 && !isReducedMotion()) {
        gsap.to(oldChars, {
          yPercent: -100,
          skewY: -8,
          opacity: 0,
          duration: 0.25,
          stagger: 0.015,
          ease: 'power2.in',
          onComplete: () => {
            oldPane.classList.remove('pane-active');
          }
        });
      } else {
        oldPane.classList.remove('pane-active');
      }
    }

    if (newPane) {
      // Compute text side opposite shoe x position (x < 0 means left of 50%, text goes right and vice versa)
      const chapMidP = Math.max(0, Math.min(1, (newIdx - 0.5) * 0.25));
      const shoePos = evaluateMotionPath(chapMidP);
      const isShoeLeft = shoePos.x < 0;
      newPane.classList.toggle('chapter-pos-right', isShoeLeft);
      newPane.classList.toggle('chapter-pos-left', !isShoeLeft);

      newPane.classList.add('pane-active');
      const newChars = chapterHeadlinesChars[newIdx - 1];
      if (newChars && newChars.length > 0 && !isReducedMotion()) {
        gsap.fromTo(newChars,
          { yPercent: 120, skewY: 10, opacity: 0 },
          { yPercent: 0, skewY: 0, opacity: 1, duration: 0.5, stagger: 0.025, ease: 'expo.out' }
        );
      }
    }

    // Giant background chapter number update
    if (giantNumBg) {
      giantNumBg.textContent = `0${newIdx}`;
      if (!isReducedMotion()) {
        gsap.fromTo(giantNumBg,
          { scale: 0.85, opacity: 0.1 },
          { scale: 1, opacity: 0.35, duration: 0.45, ease: 'back.out(2)' }
        );
      }
    }

    // Chapter badge in HUD
    if (chapterNameBadge) {
      chapterNameBadge.textContent = `CH. 0${newIdx} // ${chapterTitles[newIdx - 1]}`;
    }

    // Race Track Ticks Active state
    raceTicks.forEach((btn, idx) => {
      btn.classList.toggle('tick-active', idx + 1 === newIdx);
    });

    // Hotspots activation
    const hotspotNodes = dropSection.querySelectorAll('.hotspot-node');
    hotspotNodes.forEach(node => {
      const hsChap = parseInt(node.dataset.chapter, 10);
      node.classList.toggle('is-active', hsChap === newIdx);
    });
  }

  // --------------------------------------------------------------------------
  // CLICK RACE TRACK TICKS -> SCROLL TO CHAPTER WITH LENIS (1.4s, expo.inOut)
  // --------------------------------------------------------------------------
  raceTicks.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetChap = parseInt(btn.dataset.chap, 10);
      const targetProgress = [0, 0.26, 0.51, 0.76][targetChap - 1] || 0;

      if (!pinSection) return;
      const rect = pinSection.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const pinStart = scrollTop + rect.top;
      const pinDistance = pinSection.offsetHeight - window.innerHeight;
      const targetScroll = pinStart + (pinDistance * targetProgress);

      if (lenis) {
        lenis.scrollTo(targetScroll, {
          duration: 1.4,
          easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) // expo.inOut
        });
      } else {
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
    });
  });

  // --------------------------------------------------------------------------
  // CREATE SINGLE MASTER SCROLLTRIGGER & TIMELINE FOR THE RUN PIN
  // --------------------------------------------------------------------------
  let runScrollTrigger = null;

  const mm = gsap.matchMedia();

  // Desktop Pinning (> 899px and not reduced-motion)
  mm.add('(min-width: 900px)', () => {
    if (isReducedMotion()) return;

    // Set initial chapter visible
    switchChapter(0, 1);

    runScrollTrigger = ScrollTrigger.create({
      trigger: pinSection,
      start: 'top top',
      end: 'bottom bottom',
      pin: '.run-stage-viewport',
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      scrub: 1,
      onToggle: (self) => {
        isPinVisible = self.isActive;
      },
      onUpdate: (self) => {
        // self.progress is the SINGLE source of truth
        renderRunState(self.progress);
      }
    });
  });

  // --------------------------------------------------------------------------
  // MOBILE (< 900px) & REDUCED MOTION: STACKED CHAPTERS LAYOUT
  // --------------------------------------------------------------------------
  mm.add('(max-width: 899px)', () => {
    const mobileCards = dropSection.querySelectorAll('.mobile-chapter-card');
    mobileCards.forEach((card, idx) => {
      const shoeBox = card.querySelector('.mobile-chapter-shoe-img');
      if (shoeBox) {
        shoeBox.src = getImage(getCurrentColorway().image);
      }

      ScrollTrigger.create({
        trigger: card,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          gsap.fromTo(card,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
          );
        }
      });
    });
  });

  // --------------------------------------------------------------------------
  // 3. PART C: LIVE RESERVATIONS STRIP
  // --------------------------------------------------------------------------
  const resOdoContainer = dropSection.querySelector('.res-odometer');
  let currentReservationCount = 12480;
  let reservationsOdometer = null;

  if (resOdoContainer) {
    reservationsOdometer = new Odometer(resOdoContainer, { initialValue: '12480' });
  }

  // Seeded list for live reservation toasts
  const toastSeedData = [
    { name: 'MAYA', city: 'BERLIN', cw: 'COBALT RUSH', color: '#2B3FFF' },
    { name: 'KENJI', city: 'TOKYO', cw: 'VOLT', color: '#D6FF3A' },
    { name: 'ELENA', city: 'MILAN', cw: 'PUNCH', color: '#FF3D8B' },
    { name: 'MARCUS', city: 'LONDON', cw: 'COBALT RUSH', color: '#2B3FFF' },
    { name: 'SOPHIA', city: 'NEW YORK', cw: 'VOLT', color: '#D6FF3A' },
    { name: 'LEO', city: 'PARIS', cw: 'PUNCH', color: '#FF3D8B' },
    { name: 'AXEL', city: 'STOCKHOLM', cw: 'COBALT RUSH', color: '#2B3FFF' },
    { name: 'CHLOE', city: 'SEOUL', cw: 'VOLT', color: '#D6FF3A' }
  ];

  const toastFeed = dropSection.querySelector('.res-toast-feed');
  let toastIndex = 0;
  let reservationTimer = null;
  let isReservationsVisible = false;

  function pushReservationToast() {
    if (!toastFeed || !isReservationsVisible || document.hidden || isReducedMotion()) return;

    const entry = toastSeedData[toastIndex % toastSeedData.length];
    toastIndex++;

    // Increment count by 1 to 3
    const increment = Math.floor(Math.random() * 3) + 1;
    currentReservationCount += increment;
    if (reservationsOdometer) {
      reservationsOdometer.setValue(String(currentReservationCount), true);
    }

    const toast = document.createElement('div');
    toast.className = 'res-toast-item';
    toast.innerHTML = `
      <span class="res-toast-color-swatch" style="background-color: ${entry.color}"></span>
      <span><strong>${entry.name}</strong> // ${entry.city} reserved ${entry.cw} • JUST NOW</span>
    `;

    toastFeed.prepend(toast);

    // Animate slide in
    gsap.fromTo(toast,
      { y: -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
    );

    // Limit to max 3 toasts
    const allToasts = toastFeed.querySelectorAll('.res-toast-item');
    if (allToasts.length > 3) {
      const oldest = allToasts[allToasts.length - 1];
      gsap.to(oldest, {
        y: 20,
        opacity: 0,
        duration: 0.25,
        onComplete: () => oldest.remove()
      });
    }

    // Schedule next increment (seeded between 2.5s and 6s)
    const nextDelay = 2500 + Math.random() * 3500;
    reservationTimer = setTimeout(pushReservationToast, nextDelay);
  }

  // IntersectionObserver to pause when offscreen
  const stripWrap = dropSection.querySelector('.reservations-strip-wrap');
  if (stripWrap) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isReservationsVisible = entry.isIntersecting;
        if (isReservationsVisible && !reservationTimer) {
          pushReservationToast();
        } else if (!isReservationsVisible && reservationTimer) {
          clearTimeout(reservationTimer);
          reservationTimer = null;
        }
      });
    }, { threshold: 0.1 });

    observer.observe(stripWrap);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && reservationTimer) {
      clearTimeout(reservationTimer);
      reservationTimer = null;
    } else if (!document.hidden && isReservationsVisible && !reservationTimer) {
      pushReservationToast();
    }
  });

  // Smooth scroll for "RESERVE YOURS ↗"
  const reserveYoursBtn = dropSection.querySelector('.btn-reserve-yours');
  if (reserveYoursBtn) {
    reserveYoursBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector('#reserve');
      if (target && lenis) {
        lenis.scrollTo(target, { duration: 1.4, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
      }
    });
  }

  // Refresh ScrollTrigger calculations after mount
  ScrollTrigger.refresh();
}
