import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getImage } from '../lib/images.js';
import { getCurrentColorway, setColorway } from '../lib/theme.js';
import { getLenis, ScrollLockManager } from '../lib/scroll.js';
import { Odometer, splitTextMasked, isReducedMotion } from '../lib/utils.js';
import { GALLERY_CARDS } from '../../data/gallery-data.js';
import { computeSize, stockFor } from '../lib/sizing.js';

gsap.registerPlugin(ScrollTrigger);

export function initGallerySection() {
  const gallerySection = document.getElementById('gallery');
  if (!gallerySection) return;

  const lenis = getLenis();

  // --------------------------------------------------------------------------
  // 1. HEADER ANIMATION (Masked Headline Words Slam)
  // --------------------------------------------------------------------------
  const headline = gallerySection.querySelector('.gallery-statement');
  if (headline && !isReducedMotion()) {
    ScrollTrigger.create({
      trigger: headline,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const words = splitTextMasked(headline, 'words');
        gsap.fromTo(words,
          { yPercent: 120, skewY: 12, opacity: 0 },
          { yPercent: 0, skewY: 0, opacity: 1, duration: 0.65, stagger: 0.05, ease: 'expo.out' }
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. PART A: THE LINEUP DRAG CAROUSEL CONTROLLER
  // --------------------------------------------------------------------------
  const track = gallerySection.querySelector('.lineup-track');
  const viewport = gallerySection.querySelector('.lineup-viewport');
  const cards = gallerySection.querySelectorAll('.poster-card');
  const btnPrev = gallerySection.querySelector('.carousel-btn-prev');
  const btnNext = gallerySection.querySelector('.carousel-btn-next');
  const counterContainer = gallerySection.querySelector('.carousel-counter-num');
  const progressBar = gallerySection.querySelector('.lineup-progress-thumb');
  const progressTrack = gallerySection.querySelector('.lineup-progress-track');

  let carouselOdometer = null;
  if (counterContainer) {
    carouselOdometer = new Odometer(counterContainer, { initialValue: '01' });
  }

  // Check for external images gallery-1 to gallery-8
  cards.forEach((card, idx) => {
    const cardId = idx + 1;
    const customImg = getImage(`gallery-${cardId}`);
    if (customImg && !customImg.includes('svg')) {
      const imgEl = card.querySelector('.poster-img-parallax');
      if (imgEl) imgEl.src = customImg;
    }
  });

  // Carousel Physics State
  const carouselState = {
    x: 0,
    targetX: 0,
    isDragging: false,
    dragStartX: 0,
    trackStartX: 0,
    lastPointerX: 0,
    lastTime: 0,
    velocity: 0,
    hasMoved: false,
    maxScroll: 0,
    currentIndex: 0
  };

  function updateMaxScroll() {
    if (!track || !viewport) return;
    const trackWidth = track.scrollWidth;
    const viewportWidth = window.innerWidth;
    carouselState.maxScroll = Math.max(0, trackWidth - viewportWidth);
  }
  window.addEventListener('resize', updateMaxScroll);
  updateMaxScroll();

  // Skew quickTo for dynamic velocity drag tilt
  const trackSkewTo = gsap.quickTo(cards, 'skewX', { duration: 0.25, ease: 'power2.out' });
  const imgParallaxTo = gsap.quickTo('.poster-img-parallax', 'xPercent', { duration: 0.3, ease: 'power2.out' });

  function setCarouselPosition(x, animate = false) {
    carouselState.x = x;
    if (track) {
      track.style.transform = `translateX(${x}px)`;
    }

    // Normalized progress (0 to 1)
    const progress = carouselState.maxScroll > 0 ? Math.min(1, Math.max(0, -x / carouselState.maxScroll)) : 0;

    // Update Progress Thumb
    if (progressBar) {
      progressBar.style.left = `${progress * (100 - 12.5)}%`;
    }

    // Active Card Calculation
    const cardCount = cards.length;
    const activeIdx = Math.min(cardCount - 1, Math.max(0, Math.round(progress * (cardCount - 1))));
    if (activeIdx !== carouselState.currentIndex) {
      carouselState.currentIndex = activeIdx;
      if (carouselOdometer) {
        carouselOdometer.setValue(String(activeIdx + 1).padStart(2, '0'), false);
      }
    }
  }

  // Pointer Events Dragging with Pointer Capture
  if (viewport && track) {
    viewport.addEventListener('pointerdown', (e) => {
      carouselState.isDragging = true;
      carouselState.hasMoved = false;
      carouselState.dragStartX = e.clientX;
      carouselState.trackStartX = carouselState.x;
      carouselState.lastPointerX = e.clientX;
      carouselState.lastTime = performance.now();
      carouselState.velocity = 0;
      viewport.setPointerCapture(e.pointerId);
      gsap.killTweensOf(carouselState);
    });

    viewport.addEventListener('pointermove', (e) => {
      if (!carouselState.isDragging) return;
      const dx = e.clientX - carouselState.dragStartX;
      if (Math.abs(dx) > 6) {
        carouselState.hasMoved = true;
      }

      // Calculate instantaneous velocity
      const now = performance.now();
      const dt = now - carouselState.lastTime;
      if (dt > 0) {
        carouselState.velocity = (e.clientX - carouselState.lastPointerX) / dt;
      }
      carouselState.lastPointerX = e.clientX;
      carouselState.lastTime = now;

      // Rubber-band resistance past bounds (max 120px)
      let targetX = carouselState.trackStartX + dx;
      if (targetX > 0) {
        targetX = Math.min(120, targetX * 0.35);
      } else if (targetX < -carouselState.maxScroll) {
        const overflow = targetX + carouselState.maxScroll;
        targetX = -carouselState.maxScroll + Math.max(-120, overflow * 0.35);
      }

      // Card velocity skew (up to 8deg)
      const skew = Math.max(-8, Math.min(8, carouselState.velocity * -6));
      trackSkewTo(skew);
      imgParallaxTo(skew * -0.75);

      setCarouselPosition(targetX);
    });

    const endDrag = (e) => {
      if (!carouselState.isDragging) return;
      carouselState.isDragging = false;
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}

      trackSkewTo(0);
      imgParallaxTo(0);

      // Inertia throw with gsap
      if (!isReducedMotion()) {
        const momentum = carouselState.velocity * 320;
        let finalX = carouselState.x + momentum;

        // Snap inside bounds
        finalX = Math.max(-carouselState.maxScroll, Math.min(0, finalX));

        gsap.to(carouselState, {
          x: finalX,
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: () => setCarouselPosition(carouselState.x)
        });
      } else {
        // Reduced motion: snap directly into bounds
        const finalX = Math.max(-carouselState.maxScroll, Math.min(0, carouselState.x));
        setCarouselPosition(finalX);
      }
    };

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // Trackpad horizontal gestures (deltaX)
    viewport.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        let targetX = carouselState.x - e.deltaX * 1.2;
        targetX = Math.max(-carouselState.maxScroll, Math.min(0, targetX));
        setCarouselPosition(targetX);
      }
    }, { passive: false });
  }

  // Prev & Next Buttons (scroll by one card)
  function scrollToCard(index) {
    updateMaxScroll();
    const clampedIdx = Math.max(0, Math.min(cards.length - 1, index));
    const cardEl = cards[clampedIdx];
    if (!cardEl) return;

    const targetX = -Math.min(carouselState.maxScroll, cardEl.offsetLeft - (window.innerWidth < 900 ? 20 : 120));

    gsap.to(carouselState, {
      x: targetX,
      duration: isReducedMotion() ? 0.01 : 0.9,
      ease: 'expo.inOut',
      onUpdate: () => setCarouselPosition(carouselState.x)
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => scrollToCard(carouselState.currentIndex - 1));
  }
  if (btnNext) {
    btnNext.addEventListener('click', () => scrollToCard(carouselState.currentIndex + 1));
  }

  // Keyboard navigation on track
  if (viewport) {
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToCard(carouselState.currentIndex + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToCard(carouselState.currentIndex - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToCard(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToCard(cards.length - 1);
      }
    });
  }

  // Progress Bar Drag
  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      const rect = progressTrack.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setCarouselPosition(-p * carouselState.maxScroll);
    });
  }

  // --------------------------------------------------------------------------
  // 3. FULLSCREEN LIGHTBOX MODAL WITH SLANTED SWEEP & SCROLL LOCK
  // --------------------------------------------------------------------------
  const lightboxModal = gallerySection.querySelector('.gallery-lightbox-modal');
  const lightboxImg = gallerySection.querySelector('.lightbox-enlarged-img');
  const lightboxCaption = gallerySection.querySelector('.lightbox-caption-text');
  const lightboxTitle = gallerySection.querySelector('.lightbox-title-text');
  const btnLightboxClose = gallerySection.querySelector('.lightbox-close-btn');
  const btnLightboxPrev = gallerySection.querySelector('.lightbox-btn-prev');
  const btnLightboxNext = gallerySection.querySelector('.lightbox-btn-next');
  const btnUseColorway = gallerySection.querySelector('.lightbox-use-cw-btn');

  let activeLightboxIndex = 0;
  let lastFocusedElement = null;

  // Scroll Lock Manager with guaranteed release
  let scrollLockCounter = 0;
  function lockScroll() {
    scrollLockCounter++;
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
  }

  function unlockScroll() {
    scrollLockCounter = Math.max(0, scrollLockCounter - 1);
    if (scrollLockCounter === 0) {
      if (lenis) lenis.start();
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }

  function openLightbox(index) {
    activeLightboxIndex = index;
    const cardData = GALLERY_CARDS[index];
    if (!cardData || !lightboxModal) return;

    lastFocusedElement = document.activeElement;
    ScrollLockManager.lock(lightboxModal);

    // Populate content
    const srcImg = cards[index].querySelector('img');
    if (srcImg && lightboxImg) {
      lightboxImg.src = srcImg.src;
      lightboxImg.style.display = 'block';
    } else if (lightboxImg) {
      lightboxImg.style.display = 'none';
    }

    if (lightboxTitle) lightboxTitle.textContent = cardData.title;
    if (lightboxCaption) lightboxCaption.textContent = cardData.caption;

    // "USE THIS COLORWAY" button
    if (btnUseColorway) {
      if (cardData.colorway) {
        btnUseColorway.style.display = 'inline-flex';
        btnUseColorway.dataset.cw = cardData.colorway;
      } else {
        btnUseColorway.style.display = 'none';
      }
    }

    lightboxModal.classList.add('is-open');
    lightboxModal.setAttribute('aria-hidden', 'false');

    // Slanted sweep entrance
    if (!isReducedMotion()) {
      gsap.fromTo(lightboxModal,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
        { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', duration: 0.55, ease: 'expo.inOut' }
      );
    }

    btnLightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightboxModal || !lightboxModal.classList.contains('is-open')) return;

    if (!isReducedMotion()) {
      gsap.to(lightboxModal, {
        clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
        duration: 0.45,
        ease: 'expo.inOut',
        onComplete: () => {
          lightboxModal.classList.remove('is-open');
          lightboxModal.setAttribute('aria-hidden', 'true');
          ScrollLockManager.unlock(lightboxModal);
          lastFocusedElement?.focus();
        }
      });
    } else {
      lightboxModal.classList.remove('is-open');
      lightboxModal.setAttribute('aria-hidden', 'true');
      ScrollLockManager.unlock(lightboxModal);
      lastFocusedElement?.focus();
    }
  }

  // Card click opens Lightbox (suppressed if dragged)
  cards.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      if (carouselState.hasMoved) return;
      openLightbox(idx);
    });
  });

  // Lightbox Close Handlers
  if (btnLightboxClose) {
    btnLightboxClose.addEventListener('click', closeLightbox);
  }

  window.addEventListener('keydown', (e) => {
    if (!lightboxModal?.classList.contains('is-open')) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      openLightbox((activeLightboxIndex + 1) % GALLERY_CARDS.length);
    } else if (e.key === 'ArrowLeft') {
      openLightbox((activeLightboxIndex - 1 + GALLERY_CARDS.length) % GALLERY_CARDS.length);
    }
  });

  if (btnLightboxPrev) {
    btnLightboxPrev.addEventListener('click', () => {
      openLightbox((activeLightboxIndex - 1 + GALLERY_CARDS.length) % GALLERY_CARDS.length);
    });
  }
  if (btnLightboxNext) {
    btnLightboxNext.addEventListener('click', () => {
      openLightbox((activeLightboxIndex + 1) % GALLERY_CARDS.length);
    });
  }

  // Use Colorway from Lightbox
  if (btnUseColorway) {
    btnUseColorway.addEventListener('click', () => {
      const cw = btnUseColorway.dataset.cw;
      if (cw) {
        setColorway(cw);
      }
      closeLightbox();
    });
  }

  // Guaranteed release safety nets
  window.addEventListener('resize', () => { if (lightboxModal?.classList.contains('is-open')) closeLightbox(); });
  window.addEventListener('pagehide', unlockScroll);
  document.addEventListener('visibilitychange', () => { if (document.hidden && lightboxModal?.classList.contains('is-open')) closeLightbox(); });

  // --------------------------------------------------------------------------
  // 4. PART B: FIND YOUR FIT (SIZE FINDER & RULER ENGINE)
  // --------------------------------------------------------------------------
  const rulerTrackOuter = gallerySection.querySelector('.ruler-drag-track-outer');
  const rulerTicksTrack = gallerySection.querySelector('.ruler-ticks-track');
  const rulerNeedle = gallerySection.querySelector('.ruler-indicator-needle');
  const rulerOdoVal = gallerySection.querySelector('.ruler-odometer-val');
  const rulerUnitLabel = gallerySection.querySelector('.ruler-unit-label');
  const footSvgOutline = gallerySection.querySelector('.foot-svg-outline');

  const unitButtons = gallerySection.querySelectorAll('.unit-btn');
  const widthButtons = gallerySection.querySelectorAll('.btn-width-opt');
  const useButtons = gallerySection.querySelectorAll('.btn-use-opt');
  const fitButtons = gallerySection.querySelectorAll('.btn-fit-opt');

  const resultUsVal = gallerySection.querySelector('.result-us-odometer');
  const resultEuVal = gallerySection.querySelector('.result-eu-val');
  const resultUkVal = gallerySection.querySelector('.result-uk-val');
  const confidencePercentVal = gallerySection.querySelector('.confidence-percent-val');
  const confidenceSegments = gallerySection.querySelectorAll('.confidence-segment');
  const resultTipBox = gallerySection.querySelector('.result-tip-box');
  const resultShoeThumb = gallerySection.querySelector('.result-shoe-thumb');
  const resultCwSticker = gallerySection.querySelector('.result-cw-name');

  const sizeGridButtons = gallerySection.querySelectorAll('.size-square-btn');
  const selectionBar = gallerySection.querySelector('.size-selection-action-bar');
  const selectionInfo = gallerySection.querySelector('.selection-info-text');

  const accordionToggle = gallerySection.querySelector('.measure-accordion-toggle');
  const accordionContent = gallerySection.querySelector('.measure-accordion-content');
  const accordionIcon = gallerySection.querySelector('.accordion-icon');

  // Single plain JS state object for Size Finder
  const finderState = {
    footLengthCm: 27.0,
    unit: 'CM', // 'CM' or 'IN'
    width: 'STANDARD',
    use: 'TRAIN',
    fit: 'TRUE',
    selectedSize: 9.0,
    isRulerDragging: false,
    isAccordionOpen: false
  };

  let rulerOdometer = null;
  let usOdometer = null;
  let euOdometer = null;
  let ukOdometer = null;
  let confidenceOdometer = null;

  if (rulerOdoVal) rulerOdometer = new Odometer(rulerOdoVal, { initialValue: '27.0' });
  if (resultUsVal) usOdometer = new Odometer(resultUsVal, { initialValue: '9' });
  if (resultEuVal) euOdometer = new Odometer(resultEuVal, { initialValue: '42.5' });
  if (resultUkVal) ukOdometer = new Odometer(resultUkVal, { initialValue: '8.5' });
  if (confidencePercentVal) confidenceOdometer = new Odometer(confidencePercentVal, { initialValue: '96' });

  // Generate ticks for 22.0 to 31.0 cm (9 cm range = 90 mm)
  if (rulerTicksTrack) {
    rulerTicksTrack.innerHTML = '';
    const totalMm = 90; // 220mm to 310mm
    for (let i = 0; i <= totalMm; i++) {
      const tick = document.createElement('div');
      const isCm = i % 10 === 0;
      tick.style.position = 'absolute';
      tick.style.left = `${(i / totalMm) * 100}%`;
      tick.style.width = '1px';
      tick.style.height = isCm ? '28px' : '14px';
      tick.style.backgroundColor = isCm ? '#0E0E10' : 'rgba(14, 14, 16, 0.4)';

      if (isCm) {
        const cmLabel = document.createElement('span');
        cmLabel.style.position = 'absolute';
        cmLabel.style.top = '30px';
        cmLabel.style.left = '-10px';
        cmLabel.style.fontFamily = 'var(--font-mono)';
        cmLabel.style.fontSize = '9px';
        cmLabel.style.fontWeight = '700';
        cmLabel.textContent = 22 + (i / 10);
        tick.appendChild(cmLabel);
      }
      rulerTicksTrack.appendChild(tick);
    }
  }

  // Update Size Finder Views
  function renderSizeFinder() {
    const computed = computeSize({
      footLengthCm: finderState.footLengthCm,
      width: finderState.width,
      use: finderState.use,
      fit: finderState.fit
    });

    // 1. Ruler display
    const isCm = finderState.unit === 'CM';
    const displayLength = isCm
      ? finderState.footLengthCm.toFixed(1)
      : (finderState.footLengthCm / 2.54).toFixed(1);

    if (rulerOdometer) {
      rulerOdometer.setValue(displayLength, false);
    }
    if (rulerUnitLabel) {
      rulerUnitLabel.textContent = isCm ? 'CM' : 'IN';
    }

    // Ruler needle position (22cm to 31cm)
    const normRulerP = (finderState.footLengthCm - 22.0) / 9.0;
    if (rulerNeedle) {
      rulerNeedle.style.left = `${normRulerP * 100}%`;
    }

    // Foot outline scaling (SVG length)
    if (footSvgOutline) {
      const scaleX = 0.8 + normRulerP * 0.4;
      footSvgOutline.style.transform = `scaleX(${scaleX})`;
    }

    // 2. Result card odometers
    if (usOdometer) usOdometer.setValue(String(computed.us), false);
    if (euOdometer) euOdometer.setValue(String(computed.eu), false);
    if (ukOdometer) ukOdometer.setValue(String(computed.uk), false);
    if (confidenceOdometer) confidenceOdometer.setValue(String(computed.confidence), false);

    // 10-segment confidence meter
    const filledSegmentsCount = Math.round((computed.confidence / 100) * 10);
    confidenceSegments.forEach((seg, idx) => {
      seg.classList.toggle('is-filled', idx < filledSegmentsCount);
    });

    // Tip line
    if (resultTipBox) {
      resultTipBox.textContent = computed.tip;
    }

    // Shoe preview and colorway sticker
    const currentCw = getCurrentColorway();
    if (resultShoeThumb) {
      resultShoeThumb.src = getImage(currentCw.image);
    }
    if (resultCwSticker) {
      resultCwSticker.textContent = currentCw.name;
    }

    // 3. Size Grid updates
    const activeColorwayId = currentCw.id;
    sizeGridButtons.forEach(btn => {
      const sizeVal = parseFloat(btn.dataset.size);
      const isRecommended = sizeVal === computed.us;
      const isSelected = sizeVal === finderState.selectedSize;

      btn.classList.toggle('is-recommended', isRecommended);
      btn.classList.toggle('is-selected', isSelected);

      // Deterministic stock state
      const stock = stockFor(sizeVal, activeColorwayId);
      const youTag = btn.querySelector('.size-you-tag');
      if (youTag) {
        youTag.style.display = isRecommended ? 'block' : 'none';
      }

      if (stock.status === 'SOLD_OUT') {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
        btn.title = 'SOLD OUT';
      } else {
        btn.disabled = false;
        btn.removeAttribute('aria-disabled');
        btn.title = stock.label;
      }
    });

    // 4. Selection bar
    if (selectionInfo) {
      selectionInfo.textContent = `SELECTED: US ${finderState.selectedSize} • ${currentCw.name}`;
    }

    // Dispatch size:select CustomEvent
    window.dispatchEvent(new CustomEvent('size:select', {
      detail: {
        size: finderState.selectedSize,
        colorway: currentCw.id
      }
    }));
  }

  // Initial Size Finder computation
  renderSizeFinder();

  // Listen to colorway changes to re-evaluate stock and previews
  window.addEventListener('colorway:change', renderSizeFinder);

  // Ruler Drag Handlers
  function updateRulerFromPointer(clientX) {
    if (!rulerTrackOuter) return;
    const rect = rulerTrackOuter.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newCm = Math.round((22.0 + p * 9.0) * 10) / 10;
    finderState.footLengthCm = newCm;
    renderSizeFinder();
  }

  if (rulerTrackOuter) {
    rulerTrackOuter.addEventListener('pointerdown', (e) => {
      finderState.isRulerDragging = true;
      rulerTrackOuter.setPointerCapture(e.pointerId);
      updateRulerFromPointer(e.clientX);
    });

    rulerTrackOuter.addEventListener('pointermove', (e) => {
      if (finderState.isRulerDragging) {
        updateRulerFromPointer(e.clientX);
      }
    });

    const stopRulerDrag = (e) => {
      if (finderState.isRulerDragging) {
        finderState.isRulerDragging = false;
        try { rulerTrackOuter.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };
    rulerTrackOuter.addEventListener('pointerup', stopRulerDrag);
    rulerTrackOuter.addEventListener('pointercancel', stopRulerDrag);

    // Keyboard support on ruler
    rulerTrackOuter.tabIndex = 0;
    rulerTrackOuter.setAttribute('role', 'slider');
    rulerTrackOuter.setAttribute('aria-label', 'Foot length slider');
    rulerTrackOuter.addEventListener('keydown', (e) => {
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = e.shiftKey ? 1.0 : 0.1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = e.shiftKey ? -1.0 : -0.1;
      else if (e.key === 'PageUp') delta = 1.0;
      else if (e.key === 'PageDown') delta = -1.0;

      if (delta !== 0) {
        e.preventDefault();
        finderState.footLengthCm = Math.max(22.0, Math.min(31.0, finderState.footLengthCm + delta));
        renderSizeFinder();
      }
    });
  }

  // Unit Toggle (CM / IN)
  unitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      unitButtons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      finderState.unit = btn.dataset.unit;
      renderSizeFinder();
    });
  });

  // Segmented Options: Width, Use, Fit
  function bindSegmentedGroup(buttons, stateKey) {
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        finderState[stateKey] = btn.dataset.val;
        renderSizeFinder();
      });
    });
  }
  bindSegmentedGroup(widthButtons, 'width');
  bindSegmentedGroup(useButtons, 'use');
  bindSegmentedGroup(fitButtons, 'fit');

  // Accordion Toggle
  if (accordionToggle && accordionContent) {
    accordionToggle.addEventListener('click', () => {
      finderState.isAccordionOpen = !finderState.isAccordionOpen;
      accordionToggle.setAttribute('aria-expanded', finderState.isAccordionOpen ? 'true' : 'false');
      if (accordionIcon) {
        accordionIcon.textContent = finderState.isAccordionOpen ? '−' : '+';
      }

      gsap.to(accordionContent, {
        height: finderState.isAccordionOpen ? 'auto' : 0,
        paddingTop: finderState.isAccordionOpen ? 12 : 0,
        paddingBottom: finderState.isAccordionOpen ? 16 : 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => ScrollTrigger.refresh()
      });
    });
  }

  // Size Grid Selection Handlers
  sizeGridButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      finderState.selectedSize = parseFloat(btn.dataset.size);
      renderSizeFinder();
    });
  });

  // Reserve Selected Button
  const btnReserveSelected = gallerySection.querySelector('.btn-reserve-selected');
  if (btnReserveSelected) {
    btnReserveSelected.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector('#reserve');
      if (target && lenis) {
        lenis.scrollTo(target, { duration: 1.4, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
      }
    });
  }

  // Reveal cards with stagger on enter
  if (!isReducedMotion()) {
    ScrollTrigger.create({
      trigger: track,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.fromTo(cards,
          { x: 80, skewX: -10, opacity: 0 },
          { x: 0, skewX: 0, opacity: 1, duration: 0.75, stagger: 0.08, ease: 'expo.out' }
        );
      }
    });
  }

  // Refresh ScrollTrigger
  ScrollTrigger.refresh();
}
