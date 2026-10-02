/**
 * Sizing logic for K-1 AERO performance racing footwear.
 * Pure mathematical computation with deterministic seed for stock levels.
 */

/**
 * Calculates recommended shoe size and fit confidence based on foot parameters.
 * @param {Object} input
 * @param {number} input.footLengthCm - Foot length in centimeters (22.0 to 31.0)
 * @param {'NARROW' | 'STANDARD' | 'WIDE'} input.width - Foot width category
 * @param {'RACE' | 'TRAIN' | 'DAILY'} input.use - Primary usage intent
 * @param {'SNUG' | 'TRUE' | 'ROOMY'} input.fit - Fit tightness preference
 * @returns {Object} Sizing recommendation details
 */
export function computeSize({ footLengthCm = 27.0, width = 'STANDARD', use = 'TRAIN', fit = 'TRUE' }) {
  // Base US size = length in cm - 18, rounded to nearest 0.5
  let baseUS = Math.round((footLengthCm - 18) * 2) / 2;

  let adjustment = 0;
  let nonZeroAdjustments = 0;

  // Width adjustments
  if (width === 'WIDE') {
    adjustment += 0.5;
    nonZeroAdjustments++;
  }

  // Use adjustments
  if (use === 'RACE') {
    adjustment -= 0.5;
    nonZeroAdjustments++;
  } else if (use === 'DAILY') {
    adjustment += 0.5;
    nonZeroAdjustments++;
  }

  // Fit adjustments
  if (fit === 'SNUG') {
    adjustment -= 0.5;
    nonZeroAdjustments++;
  } else if (fit === 'ROOMY') {
    adjustment += 0.5;
    nonZeroAdjustments++;
  }

  let finalUS = Math.max(6, Math.min(14, baseUS + adjustment));
  // Round to nearest 0.5
  finalUS = Math.round(finalUS * 2) / 2;

  // Conversions
  const finalEU = Math.round((finalUS + 33.5) * 2) / 2;
  const finalUK = finalUS - 0.5;

  // Confidence calculation
  let confidence = 96;
  confidence -= nonZeroAdjustments * 6;
  if (footLengthCm < 23.0 || footLengthCm > 30.0) {
    confidence -= 4;
  }
  confidence = Math.max(62, Math.min(99, confidence));

  // Dynamic tip generation based on choices
  let tip = 'True to race size: locked in for pure kinetic transfer.';
  if (use === 'RACE' || fit === 'SNUG') {
    tip = 'Size down half a size for a race lock-in and zero energy dissipation.';
  } else if (width === 'WIDE') {
    tip = 'Wide foot: the engineered knit collar gives ~4 mm of adaptive lateral stretch.';
  } else if (use === 'DAILY' || fit === 'ROOMY') {
    tip = 'Half size up provides optimal forefoot splay during high-volume marathon prep.';
  }

  return {
    us: finalUS,
    eu: finalEU,
    uk: finalUK,
    confidence,
    tip
  };
}

/**
 * Deterministic stock level calculation per size and colorway.
 * Seeded hash ensure stability without Math.random.
 */
export function stockFor(size, colorwayId = 'cobalt') {
  const cwSeed = { cobalt: 17, volt: 31, punch: 53 }[colorwayId] || 17;
  const sizeNum = Math.round(size * 10);
  const hash = (sizeNum * 37 + cwSeed * 19) % 100;

  if (hash < 12) {
    return { status: 'SOLD_OUT', label: 'SOLD OUT', count: 0 };
  } else if (hash < 38) {
    const remaining = ((hash * 7) % 3) + 1; // 1, 2, or 3
    return { status: 'LOW_STOCK', label: `LOW: ${remaining} LEFT`, count: remaining };
  } else {
    return { status: 'IN_STOCK', label: 'IN STOCK', count: 48 };
  }
}

// Dev-only assertion tests
if (import.meta.env.DEV) {
  const testStandard = computeSize({ footLengthCm: 27.0, width: 'STANDARD', use: 'TRAIN', fit: 'TRUE' });
  console.assert(testStandard.us === 9, `Expected US 9, got ${testStandard.us}`);
  console.assert(testStandard.eu === 42.5, `Expected EU 42.5, got ${testStandard.eu}`);
  console.assert(testStandard.uk === 8.5, `Expected UK 8.5, got ${testStandard.uk}`);
  console.assert(testStandard.confidence === 96, `Expected confidence 96, got ${testStandard.confidence}`);

  // Determinism check
  const testAgain = computeSize({ footLengthCm: 27.0, width: 'STANDARD', use: 'TRAIN', fit: 'TRUE' });
  console.assert(testAgain.us === testStandard.us, 'computeSize must be deterministic');
}
