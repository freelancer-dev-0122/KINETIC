import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getImage } from '../lib/images.js';
import { getCurrentColorway } from '../lib/theme.js';
import { Odometer, splitTextMasked, isReducedMotion } from '../lib/utils.js';
import { TECH_LAYERS } from '../../data/tech-layers.js';

gsap.registerPlugin(ScrollTrigger);

export function initTechSection() {
  const techSection = document.getElementById('tech');
  if (!techSection) return;

  // --------------------------------------------------------------------------
  // 1. HEADER ANIMATION (Masked Words Slam)
  // --------------------------------------------------------------------------
  const techHeadline = techSection.querySelector('.tech-headline');
  if (techHeadline && !isReducedMotion()) {
    ScrollTrigger.create({
      trigger: techHeadline,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const words = splitTextMasked(techHeadline, 'words');
        gsap.fromTo(words,
          { yPercent: 120, skewY: 12, opacity: 0 },
          { yPercent: 0, skewY: 0, opacity: 1, duration: 0.65, stagger: 0.05, ease: 'expo.out' }
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. PART A: THE EXPLODED 3D VIEW CONTROLLER
  // --------------------------------------------------------------------------
  const stageStack = techSection.querySelector('.stage-isometric-stack');
  const connectorLines = techSection.querySelector('.stage-connector-lines');
  const dragHandle = techSection.querySelector('.exploded-drag-handle');
  const dragTrack = techSection.querySelector('.exploded-drag-track');
  const dragFill = techSection.querySelector('.exploded-drag-fill');
  const readoutContainer = techSection.querySelector('.exploded-readout-num');
  const hintBadge = techSection.querySelector('.exploded-hint-badge');
  const btnAssemble = techSection.querySelector('.btn-assemble-toggle');

  const calloutCard = techSection.querySelector('.exploded-callout-card');
  const calloutNum = techSection.querySelector('.exploded-callout-num');
  const calloutTitle = techSection.querySelector('.exploded-callout-title');
  const calloutDesc = techSection.querySelector('.exploded-callout-desc');
  const calloutSpecContainer = techSection.querySelector('.exploded-callout-spec-val');

  const layerButtons = techSection.querySelectorAll('.exploded-layer-btn');
  const layerListRows = techSection.querySelectorAll('.layer-list-row');

  let readoutOdometer = null;
  if (readoutContainer) {
    readoutOdometer = new Odometer(readoutContainer, { initialValue: '000' });
  }

  // Unified State Object for Exploded View
  const explodedState = {
    spread: isReducedMotion() ? 0.5 : 0, // 0 to 1
    selectedLayerIndex: 3, // Default selected is 03 Carbon Plate
    hasInteracted: false,
    isDragging: false
  };

  /**
   * Master Render function updating the 3D stack, callout card, list, and readout
   */
  function renderExplodedView(withOvershoot = false) {
    const s = explodedState.spread;
    const baseGap = 72; // Spacing per layer index

    // 1. Stack rotation shifting slightly with spread
    if (stageStack) {
      const rotX = 58 - s * 6;
      const rotZ = -32 + s * 4;
      stageStack.style.transform = `rotateX(${rotX}deg) rotateZ(${rotZ}deg)`;
    }

    // 2. Position each layer along translateZ
    layerButtons.forEach(btn => {
      const idx = parseInt(btn.dataset.index, 10); // 1 to 5
      const isSelected = idx === explodedState.selectedLayerIndex;
      // Staggered translateZ from bottom (1) to top (5)
      const zOffset = (idx - 1) * s * baseGap;
      const liftZ = isSelected ? 24 : 0;
      btn.style.transform = `translateZ(${zOffset + liftZ}px)`;
      btn.classList.toggle('is-selected', isSelected);
    });

    // 3. Connector lines fade in past 0.2
    if (connectorLines) {
      connectorLines.style.opacity = s > 0.2 ? Math.min(1, (s - 0.2) / 0.3) : 0;
    }

    // 4. Update Slider Track & Handle
    if (dragFill) dragFill.style.width = `${s * 100}%`;
    if (dragHandle) {
      dragHandle.style.left = `${s * 100}%`;
      dragHandle.setAttribute('aria-valuenow', Math.round(s * 100));
    }

    // 5. Update SPREAD Readout
    if (readoutOdometer) {
      const padPct = String(Math.round(s * 100)).padStart(3, '0');
      readoutOdometer.setValue(padPct, false);
    }

    // 6. Update Active Row in Numbered List
    layerListRows.forEach(row => {
      const rowIdx = parseInt(row.dataset.index, 10);
      row.classList.toggle('is-active', rowIdx === explodedState.selectedLayerIndex);
    });

    // 7. Update Callout Card
    const currentLayerData = TECH_LAYERS.find(l => l.index === explodedState.selectedLayerIndex);
    if (currentLayerData && calloutCard) {
      if (calloutNum) calloutNum.textContent = currentLayerData.name;
      if (calloutTitle) calloutTitle.textContent = currentLayerData.title;
      if (calloutDesc) calloutDesc.textContent = currentLayerData.description;
      if (calloutSpecContainer) calloutSpecContainer.textContent = currentLayerData.spec;
    }
  }

  // Set initial render
  renderExplodedView();

  // Slider Dragging with Pointer Events & Capture
  function handleDragProgress(clientX) {
    if (!dragTrack) return;
    const rect = dragTrack.getBoundingClientRect();
    const rawVal = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, rawVal));
    explodedState.spread = clamped;
    explodedState.hasInteracted = true;
    if (hintBadge) hintBadge.style.display = 'none';
    renderExplodedView();
  }

  if (dragHandle && dragTrack) {
    dragHandle.addEventListener('pointerdown', (e) => {
      explodedState.isDragging = true;
      dragHandle.setPointerCapture(e.pointerId);
    });

    dragHandle.addEventListener('pointermove', (e) => {
      if (explodedState.isDragging) {
        handleDragProgress(e.clientX);
      }
    });

    const stopDrag = (e) => {
      if (explodedState.isDragging) {
        explodedState.isDragging = false;
        try { dragHandle.releasePointerCapture(e.pointerId); } catch (_) {}
        // Small spring overshoot on release
        if (!isReducedMotion()) {
          const current = explodedState.spread;
          const bounceTarget = current > 0.5 ? Math.min(1, current + 0.03) : Math.max(0, current - 0.03);
          gsap.to(explodedState, {
            spread: bounceTarget,
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: 'power1.out',
            onUpdate: () => renderExplodedView()
          });
        }
      }
    };

    dragHandle.addEventListener('pointerup', stopDrag);
    dragHandle.addEventListener('pointercancel', stopDrag);

    // Track click
    dragTrack.addEventListener('click', (e) => {
      handleDragProgress(e.clientX);
    });

    // Keyboard accessibility for slider
    dragHandle.addEventListener('keydown', (e) => {
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = 0.05;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -0.05;
      else if (e.key === 'Home') explodedState.spread = 0;
      else if (e.key === 'End') explodedState.spread = 1;

      if (delta !== 0) {
        e.preventDefault();
        explodedState.spread = Math.max(0, Math.min(1, explodedState.spread + delta));
      }
      explodedState.hasInteracted = true;
      if (hintBadge) hintBadge.style.display = 'none';
      renderExplodedView();
    });
  }

  // Auto-assemble toggle button
  if (btnAssemble) {
    btnAssemble.addEventListener('click', () => {
      explodedState.hasInteracted = true;
      if (hintBadge) hintBadge.style.display = 'none';
      const targetVal = explodedState.spread >= 0.5 ? 0 : 1;
      gsap.to(explodedState, {
        spread: targetVal,
        duration: 1.2,
        ease: 'power3.inOut',
        onUpdate: () => renderExplodedView()
      });
    });
  }

  // Auto-explode on entering viewport (once to 0.7, 1.4s, expo.out)
  if (!isReducedMotion()) {
    ScrollTrigger.create({
      trigger: '.exploded-stage-card',
      start: 'top 70%',
      once: true,
      onEnter: () => {
        if (!explodedState.hasInteracted) {
          gsap.to(explodedState, {
            spread: 0.7,
            duration: 1.4,
            ease: 'expo.out',
            onUpdate: () => renderExplodedView()
          });
        }
      }
    });
  }

  // Layer Selection Handlers
  function selectLayer(index) {
    if (explodedState.selectedLayerIndex === index) return;
    explodedState.selectedLayerIndex = index;

    // Discrete callout swap with char slam-in
    if (calloutCard && !isReducedMotion()) {
      gsap.fromTo(calloutCard,
        { scale: 0.95, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)' }
      );
    }
    renderExplodedView();
  }

  layerButtons.forEach(btn => {
    const idx = parseInt(btn.dataset.index, 10);
    btn.addEventListener('click', () => selectLayer(idx));
    btn.addEventListener('mouseenter', () => {
      if (stageStack) stageStack.classList.add('has-selection');
      btn.classList.add('is-hovered');
    });
    btn.addEventListener('mouseleave', () => {
      if (stageStack) stageStack.classList.remove('has-selection');
      btn.classList.remove('is-hovered');
    });
  });

  layerListRows.forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    row.addEventListener('click', () => selectLayer(idx));
  });

  // --------------------------------------------------------------------------
  // 3. PART B: LAB RESULTS (4 TILT CARDS WITH DEPTH & SHINE)
  // --------------------------------------------------------------------------
  const tiltCardBodies = techSection.querySelectorAll('.tilt-card-body');

  tiltCardBodies.forEach(card => {
    const shine = card.querySelector('.tilt-card-shine');
    const xTo = gsap.quickTo(card, 'rotationY', { duration: 0.3, ease: 'power3.out' });
    const yTo = gsap.quickTo(card, 'rotationX', { duration: 0.3, ease: 'power3.out' });
    const shineXTo = shine ? gsap.quickTo(shine, 'x', { duration: 0.3, ease: 'power3.out' }) : null;

    if (!isReducedMotion() && !window.matchMedia('(pointer: coarse)').matches) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
        const ny = (e.clientY - rect.top) / rect.height - 0.5;

        // Max 10deg tilt
        xTo(nx * 20);
        yTo(-ny * 20);

        if (shineXTo) {
          shineXTo(nx * 140);
        }
      });

      card.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
        if (shineXTo) shineXTo(0);
      });
    }
  });

  // Lab cards stagger reveal on scroll
  const labGrid = techSection.querySelector('.lab-cards-grid');
  if (labGrid && !isReducedMotion()) {
    ScrollTrigger.create({
      trigger: labGrid,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.fromTo('.tilt-card-perspective',
          { y: 60, skewY: 4, opacity: 0 },
          { y: 0, skewY: 0, opacity: 1, duration: 0.7, stagger: 0.1, ease: 'expo.out' }
        );
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. PART C: RACE TEST CONTROLLER (Deterministic 400M Simulation)
  // --------------------------------------------------------------------------
  const btnRunTest = techSection.querySelector('.btn-race-trigger');
  const runnerK1 = techSection.querySelector('.runner-k1');
  const runnerTyp = techSection.querySelector('.runner-typ');
  const runnerK1Img = techSection.querySelector('.runner-k1-shoe-img');
  const timerBadge = techSection.querySelector('.race-timer-badge');
  const gapBadge = techSection.querySelector('.race-gap-badge');
  const winnerStamp = techSection.querySelector('.race-winner-stamp');
  const countdownOverlay = techSection.querySelector('.race-countdown-overlay');
  const countdownNumeral = techSection.querySelector('.race-countdown-numeral');
  const skipLink = techSection.querySelector('.race-skip-link');

  // Update K-1 runner shoe preview on colorway change
  function updateRaceRunnerShoe(colorway) {
    if (runnerK1Img) {
      runnerK1Img.src = getImage(colorway.image, colorway.accent);
    }
  }
  updateRaceRunnerShoe(getCurrentColorway());

  window.addEventListener('colorway:change', (e) => {
    if (e.detail?.colorway) {
      updateRaceRunnerShoe(e.detail.colorway);
    }
  });

  const raceState = {
    status: 'idle', // 'idle', 'countdown', 'running', 'finished'
    k1Progress: 0,
    typProgress: 0,
    startTime: 0
  };

  let raceTweenK1 = null;
  let raceTweenTyp = null;
  let raceTimerInterval = null;

  function resetRace() {
    raceState.status = 'idle';
    raceState.k1Progress = 0;
    raceState.typProgress = 0;
    if (raceTweenK1) raceTweenK1.kill();
    if (raceTweenTyp) raceTweenTyp.kill();
    if (raceTimerInterval) clearInterval(raceTimerInterval);

    if (runnerK1) runnerK1.style.left = '0%';
    if (runnerTyp) runnerTyp.style.left = '0%';
    if (winnerStamp) winnerStamp.style.transform = 'rotate(-12deg) scale(0)';
    if (timerBadge) timerBadge.textContent = '00:00.00';
    if (gapBadge) gapBadge.textContent = 'GAP: +0.00 S';
    if (countdownOverlay) countdownOverlay.style.display = 'none';
    if (btnRunTest) {
      btnRunTest.disabled = false;
      btnRunTest.textContent = 'RUN THE TEST ▶';
    }
    if (skipLink) skipLink.style.display = 'none';
  }

  function finishRace() {
    raceState.status = 'finished';
    if (raceTweenK1) raceTweenK1.kill();
    if (raceTweenTyp) raceTweenTyp.kill();
    if (raceTimerInterval) clearInterval(raceTimerInterval);

    if (runnerK1) runnerK1.style.left = '92%';
    if (runnerTyp) runnerTyp.style.left = '84%';
    if (timerBadge) timerBadge.textContent = '00:43.12';
    if (gapBadge) gapBadge.textContent = '+0.38 S (K-1 WIN)';
    if (countdownOverlay) countdownOverlay.style.display = 'none';

    // Winner Stamp Slamdown
    if (winnerStamp) {
      gsap.fromTo(winnerStamp,
        { scale: 2.2, opacity: 0, rotation: -24 },
        { scale: 1, opacity: 1, rotation: -12, duration: 0.45, ease: 'back.out(2.4)' }
      );
    }

    if (btnRunTest) {
      btnRunTest.disabled = false;
      btnRunTest.textContent = 'RUN IT AGAIN ↺';
    }
    if (skipLink) skipLink.style.display = 'none';
  }

  async function startRace() {
    if (raceState.status === 'running' || raceState.status === 'countdown') return;

    resetRace();
    raceState.status = 'countdown';
    if (btnRunTest) btnRunTest.disabled = true;
    if (skipLink) skipLink.style.display = 'inline-block';

    // 3-2-1-GO Countdown Sequence
    if (countdownOverlay && countdownNumeral && !isReducedMotion()) {
      countdownOverlay.style.display = 'flex';
      const steps = ['3', '2', '1', 'GO'];

      for (let i = 0; i < steps.length; i++) {
        countdownNumeral.textContent = steps[i];
        await new Promise((res) => {
          gsap.fromTo(countdownNumeral,
            { scale: 0.5, opacity: 0 },
            { scale: 1.1, opacity: 1, duration: 0.35, ease: 'back.out(2)', onComplete: () => {
              setTimeout(res, 80);
            }}
          );
        });
      }
      countdownOverlay.style.display = 'none';
    }

    // Begin 400M Dash
    raceState.status = 'running';
    raceState.startTime = performance.now();

    // Timer updates
    raceTimerInterval = setInterval(() => {
      if (document.hidden) return;
      const elapsedMs = performance.now() - raceState.startTime;
      const totalSecs = Math.min(43.12, (elapsedMs / 4000) * 43.12);
      const mins = '00';
      const secs = String(Math.floor(totalSecs)).padStart(2, '0');
      const cs = String(Math.floor((totalSecs % 1) * 100)).padStart(2, '0');
      if (timerBadge) timerBadge.textContent = `${mins}:${secs}.${cs}`;

      // Dynamic gap readout
      const gap = Math.min(0.38, (elapsedMs / 4000) * 0.38);
      if (gapBadge) gapBadge.textContent = `+${gap.toFixed(2)} S`;
    }, 30);

    // K-1 AERO Runner: power2.out (4.0s)
    raceTweenK1 = gsap.to(raceState, {
      k1Progress: 0.92,
      duration: isReducedMotion() ? 0.01 : 4.0,
      ease: 'power2.out',
      onUpdate: () => {
        if (runnerK1) runnerK1.style.left = `${raceState.k1Progress * 100}%`;
      },
      onComplete: () => {
        finishRace();
      }
    });

    // Typical Racer: power1.inOut (4.38s)
    raceTweenTyp = gsap.to(raceState, {
      typProgress: 0.84,
      duration: isReducedMotion() ? 0.01 : 4.38,
      ease: 'power1.inOut',
      onUpdate: () => {
        if (runnerTyp) runnerTyp.style.left = `${raceState.typProgress * 100}%`;
      }
    });
  }

  if (btnRunTest) {
    btnRunTest.addEventListener('click', () => {
      if (raceState.status === 'finished') {
        startRace();
      } else {
        startRace();
      }
    });
  }

  if (skipLink) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      finishRace();
    });
  }

  window.addEventListener('resize', () => {
    if (raceState.status === 'running') {
      resetRace();
    }
  });

  // Refresh ScrollTrigger
  ScrollTrigger.refresh();
}
