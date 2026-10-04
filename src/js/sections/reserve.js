import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COLORWAYS, DEFAULT_COLORWAY } from '../../data/colorways.js';
import { setColorway, getCurrentColorway } from '../lib/theme.js';
import { getImage } from '../lib/images.js';
import { stockFor } from '../lib/sizing.js';
import { computePricing, makeReference, queuePosition, downloadDropCalendar } from '../lib/booking.js';
import { Odometer, isReducedMotion, splitTextMasked } from '../lib/utils.js';
import { getLenis } from '../lib/scroll.js';

gsap.registerPlugin(ScrollTrigger);

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: 'USA' },
  { code: 'CA', name: 'Canada', flag: 'CAN' },
  { code: 'GB', name: 'United Kingdom', flag: 'GBR' },
  { code: 'DE', name: 'Germany', flag: 'DEU' },
  { code: 'FR', name: 'France', flag: 'FRA' },
  { code: 'JP', name: 'Japan', flag: 'JPN' },
  { code: 'AU', name: 'Australia', flag: 'AUS' },
  { code: 'IT', name: 'Italy', flag: 'ITA' },
  { code: 'NL', name: 'Netherlands', flag: 'NLD' },
  { code: 'KR', name: 'South Korea', flag: 'KOR' },
  { code: 'SE', name: 'Sweden', flag: 'SWE' },
  { code: 'CH', name: 'Switzerland', flag: 'CHE' }
];

