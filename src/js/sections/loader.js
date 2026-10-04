import { gsap } from 'gsap';
import { getLenis, refreshScrollTrigger } from '../lib/scroll.js';

/**
 * Executes the 3-2-1 + GO diagonal split countdown loader.
 * @returns {Promise<void>} Resolves when the loader has fully exited and hero is revealed.
 */
export function runLoader() {
  return new Promise(async (resolve) => {
    const lenis = getLenis();
    if (lenis) lenis.stop();

    const loaderEl = document.querySelector('.kinetic-loader');
    if (!loaderEl) {
      if (lenis) lenis.start();
      resolve();
      return;
    }

    let hasExited = false;
    const finishLoader = () => {
      if (hasExited) return;
      hasExited = true;
      if (lenis) lenis.start();
      refreshScrollTrigger();
      loaderEl.style.display = 'none';
      resolve();
    };

    // 4-second failsafe to guarantee loader exits even on slow network
    const failsafeTimeout = setTimeout(() => {
      if (!hasExited) {
        console.warn('Loader 4s failsafe triggered.');
        finishLoader();
      }
    }, 4000);

    // Wait for document.fonts.ready before starting visual sequence
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch (e) {
      console.warn('Font loading wait skipped:', e);
    }

    const panel2 = loaderEl.querySelector('.panel-2');
    const panel1 = loaderEl.querySelector('.panel-1');
    const panelGo = loaderEl.querySelector('.panel-go');

    const num3 = loaderEl.querySelector('.panel-3 .loader-numeral');
    const num2 = loaderEl.querySelector('.panel-2 .loader-numeral');
    const num1 = loaderEl.querySelector('.panel-1 .loader-numeral');
    const numGo = loaderEl.querySelector('.panel-go .loader-numeral');

    const tl = gsap.timeline({
      onComplete: () => {
        clearTimeout(failsafeTimeout);
        finishLoader();
      }
    });

    // Numeral 3 punch in
    tl.fromTo(num3,
      { scale: 0.7, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.2)' }
    );
    tl.to({}, { duration: 0.25 }); // Hold

    // Panel 2 (Cobalt) slams in from left
    tl.to(panel2, {
      xPercent: 100,
      duration: 0.35,
      ease: 'expo.out'
    });
    tl.fromTo(num2,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.0)' },
      '-=0.15'
    );
    tl.to({}, { duration: 0.22 }); // Hold

    // Panel 1 (Volt) slams in from right
    tl.to(panel1, {
      xPercent: -100,
      duration: 0.35,
      ease: 'expo.out'
    });
    tl.fromTo(num1,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.0)' },
      '-=0.15'
    );
    tl.to({}, { duration: 0.22 }); // Hold

    // Panel GO (Punch) slams in from left
    tl.to(panelGo, {
      xPercent: 100,
      duration: 0.32,
      ease: 'expo.out'
    });
    tl.fromTo(numGo,
      { scale: 0.6, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2.2)' },
      '-=0.12'
    );
    tl.to({}, { duration: 0.25 }); // Brief impact hold

    // Diagonal Split Exit:
    // Create two diagonal clipping masks on loader halves sliding apart
    tl.add(() => {
      // Split using clip-path polygons sliding diagonally apart
      const topHalf = loaderEl.cloneNode(true);
      topHalf.className = 'loader-split-top';
      topHalf.style.position = 'absolute';
      topHalf.style.inset = '0';
      topHalf.style.zIndex = '100001';
      topHalf.style.clipPath = 'polygon(0 0, 100% 0, 100% 45%, 0 75%)';

      loaderEl.style.clipPath = 'polygon(0 75%, 100% 45%, 100% 100%, 0 100%)';
      loaderEl.parentElement.appendChild(topHalf);

      gsap.to(topHalf, {
        xPercent: -120,
        yPercent: -60,
        duration: 0.8,
        ease: 'expo.inOut',
        onComplete: () => topHalf.remove()
      });

      gsap.to(loaderEl, {
        xPercent: 120,
        yPercent: 60,
        duration: 0.8,
        ease: 'expo.inOut'
      });
    });

    tl.to({}, { duration: 0.82 }); // Wait for diagonal split to finish
  });
}
