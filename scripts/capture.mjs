import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const portfolioDir = path.join(rootDir, 'portfolio');
const screensDir = path.join(portfolioDir, 'screens');
const mobileScreensDir = path.join(screensDir, 'mobile');

fs.mkdirSync(mobileScreensDir, { recursive: true });

async function ensurePreviewServer() {
  try {
    const res = await fetch('http://localhost:4173/');
    if (res.ok) return null;
  } catch (e) {
    // not running
  }
  console.log('Starting preview server on port 4173...');
  const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: true
  });
  // Wait up to 10s for server to respond
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch('http://localhost:4173/');
      if (res.ok) return server;
    } catch (e) {}
  }
  return server;
}

async function runCapture() {
  const serverProcess = await ensurePreviewServer();

  console.log('Launching Chromium for portfolio captures...');
  const browser = await chromium.launch({
    headless: true,
  });

  // 1. DESKTOP SCREENSHOTS (1440x900)
  console.log('Capturing Desktop Screenshots (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Wait for countdown loader to finish
  await desktopPage.waitForTimeout(3500);

  // Helper to scroll smoothly to element or y position
  const scrollTo = async (y) => {
    await desktopPage.evaluate((targetY) => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, y);
    await desktopPage.waitForTimeout(800);
  };

  // Section 01: Hero
  await scrollTo(0);
  await desktopPage.screenshot({ path: path.join(screensDir, '01-hero.png') });
  console.log('  Saved 01-hero.png');

  // Section 02: Manifesto
  const manifestoY = await desktopPage.evaluate(() => {
    const el = document.querySelector('.manifesto-wrap') || document.querySelector('#drop');
    return el ? el.getBoundingClientRect().top + window.scrollY : 900;
  });
  await scrollTo(manifestoY);
  await desktopPage.screenshot({ path: path.join(screensDir, '02-manifesto.png') });
  console.log('  Saved 02-manifesto.png');

  // Section 03: The Run
  const runY = await desktopPage.evaluate(() => {
    const el = document.querySelector('.the-run-pin-section');
    return el ? el.getBoundingClientRect().top + window.scrollY + 100 : 2000;
  });
  await scrollTo(runY);
  await desktopPage.screenshot({ path: path.join(screensDir, '03-the-run.png') });
  console.log('  Saved 03-the-run.png');

  // Section 04: Tech Anatomy Blueprint
  const techY = await desktopPage.evaluate(() => {
    const el = document.querySelector('#tech');
    return el ? el.getBoundingClientRect().top + window.scrollY : 4500;
  });
  await scrollTo(techY);
  await desktopPage.screenshot({ path: path.join(screensDir, '04-tech-blueprint.png') });
  console.log('  Saved 04-tech-blueprint.png');

  // Section 05: Tech Race Simulation
  const raceY = await desktopPage.evaluate(() => {
    const el = document.querySelector('.race-test-block');
    return el ? el.getBoundingClientRect().top + window.scrollY - 80 : 5400;
  });
  await scrollTo(raceY);
  await desktopPage.screenshot({ path: path.join(screensDir, '05-tech-race.png') });
  console.log('  Saved 05-tech-race.png');

  // Section 06: Gallery Lineup
  const galleryY = await desktopPage.evaluate(() => {
    const el = document.querySelector('#gallery');
    return el ? el.getBoundingClientRect().top + window.scrollY : 6400;
  });
  await scrollTo(galleryY);
  await desktopPage.screenshot({ path: path.join(screensDir, '06-gallery-lineup.png') });
  console.log('  Saved 06-gallery-lineup.png');

  // Section 07: Size Finder
  const finderY = await desktopPage.evaluate(() => {
    const el = document.querySelector('.size-finder-wrap');
    return el ? el.getBoundingClientRect().top + window.scrollY : 7400;
  });
  await scrollTo(finderY);
  await desktopPage.screenshot({ path: path.join(screensDir, '07-size-finder.png') });
  console.log('  Saved 07-size-finder.png');

  // Section 08: Reserve Stage & Drop Pass
  const reserveY = await desktopPage.evaluate(() => {
    const el = document.querySelector('#reserve');
    return el ? el.getBoundingClientRect().top + window.scrollY : 8400;
  });
  await scrollTo(reserveY);
  await desktopPage.screenshot({ path: path.join(screensDir, '08-reserve.png') });
  console.log('  Saved 08-reserve.png');

  // Section 09: Footer & Launch Control
  const footerY = await desktopPage.evaluate(() => {
    const el = document.querySelector('#footer');
    return el ? el.getBoundingClientRect().top + window.scrollY : 9500;
  });
  await scrollTo(footerY);
  await desktopPage.screenshot({ path: path.join(screensDir, '09-footer.png') });
  console.log('  Saved 09-footer.png');

  // Cover Image (1200x630) from Hero
  console.log('Capturing Cover Image (1200x630)...');
  const coverContext = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const coverPage = await coverContext.newPage();
  await coverPage.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await coverPage.waitForTimeout(3500);
  await coverPage.screenshot({ path: path.join(portfolioDir, 'cover.png') });
  console.log('  Saved /portfolio/cover.png');
  await coverContext.close();

  // 2. MOBILE SCREENSHOTS (390x844)
  console.log('Capturing Mobile Screenshots (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(3500);

  const scrollMobileTo = async (y) => {
    await mobilePage.evaluate((targetY) => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    }, y);
    await mobilePage.waitForTimeout(600);
  };

  // 01 Mobile Hero
  await scrollMobileTo(0);
  await mobilePage.screenshot({ path: path.join(mobileScreensDir, '01-mobile-hero.png') });
  console.log('  Saved 01-mobile-hero.png');

  // 02 Mobile Chapters
  const mobChapY = await mobilePage.evaluate(() => {
    const el = document.querySelector('.mobile-chapters-stack');
    return el ? el.getBoundingClientRect().top + window.scrollY : 1200;
  });
  await scrollMobileTo(mobChapY);
  await mobilePage.screenshot({ path: path.join(mobileScreensDir, '02-mobile-chapters.png') });
  console.log('  Saved 02-mobile-chapters.png');

  // 03 Mobile Tech
  const mobTechY = await mobilePage.evaluate(() => {
    const el = document.querySelector('#tech');
    return el ? el.getBoundingClientRect().top + window.scrollY : 2400;
  });
  await scrollMobileTo(mobTechY);
  await mobilePage.screenshot({ path: path.join(mobileScreensDir, '03-mobile-tech.png') });
  console.log('  Saved 03-mobile-tech.png');

  // 04 Mobile Gallery
  const mobGalY = await mobilePage.evaluate(() => {
    const el = document.querySelector('#gallery');
    return el ? el.getBoundingClientRect().top + window.scrollY : 3600;
  });
  await scrollMobileTo(mobGalY);
  await mobilePage.screenshot({ path: path.join(mobileScreensDir, '04-mobile-gallery.png') });
  console.log('  Saved 04-mobile-gallery.png');

  // 05 Mobile Size Finder
  const mobFinderY = await mobilePage.evaluate(() => {
    const el = document.querySelector('.size-finder-wrap');
    return el ? el.getBoundingClientRect().top + window.scrollY : 4800;
  });
  await scrollMobileTo(mobFinderY);
  await mobilePage.screenshot({ path: path.join(mobileScreensDir, '05-mobile-size-finder.png') });
  console.log('  Saved 05-mobile-size-finder.png');

  // 06 Mobile Reserve
  const mobResY = await mobilePage.evaluate(() => {
    const el = document.querySelector('#reserve');
    return el ? el.getBoundingClientRect().top + window.scrollY : 6000;
  });
  await scrollMobileTo(mobResY);
  await mobilePage.screenshot({ path: path.join(mobileScreensDir, '06-mobile-reserve.png') });
  console.log('  Saved 06-mobile-reserve.png');

  await mobileContext.close();

  // 3. DESKTOP SCREEN RECORDING (25-30s slow smooth scroll)
  console.log('Recording Desktop Video (25-30s) to /portfolio/preview.webm...');
  const videoContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: path.join(portfolioDir, 'temp_video'),
      size: { width: 1440, height: 900 },
    }
  });

  const videoPage = await videoContext.newPage();
  await videoPage.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // 1. Watch loader countdown (3.5s)
  await videoPage.waitForTimeout(3500);

  // 2. Pause on Hero stage (1.5s)
  await videoPage.waitForTimeout(1500);

  // 3. Smooth scroll through sections with 1.5s pauses
  const scrollSteps = [
    { target: '.manifesto-wrap', pause: 1500 },
    { target: '.the-run-pin-section', pause: 2000 },
    { target: '#tech', pause: 2000 },
    { target: '.race-test-block', pause: 1500 },
    { target: '#gallery', pause: 2000 },
    { target: '.size-finder-wrap', pause: 1500 },
    { target: '#reserve', pause: 2000 },
    { target: '#footer', pause: 1500 },
  ];

  for (const step of scrollSteps) {
    const yPos = await videoPage.evaluate((selector) => {
      const el = document.querySelector(selector);
      return el ? el.getBoundingClientRect().top + window.scrollY : 0;
    }, step.target);

    // Smooth step scroll over ~1.2s
    await videoPage.evaluate((targetY) => {
      return new Promise((resolve) => {
        const startY = window.scrollY;
        const diff = targetY - startY;
        const duration = 1200;
        const startTime = performance.now();

        function stepScroll(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease in out sine
          const ease = -(Math.cos(Math.PI * progress) - 1) / 2;
          window.scrollTo(0, startY + diff * ease);
          if (progress < 1) {
            requestAnimationFrame(stepScroll);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(stepScroll);
      });
    }, yPos);

    await videoPage.waitForTimeout(step.pause);
  }

  // Close context to finish writing video file
  const video = videoPage.video();
  await videoContext.close();
  const videoPath = await video.path();

  const finalWebm = path.join(portfolioDir, 'preview.webm');
  if (fs.existsSync(finalWebm)) fs.unlinkSync(finalWebm);
  fs.copyFileSync(videoPath, finalWebm);
  console.log(`  Saved /portfolio/preview.webm (${(fs.statSync(finalWebm).size / 1024 / 1024).toFixed(2)} MB)`);

  // Remove temp video dir
  try {
    fs.rmSync(path.join(portfolioDir, 'temp_video'), { recursive: true, force: true });
  } catch (e) {}

  // Check if ffmpeg is available to produce mp4
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('Converting preview.webm to preview.mp4 with ffmpeg...');
    const finalMp4 = path.join(portfolioDir, 'preview.mp4');
    execSync(`ffmpeg -y -i "${finalWebm}" -c:v libx264 -pix_fmt yuv420p "${finalMp4}"`, { stdio: 'ignore' });
    console.log(`  Saved /portfolio/preview.mp4 (${(fs.statSync(finalMp4).size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (e) {
    console.log('ffmpeg is not installed, skipping MP4 conversion (preview.webm generated successfully).');
  }

  await browser.close();

  if (serverProcess) {
    serverProcess.kill();
  }

  console.log('Portfolio captures complete!');
}

runCapture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
