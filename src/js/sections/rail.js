import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis, ScrollLockManager } from '../lib/scroll.js';
import { Odometer } from '../lib/utils.js';
import { setColorway, getCurrentColorway } from '../lib/theme.js';

gsap.registerPlugin(ScrollTrigger);

export function initRailNav() {
  const railEl = document.querySelector('.rail-nav');
  const mobileMenu = document.querySelector('.mobile-overlay-menu');
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const mobileCloseBtn = document.querySelector('.mobile-menu-close');

  const sectionLinks = document.querySelectorAll('.rail-link, .mobile-menu-link');
  const activeIndicator = document.querySelector('.rail-active-indicator');
  const sectionCounterEl = document.querySelector('.rail-section-counter');

  let sectionOdometer = null;
  if (sectionCounterEl) {
    sectionOdometer = new Odometer(sectionCounterEl, { initialValue: '01 / 04' });
  }

  let currentTargetId = '#drop';
  let currentNumStr = '01';

  // Smooth scroll handler using single Lenis instance
  function scrollToSection(targetId) {
    const lenis = getLenis();
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    if (lenis) {
      lenis.scrollTo(targetEl, {
        offset: 0,
        duration: 1.4,
        easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t) // expo.inOut
      });
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Top 'K' logo scroll to top
  const topButtons = document.querySelectorAll('.rail-top-btn, .mobile-top-btn');
  topButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, {
          duration: 1.4,
          easing: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Link clicks
  sectionLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        scrollToSection(href);
        closeMobileMenu();
      }
    });
  });

  // Reserve bottom button
  const reserveButtons = document.querySelectorAll('.rail-reserve-btn, .btn-reserve-trigger');
  reserveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToSection('#reserve');
      closeMobileMenu();
    });
  });

  function updateIndicator() {
    const desktopLinks = document.querySelectorAll('.rail-link');
    let activeLink = null;

    desktopLinks.forEach(l => {
      if (l.getAttribute('href') === currentTargetId) {
        l.classList.add('is-active');
        activeLink = l;
      } else {
        l.classList.remove('is-active');
      }
    });

    if (activeLink && activeIndicator) {
      const linkRect = activeLink.getBoundingClientRect();
      const parentRect = activeLink.parentElement.getBoundingClientRect();
      const relativeTop = linkRect.top - parentRect.top;
      gsap.to(activeIndicator, {
        y: relativeTop,
        height: linkRect.height,
        duration: 0.35,
        ease: 'power2.out'
      });
    }

    if (sectionOdometer && currentNumStr) {
      sectionOdometer.setValue(`${currentNumStr} / 04`);
    }
  }

  function setActiveSection(targetId, numStr) {
    currentTargetId = targetId;
    currentNumStr = numStr;
    updateIndicator();
  }

  // Setup ScrollTrigger for active section indicators
  // Sections: DROP (01), TECH (02), GALLERY (03), RESERVE + FOOTER (04)
  const sections = [
    { id: '#drop', num: '01', el: document.querySelector('#hero') },
    { id: '#drop', num: '01', el: document.querySelector('#drop') },
    { id: '#tech', num: '02', el: document.querySelector('#tech') },
    { id: '#gallery', num: '03', el: document.querySelector('#gallery') },
    { id: '#reserve', num: '04', el: document.querySelector('#reserve') },
    { id: '#reserve', num: '04', el: document.querySelector('#footer') }
  ];

  sections.forEach((sec) => {
    if (!sec.el) return;

    ScrollTrigger.create({
      trigger: sec.el,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveSection(sec.id, sec.num),
      onEnterBack: () => setActiveSection(sec.id, sec.num)
    });
  });

  // Re-check and position indicator on resize and ScrollTrigger refresh
  window.addEventListener('resize', () => {
    requestAnimationFrame(updateIndicator);
  });
  ScrollTrigger.addEventListener('refresh', updateIndicator);

  // --------------------------------------------------------------------------
  // Mobile Menu Controls with Unified ScrollLockManager
  // --------------------------------------------------------------------------
  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.removeAttribute('inert');
    document.body.classList.add('overlay-open');
    ScrollLockManager.lock(mobileMenu);

    // Stagger in links
    const links = mobileMenu.querySelectorAll('.mobile-menu-link, .mobile-cw-btn');
    gsap.fromTo(links,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'expo.out' }
    );
  }

  function closeMobileMenu() {
    if (!mobileMenu || !mobileMenu.classList.contains('is-open')) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.setAttribute('inert', '');
    document.body.classList.remove('overlay-open');
    ScrollLockManager.unlock(mobileMenu);
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMobileMenu);
  }
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeMobileMenu);
  }

  // Keyboard Escape listener
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('is-open')) {
      closeMobileMenu();
    }
  });

  // Mobile menu colorway switcher buttons
  const mobileCwBtns = document.querySelectorAll('.mobile-cw-btn');
  mobileCwBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cw = btn.getAttribute('data-cw');
      if (cw) {
        setColorway(cw);
        updateMobileCwUI(cw);
      }
    });
  });

  function updateMobileCwUI(cwId) {
    mobileCwBtns.forEach(b => {
      b.classList.toggle('is-active', b.getAttribute('data-cw') === cwId);
    });
  }
  updateMobileCwUI(getCurrentColorway().id);

  window.addEventListener('colorway:change', (e) => {
    if (e.detail?.id) updateMobileCwUI(e.detail.id);
  });

  // Rail Entrance Animation (called after loader)
  return {
    animateIn: () => {
      gsap.to(railEl, {
        x: 0,
        duration: 0.6,
        ease: 'expo.out'
      });
      updateIndicator();
    }
  };
}