export function initReserveSection() {
  const reserveSection = document.querySelector('#reserve');
  if (!reserveSection) return;

  // Single plain JS state object
  const state = {
    step: 1,
    colorway: getCurrentColorway().id,
    size: null,
    qty: 1,
    name: '',
    email: '',
    city: '',
    country: 'US',
    delivery: 'STANDARD',
    agreed: false,
    newsletter: false,
    status: 'idle', // 'idle' | 'locking' | 'confirmed'
    lastFinderSize: null
  };

  // Cache DOM nodes
  const formCard = reserveSection.querySelector('.reserve-card');
  const stepMarkers = reserveSection.querySelectorAll('.form-step-marker');
  const stepTrackFill = reserveSection.querySelector('.form-step-fill');
  const stepPanes = reserveSection.querySelectorAll('.form-step-pane');
  const ariaLive = reserveSection.querySelector('.reserve-aria-live');

  // Step 1 nodes
  const cwTiles = reserveSection.querySelectorAll('.cw-select-tile');
  const sizeGridContainer = reserveSection.querySelector('.reserve-size-grid');
  const sizeHelperText = reserveSection.querySelector('.step-helper-text');
  const qtyMinusBtn = reserveSection.querySelector('.qty-btn-minus');
  const qtyPlusBtn = reserveSection.querySelector('.qty-btn-plus');
  const qtyValDisplay = reserveSection.querySelector('.qty-display-num');
  const qtyLimitNote = reserveSection.querySelector('.qty-limit-note');
  const btnContinue1 = reserveSection.querySelector('.btn-continue-step1');

  // Step 2 nodes
  const inputName = reserveSection.querySelector('#reserve-name');
  const inputEmail = reserveSection.querySelector('#reserve-email');
  const inputCity = reserveSection.querySelector('#reserve-city');
  const customSelectWrap = reserveSection.querySelector('.custom-select-wrap');
  const customSelectTrigger = reserveSection.querySelector('.custom-select-trigger');
  const customSelectMenu = reserveSection.querySelector('.custom-select-menu');
  const deliverySegBtns = reserveSection.querySelectorAll('.delivery-seg-btn');
  const checkboxNewsletter = reserveSection.querySelector('#reserve-newsletter-box');
  const validationBox = reserveSection.querySelector('.form-validation-box');
  const btnBack2 = reserveSection.querySelector('.btn-back-step2');
  const btnContinue2 = reserveSection.querySelector('.btn-continue-step2');

  // Step 3 nodes
  const reviewPair = reserveSection.querySelector('.review-val-pair');
  const reviewCw = reserveSection.querySelector('.review-val-cw');
  const reviewSize = reserveSection.querySelector('.review-val-size');
  const reviewQty = reserveSection.querySelector('.review-val-qty');
  const reviewDelivery = reserveSection.querySelector('.review-val-delivery');
  const reviewShipTo = reserveSection.querySelector('.review-val-shipto');
  const priceSubtotalEl = reserveSection.querySelector('.price-subtotal-val');
  const priceShippingEl = reserveSection.querySelector('.price-shipping-val');
  const priceTaxEl = reserveSection.querySelector('.price-tax-val');
  const priceTotalEl = reserveSection.querySelector('.price-total-val');
  const checkboxAgreed = reserveSection.querySelector('#reserve-agree-box');
  const btnBack3 = reserveSection.querySelector('.btn-back-step3');
  const btnLock = reserveSection.querySelector('.form-btn-lock');

  // Live Pass nodes
  const passCard = reserveSection.querySelector('.drop-pass-card');
  const passShoeImg = reserveSection.querySelector('.pass-shoe-img');
  const passBgNumeral = reserveSection.querySelector('.pass-bg-numeral');
  const passFlash = reserveSection.querySelector('.pass-flash-overlay');
  const passValName = reserveSection.querySelector('.pass-val-name');
  const passValCw = reserveSection.querySelector('.pass-val-cw');
  const passValSize = reserveSection.querySelector('.pass-val-size');
  const passValQty = reserveSection.querySelector('.pass-val-qty');
  const passValDelivery = reserveSection.querySelector('.pass-val-delivery');
  const passValGate = reserveSection.querySelector('.pass-val-gate');
  const passBarcode = reserveSection.querySelector('.pass-barcode-vertical');
  const passRefCode = reserveSection.querySelector('.pass-ref-code');
  const passQueueTag = reserveSection.querySelector('.pass-queue-tag');

  // Success Stage nodes
  const successStage = reserveSection.querySelector('.reserve-success-stage');
  const successFirstName = reserveSection.querySelector('.success-first-name');
  const successRefVal = reserveSection.querySelector('.success-ref-val');
  const successQueueVal = reserveSection.querySelector('.success-queue-val');
  const btnAddCalendar = reserveSection.querySelector('.btn-add-calendar');
  const btnCopyRef = reserveSection.querySelector('.btn-copy-ref');
  const btnSharePass = reserveSection.querySelector('.btn-share-pass');
  const btnResetReserve = reserveSection.querySelector('.reset-reserve-link');
  const toastNotification = reserveSection.querySelector('.reserve-toast');
  const confettiContainer = reserveSection.querySelector('.reserve-confetti-container');

  // Odometers
  let qtyOdometer = null;
  let priceTotalOdometer = null;
  let queueOdometer = null;

  if (qtyValDisplay) {
    qtyOdometer = new Odometer(qtyValDisplay, { initialValue: '01' });
  }
  if (priceTotalEl) {
    priceTotalOdometer = new Odometer(priceTotalEl, { initialValue: '$259.20' });
  }

  // --------------------------------------------------------------------------
  // 1. HEADLINE SLAM ON ENTER
  // --------------------------------------------------------------------------
  const headline = reserveSection.querySelector('.reserve-statement');
  if (headline && !isReducedMotion()) {
    const words = splitTextMasked(headline, 'words');

    ScrollTrigger.create({
      trigger: reserveSection,
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
  // 2. PASS BARCODE GENERATOR (Vertical bars 1 to 4px)
  // --------------------------------------------------------------------------
  function renderPassBarcode(refCode) {
    if (!passBarcode) return;
    passBarcode.innerHTML = '';
    const code = refCode || 'K1-1031-PASS';
    for (let i = 0; i < code.length * 3; i++) {
      const charCode = code.charCodeAt(i % code.length);
      const width = (charCode % 4) + 1; // 1 to 4 px
      const bar = document.createElement('span');
      bar.className = 'barcode-bar';
      bar.style.width = `${width}px`;
      bar.style.backgroundColor = (i % 2 === 0) ? '#F4F1EA' : 'transparent';
      passBarcode.appendChild(bar);
    }
  }

  // --------------------------------------------------------------------------
  // 3. FLICKER HELPER FOR LIVE DATA CHANGE
  // --------------------------------------------------------------------------
  function flickerElement(el) {
    if (!el || isReducedMotion()) return;
    el.classList.add('is-flickering');
    setTimeout(() => el.classList.remove('is-flickering'), 120);
  }

  // --------------------------------------------------------------------------
  // 4. SIZE GRID GENERATION
  // --------------------------------------------------------------------------
  function renderSizeGrid() {
    if (!sizeGridContainer) return;
    sizeGridContainer.innerHTML = '';

    const sizes = [];
    for (let s = 6.0; s <= 14.0; s += 0.5) {
      sizes.push(s);
    }

    sizes.forEach(s => {
      const stock = stockFor(s, state.colorway);
      const isSelected = state.size === s;
      const isSoldOut = stock.status === 'SOLD_OUT';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `reserve-size-btn ${isSelected ? 'is-selected' : ''}`;
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', `US size ${s.toFixed(1)}`);
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      btn.setAttribute('data-size', s);
      btn.disabled = isSoldOut;
      if (isSoldOut) {
        btn.setAttribute('aria-disabled', 'true');
      }

      btn.innerHTML = `
        <span class="reserve-size-val">${s.toFixed(1).replace('.0', '')}</span>
        <span class="reserve-size-stock">${stock.label}</span>
      `;

      btn.addEventListener('click', () => {
        if (isSoldOut) return;
        state.size = s;
        window.dispatchEvent(new CustomEvent('size:select', {
          detail: { size: s, colorway: state.colorway }
        }));
        render();
      });

      // Keyboard navigation (arrows move in radiogroup)
      btn.addEventListener('keydown', (e) => {
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
          e.preventDefault();
          const allBtns = Array.from(sizeGridContainer.querySelectorAll('.reserve-size-btn:not(:disabled)'));
          const currentIdx = allBtns.indexOf(btn);
          let nextIdx = currentIdx;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            nextIdx = (currentIdx + 1) % allBtns.length;
          } else {
            nextIdx = (currentIdx - 1 + allBtns.length) % allBtns.length;
          }
          if (allBtns[nextIdx]) {
            allBtns[nextIdx].focus();
            allBtns[nextIdx].click();
          }
        }
      });

      sizeGridContainer.appendChild(btn);
    });
  }

  // --------------------------------------------------------------------------
  // 5. MASTER RENDER FUNCTION (Form, Step Bar, Summary, Pass)
  // --------------------------------------------------------------------------
  function render() {
    // A. Step Bar
    const progressPercents = [0, 50, 100];
    if (stepTrackFill) {
      stepTrackFill.style.width = `${progressPercents[state.step - 1]}%`;
    }

    stepMarkers.forEach((m, idx) => {
      const stepNum = idx + 1;
      m.classList.remove('is-active', 'is-completed');
      if (stepNum === state.step) {
        m.classList.add('is-active');
      } else if (stepNum < state.step) {
        m.classList.add('is-completed');
      }
    });

    // B. Step 01: Colorway Tiles
    cwTiles.forEach(tile => {
      const cwId = tile.getAttribute('data-cw');
      if (cwId === state.colorway) {
        tile.classList.add('is-selected');
      } else {
        tile.classList.remove('is-selected');
      }
    });

    // C. Step 01: Sizing grid selection & Continue button state
    const sizeBtns = sizeGridContainer.querySelectorAll('.reserve-size-btn');
    sizeBtns.forEach(btn => {
      const s = parseFloat(btn.getAttribute('data-size'));
      if (s === state.size) {
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        btn.setAttribute('aria-checked', 'true');
      } else {
        btn.classList.remove('is-selected');
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('aria-checked', 'false');
      }
    });

    if (btnContinue1) {
      const canContinue = state.size !== null;
      btnContinue1.disabled = !canContinue;
      if (sizeHelperText) {
        sizeHelperText.textContent = canContinue ? '' : 'Choose a size to continue.';
      }
    }

    // D. Step 01: Quantity Display
    if (qtyValDisplay) {
      const padQty = String(state.qty).padStart(2, '0');
      if (qtyOdometer) {
        qtyOdometer.setValue(padQty);
      } else {
        qtyValDisplay.textContent = padQty;
      }
    }
    if (qtyMinusBtn) qtyMinusBtn.disabled = state.qty <= 1;
    if (qtyPlusBtn) qtyPlusBtn.disabled = state.qty >= 2;
    if (qtyLimitNote) {
      qtyLimitNote.style.color = state.qty >= 2 ? '#E82A78' : 'inherit';
      qtyLimitNote.textContent = state.qty >= 2 ? 'MAX 2 PER PERSON (LIMIT REACHED)' : 'MAX 2 PER PERSON';
    }

    // E. Step 02: Country & Delivery
    if (customSelectTrigger) {
      const activeCountry = COUNTRIES.find(c => c.code === state.country) || COUNTRIES[0];
      customSelectTrigger.innerHTML = `
        <span>${activeCountry.flag} // ${activeCountry.name}</span>
        <span>▼</span>
      `;
    }

    deliverySegBtns.forEach(btn => {
      const delOpt = btn.getAttribute('data-delivery');
      if (delOpt === state.delivery) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
    });

    if (checkboxNewsletter) {
      if (state.newsletter) {
        checkboxNewsletter.classList.add('is-checked');
      } else {
        checkboxNewsletter.classList.remove('is-checked');
      }
    }

    // F. Step 03: Review Sheet & Pricing
    const cwObj = COLORWAYS.find(c => c.id === state.colorway) || DEFAULT_COLORWAY;
    const pricing = computePricing(state.qty, state.delivery);

    if (reviewPair) reviewPair.textContent = 'K-1 AERO';
    if (reviewCw) reviewCw.textContent = cwObj.name;
    if (reviewSize) reviewSize.textContent = state.size ? `US ${state.size.toFixed(1)}` : '—————';
    if (reviewQty) reviewQty.textContent = `${state.qty} PAIR${state.qty > 1 ? 'S' : ''}`;
    if (reviewDelivery) reviewDelivery.textContent = state.delivery === 'EXPRESS' ? 'EXPRESS ($18.00)' : 'STANDARD (FREE)';
    if (reviewShipTo) {
      const locStr = [state.city, state.country].filter(Boolean).join(', ');
      reviewShipTo.textContent = locStr || state.country;
    }

    if (priceSubtotalEl) priceSubtotalEl.textContent = `$${pricing.subtotal.toFixed(2)}`;
    if (priceShippingEl) priceShippingEl.textContent = pricing.shipping === 0 ? 'FREE' : `$${pricing.shipping.toFixed(2)}`;
    if (priceTaxEl) priceTaxEl.textContent = `$${pricing.tax.toFixed(2)}`;

    const formattedTotal = `$${pricing.total.toFixed(2)}`;
    if (priceTotalEl) {
      if (priceTotalOdometer) {
        priceTotalOdometer.setValue(formattedTotal);
      } else {
        priceTotalEl.textContent = formattedTotal;
      }
    }

    if (checkboxAgreed) {
      if (state.agreed) {
        checkboxAgreed.classList.add('is-checked');
      } else {
        checkboxAgreed.classList.remove('is-checked');
      }
    }

    if (btnLock) {
      btnLock.disabled = !state.agreed || state.status === 'locking';
    }

    // G. Live Drop Pass Updates
    const refCode = makeReference(state);
    const qPos = queuePosition(state);

    if (passShoeImg) {
      passShoeImg.src = getImage(cwObj.image, cwObj.accent);
    }
    if (passBgNumeral) {
      const cwNum = { cobalt: '01', volt: '02', punch: '03' }[state.colorway] || '01';
      passBgNumeral.textContent = cwNum;
    }

    if (passValName) passValName.textContent = state.name ? state.name.toUpperCase() : '—————';
    if (passValCw) passValCw.textContent = cwObj.name;
    if (passValSize) passValSize.textContent = state.size ? `US ${state.size.toFixed(1)}` : '—————';
    if (passValQty) passValQty.textContent = `${state.qty} PAIR${state.qty > 1 ? 'S' : ''}`;
    if (passValDelivery) passValDelivery.textContent = state.delivery;
    if (passValGate) passValGate.textContent = `GATE ${state.country}`;

    if (passRefCode) passRefCode.textContent = refCode;
    renderPassBarcode(refCode);

    if (passQueueTag) {
      passQueueTag.textContent = state.status === 'confirmed' ? `QUEUE #${qPos.toLocaleString()}` : 'STANDBY';
    }

    // Screen reader announcement
    if (ariaLive) {
      ariaLive.textContent = `Step ${state.step} of 3. Total ${formattedTotal}`;
    }
  }

  // --------------------------------------------------------------------------
  // 6. STEP SLIDE ANIMATIONS
  // --------------------------------------------------------------------------
  function goToStep(targetStep) {
    if (targetStep === state.step || targetStep < 1 || targetStep > 3) return;

    const currentPane = stepPanes[state.step - 1];
    const nextPane = stepPanes[targetStep - 1];
    const isForward = targetStep > state.step;

    if (!isReducedMotion()) {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(currentPane, { clearProps: 'all', display: 'none' });
          currentPane.classList.remove('is-active');
          nextPane.classList.add('is-active');
          state.step = targetStep;
          render();
          ScrollTrigger.refresh();
        }
      });

      // Outgoing slide out with skew
      tl.to(currentPane, {
        xPercent: isForward ? -80 : 80,
        skewX: isForward ? -10 : 10,
        opacity: 0,
        duration: 0.35,
        ease: 'expo.in'
      });

      // Incoming slide in
      tl.fromTo(nextPane,
        {
          xPercent: isForward ? 80 : -80,
          skewX: isForward ? 10 : -10,
          opacity: 0,
          display: 'block'
        },
        {
          xPercent: 0,
          skewX: 0,
          opacity: 1,
          duration: 0.45,
          ease: 'expo.out'
        },
        '-=0.1'
      );
    } else {
      currentPane.classList.remove('is-active');
      nextPane.classList.add('is-active');
      state.step = targetStep;
      render();
      ScrollTrigger.refresh();
    }
  }

  // Step marker clicks to jump back to completed steps
  stepMarkers.forEach((marker, idx) => {
    marker.addEventListener('click', () => {
      const targetStep = idx + 1;
      if (targetStep < state.step) {
        goToStep(targetStep);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 7. STEP 01 INTERACTIONS (Colorways, Sizing, Stepper)
  // --------------------------------------------------------------------------
  cwTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      const chosenCw = tile.getAttribute('data-cw');
      if (chosenCw && chosenCw !== state.colorway) {
        state.colorway = chosenCw;
        // Trigger page-wide colorway switch
        setColorway(chosenCw);
        // Refresh size grid since stock states change per colorway seed
        renderSizeGrid();
        // Slanted-bar flash on pass
        triggerPassFlash();
        render();
      }
    });
  });

  // Quantity controls
  if (qtyMinusBtn) {
    qtyMinusBtn.addEventListener('click', () => {
      if (state.qty > 1) {
        state.qty--;
        flickerElement(passValQty);
        render();
      }
    });
  }
  if (qtyPlusBtn) {
    qtyPlusBtn.addEventListener('click', () => {
      if (state.qty < 2) {
        state.qty++;
        flickerElement(passValQty);
        render();
      }
    });
  }

  if (btnContinue1) {
    btnContinue1.addEventListener('click', () => {
      if (state.size !== null) {
        goToStep(2);
      }
    });
  }

  // Smooth scroll to size finder
  const finderLinks = reserveSection.querySelectorAll('.size-finder-link, .btn-to-finder');
  finderLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const lenis = getLenis();
      const finderEl = document.querySelector('.size-finder-wrapper');
      if (lenis && finderEl) {
        lenis.scrollTo(finderEl, { duration: 1.2, easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
      } else if (finderEl) {
        finderEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // --------------------------------------------------------------------------
  // 8. STEP 02 INTERACTIONS (Inputs, Validation, Country, Delivery)
  // --------------------------------------------------------------------------
  if (inputName) {
    inputName.addEventListener('input', (e) => {
      state.name = e.target.value;
      flickerElement(passValName);
      render();
    });
  }

  if (inputEmail) {
    inputEmail.addEventListener('input', (e) => {
      state.email = e.target.value;
      render();
    });
  }

  if (inputCity) {
    inputCity.addEventListener('input', (e) => {
      state.city = e.target.value;
      render();
    });
  }

  // Country Custom Dropdown
  COUNTRIES.forEach(c => {
    const opt = document.createElement('div');
    opt.className = 'custom-select-option';
    opt.setAttribute('role', 'option');
    opt.innerHTML = `<span>${c.name}</span> <span style="opacity:0.6">${c.flag}</span>`;
    opt.addEventListener('click', () => {
      state.country = c.code;
      if (customSelectMenu) customSelectMenu.classList.remove('is-open');
      flickerElement(passValGate);
      render();
    });
    if (customSelectMenu) customSelectMenu.appendChild(opt);
  });

  if (customSelectTrigger) {
    customSelectTrigger.addEventListener('click', () => {
      if (customSelectMenu) customSelectMenu.classList.toggle('is-open');
    });
  }

  document.addEventListener('click', (e) => {
    if (customSelectWrap && !customSelectWrap.contains(e.target)) {
      if (customSelectMenu) customSelectMenu.classList.remove('is-open');
    }
  });

  // Delivery Segmented Control
  deliverySegBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const del = btn.getAttribute('data-delivery');
      if (del && del !== state.delivery) {
        state.delivery = del;
        flickerElement(passValDelivery);
        render();
      }
    });
  });

  // Newsletter Checkbox
  if (checkboxNewsletter) {
    checkboxNewsletter.parentElement.addEventListener('click', () => {
      state.newsletter = !state.newsletter;
      render();
    });
  }

  function validateStep2() {
    let isValid = true;
    let errMsg = '';

    if (!state.name.trim()) {
      isValid = false;
      errMsg = 'FULL NAME IS REQUIRED.';
      if (inputName) inputName.focus();
    } else if (!state.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
      isValid = false;
      errMsg = 'PLEASE ENTER A VALID EMAIL ADDRESS.';
      if (inputEmail) inputEmail.focus();
    }

    if (validationBox) {
      validationBox.textContent = errMsg;
      if (errMsg) {
        validationBox.classList.add('is-error');
      } else {
        validationBox.classList.remove('is-error');
      }
    }

    return isValid;
  }

  if (inputName) inputName.addEventListener('blur', validateStep2);
  if (inputEmail) inputEmail.addEventListener('blur', validateStep2);

  if (btnBack2) {
    btnBack2.addEventListener('click', () => goToStep(1));
  }

  if (btnContinue2) {
    btnContinue2.addEventListener('click', () => {
      if (validateStep2()) {
        goToStep(3);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. STEP 03 INTERACTIONS (Review Edit, Agreement, Lock Button)
  // --------------------------------------------------------------------------
  const editBtns = reserveSection.querySelectorAll('.review-edit-btn');
  editBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-step'), 10) || 1;
      goToStep(targetStep);
    });
  });

  if (checkboxAgreed) {
    checkboxAgreed.parentElement.addEventListener('click', () => {
      state.agreed = !state.agreed;
      render();
    });
  }

  if (btnBack3) {
    btnBack3.addEventListener('click', () => goToStep(2));
  }

  if (btnLock) {
    btnLock.addEventListener('click', () => {
      if (!state.agreed || state.status === 'locking') return;
      state.status = 'locking';
      btnLock.classList.add('is-loading');
      render();

      setTimeout(() => {
        state.status = 'confirmed';
        btnLock.classList.remove('is-loading');
        executeSuccessSequence();
      }, 1400);
    });
  }

  // --------------------------------------------------------------------------
  // 10. SUCCESS SEQUENCE (Pass prints, stub tears, stamp slams, confetti bursts)
  // --------------------------------------------------------------------------
  function executeSuccessSequence() {
    const cwObj = COLORWAYS.find(c => c.id === state.colorway) || DEFAULT_COLORWAY;
    const refCode = makeReference(state);
    const qPos = queuePosition(state);
    const firstName = (state.name.trim().split(' ')[0] || 'RUNNER').toUpperCase();

    if (successFirstName) successFirstName.textContent = firstName;
    if (successRefVal) successRefVal.textContent = refCode;
    if (successQueueVal) {
      if (queueOdometer) {
        queueOdometer.setValue(String(qPos));
      } else {
        successQueueVal.textContent = qPos.toLocaleString();
      }
    }

    if (isReducedMotion()) {
      if (formCard) formCard.style.display = 'none';
      if (passCard) passCard.style.display = 'none';
      if (successStage) successStage.classList.add('is-visible');
      render();
      ScrollTrigger.refresh();
      return;
    }

    const passCloneHolder = reserveSection.querySelector('.success-pass-holder');
    const stampEl = reserveSection.querySelector('.success-stamp-confirmed');
    const passStub = passCard.querySelector('.pass-stub');

    const tl = gsap.timeline({
      onComplete: () => {
        ScrollTrigger.refresh();
      }
    });

    // Collapse form card
    tl.to(formCard, {
      opacity: 0,
      scaleY: 0.8,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        formCard.style.display = 'none';
        if (passCloneHolder && passCard) {
          passCloneHolder.appendChild(passCard);
        }
        successStage.classList.add('is-visible');
      }
    });

    // Pass print slide down from slit
    tl.fromTo(passCard,
      { y: -160, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out' }
    );

    // Stub tear off
    if (passStub) {
      tl.to(passStub, {
        x: -4,
        duration: 0.05,
        repeat: 3,
        yoyo: true,
        ease: 'power1.inOut'
      });

      tl.to(passStub, {
        rotate: 8,
        y: 28,
        duration: 0.4,
        ease: 'power2.out',
        boxShadow: '6px 6px 0 rgba(0,0,0,0.4)'
      }, '+=0.05');
    }

    // Stamp "CONFIRMED" slams on
    if (stampEl) {
      tl.to(stampEl, {
        scale: 1,
        rotate: -12,
        duration: 0.4,
        ease: 'back.out(2)'
      }, '-=0.2');
    }

    // Burst 14 square confetti
    tl.add(() => burstConfetti(), '-=0.3');
  }

  // 14 Square Confetti Burst
  function burstConfetti() {
    if (!confettiContainer || isReducedMotion()) return;
    confettiContainer.innerHTML = '';
    const colors = ['#2B3FFF', '#D6FF3A', '#FF3D8B', '#0E0E10', '#F4F1EA'];

    for (let i = 0; i < 14; i++) {
      const square = document.createElement('div');
      square.className = 'confetti-square';
      square.style.backgroundColor = colors[i % colors.length];
      square.style.left = '40%';
      square.style.top = '50%';
      confettiContainer.appendChild(square);

      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
      const dist = 120 + Math.random() * 160;
      const targetX = Math.cos(angle) * dist;
      const targetY = Math.sin(angle) * dist + 40;

      gsap.to(square, {
        x: targetX,
        y: targetY,
        rotation: (Math.random() - 0.5) * 720,
        opacity: 0,
        duration: 1.2 + Math.random() * 0.6,
        ease: 'power3.out',
        onComplete: () => square.remove()
      });
    }
  }

  // --------------------------------------------------------------------------
  // 11. PASS BUTTON INTERACTIONS (Calendar, Copy, Share, Reset)
  // --------------------------------------------------------------------------
  if (btnAddCalendar) {
    btnAddCalendar.addEventListener('click', () => {
      const cwObj = COLORWAYS.find(c => c.id === state.colorway) || DEFAULT_COLORWAY;
      downloadDropCalendar(makeReference(state), cwObj.name);
    });
  }

  if (btnCopyRef) {
    btnCopyRef.addEventListener('click', () => {
      const refCode = makeReference(state);
      navigator.clipboard.writeText(refCode).then(() => {
        showToast('COPIED REFERENCE TO CLIPBOARD');
      });
    });
  }

  if (btnSharePass) {
    btnSharePass.addEventListener('click', () => {
      const shareData = {
        title: 'K-1 AERO // DROP PASS',
        text: `Locked my pair for the K-1 AERO drop: ${makeReference(state)}`,
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(shareData).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('LINK COPIED TO CLIPBOARD');
        });
      }
    });
  }

  function showToast(msg) {
    if (!toastNotification) return;
    toastNotification.textContent = msg;
    toastNotification.classList.add('is-shown');
    setTimeout(() => {
      toastNotification.classList.remove('is-shown');
    }, 2400);
  }

  if (btnResetReserve) {
    btnResetReserve.addEventListener('click', (e) => {
      e.preventDefault();
      // Reset state
      state.step = 1;
      state.status = 'idle';
      state.agreed = false;
      state.size = null;

      if (successStage) successStage.classList.remove('is-visible');
      if (formCard) {
        formCard.style.display = 'block';
        gsap.set(formCard, { opacity: 1, scaleY: 1 });
      }
      const originalPassHolder = reserveSection.querySelector('.reserve-pass-col');
      if (originalPassHolder && passCard) {
        originalPassHolder.appendChild(passCard);
      }
      const stampEl = reserveSection.querySelector('.success-stamp-confirmed');
      if (stampEl) gsap.set(stampEl, { scale: 0 });

      render();
      ScrollTrigger.refresh();
    });
  }

  // Slanted-bar flash on pass when colorway changes
  function triggerPassFlash() {
    if (!passFlash || isReducedMotion()) return;
    gsap.fromTo(passFlash,
      { xPercent: -120 },
      { xPercent: 120, duration: 0.45, ease: 'expo.inOut' }
    );
  }

  // --------------------------------------------------------------------------
  // 12. PASS 3D TILT & FLOAT
  // --------------------------------------------------------------------------
  if (passCard && !isReducedMotion()) {
    const tiltX = gsap.quickTo(passCard, 'rotateX', { duration: 0.3, ease: 'power2.out' });
    const tiltY = gsap.quickTo(passCard, 'rotateY', { duration: 0.3, ease: 'power2.out' });

    // Idle float (y ±6px, 4s)
    gsap.to(passCard, {
      y: -6,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    window.addEventListener('mousemove', (e) => {
      if (document.hidden || window.innerWidth < 1100 || window.matchMedia('(pointer: coarse)').matches) return;
      const rect = passCard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      const maxTilt = 6;
      tiltX(-deltaY * maxTilt);
      tiltY(deltaX * maxTilt);
    });
  }

  // --------------------------------------------------------------------------
  // 13. GLOBAL EVENT LISTENERS (colorway:change and size:select)
  // --------------------------------------------------------------------------
  window.addEventListener('colorway:change', (e) => {
    const newCw = e.detail.colorway;
    if (!newCw) return;
    state.colorway = newCw.id;
    renderSizeGrid();
    triggerPassFlash();
    render();
  });

  window.addEventListener('size:select', (e) => {
    if (e.detail && e.detail.size) {
      state.size = e.detail.size;
      state.lastFinderSize = e.detail.size;
      render();
    }
  });

  // Initial render
  renderSizeGrid();
  render();

  // ScrollTrigger refresh after images and layout
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
