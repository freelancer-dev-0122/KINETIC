/**
 * Pure, deterministic booking and pricing logic for K-1 AERO reservation.
 * Zero random calls.
 */

export const PRICE_PER_PAIR = 240;
export const SHIPPING_STANDARD = 0;
export const SHIPPING_EXPRESS = 18;
export const TAX_RATE = 0.08;

/**
 * Calculates itemized pricing for a reservation.
 * @param {number} qty - Quantity of pairs (1 or 2)
 * @param {'STANDARD' | 'EXPRESS'} delivery - Delivery option
 * @returns {{ subtotal: number, shipping: number, tax: number, total: number }}
 */
export function computePricing(qty = 1, delivery = 'STANDARD') {
  const safeQty = Math.max(1, Math.min(2, Math.floor(qty) || 1));
  const subtotal = PRICE_PER_PAIR * safeQty;
  const shipping = delivery === 'EXPRESS' ? SHIPPING_EXPRESS : SHIPPING_STANDARD;
  const rawTax = subtotal * TAX_RATE;
  // Round to nearest cent
  const tax = Math.round(rawTax * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  return {
    subtotal,
    shipping,
    tax,
    total
  };
}

/**
 * Creates a deterministic 32-bit hash integer from a string.
 * @param {string} str
 * @returns {number}
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Generates a deterministic drop pass reference code: "K1-1031-" + 4 uppercase alphanumerics.
 * @param {Object} input
 * @param {string} input.name
 * @param {string} input.email
 * @param {number|string} input.size
 * @param {string} input.colorway
 * @returns {string} Reference code, e.g. "K1-1031-7A9F"
 */
export function makeReference(input = {}) {
  const norm = [
    (input.name || '').trim().toLowerCase(),
    (input.email || '').trim().toLowerCase(),
    String(input.size || '9'),
    (input.colorway || 'cobalt').trim().toLowerCase()
  ].join('::');

  const hash = hashString(norm || 'kinetic-default-pass');
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  let tempHash = hash;
  for (let i = 0; i < 4; i++) {
    code += chars[tempHash % chars.length];
    tempHash = Math.floor(tempHash / chars.length);
  }

  return `K1-1031-${code}`;
}

/**
 * Generates a deterministic queue position number from 1,000 to 12,000 based on input hash.
 * @param {Object} input
 * @returns {number}
 */
export function queuePosition(input = {}) {
  const norm = [
    (input.name || '').trim().toLowerCase(),
    (input.email || '').trim().toLowerCase(),
    String(input.size || '9'),
    (input.colorway || 'cobalt').trim().toLowerCase()
  ].join('::');

  const hash = hashString(norm || 'kinetic-queue-seed');
  return 1000 + (hash % 11001); // 1,000 to 12,000
}

/**
 * Generates an iCalendar (.ics) string for the K-1 AERO drop event.
 * @param {string} reference - The reservation reference code
 * @param {string} [colorwayName='COBALT RUSH']
 * @returns {string}
 */
export function generateDropICS(reference = 'K1-1031-DROP', colorwayName = 'COBALT RUSH') {
  // Drop Date: October 31, 2026, 10:00:00 AM Local
  const dropDate = '20261031T100000';
  const dropEndDate = '20261031T110000';
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KINETIC Athletics//K-1 AERO DROP PASS//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reference}-drop@kinetic.athletics`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dropDate}`,
    `DTEND:${dropEndDate}`,
    `SUMMARY:K-1 AERO DROP // KINETIC ATHLETICS [${colorwayName}]`,
    `DESCRIPTION:Your locked reservation: ${reference}. Two pairs per person. Pay at drop. High-velocity carbon racing footwear.`,
    'LOCATION:https://kinetic.athletics/drop',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:K-1 AERO DROP IN 30 MINUTES',
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers an immediate browser download of the .ics file.
 */
export function downloadDropCalendar(reference, colorwayName) {
  const icsData = generateDropICS(reference, colorwayName);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `K1-AERO-DROP-${reference}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Dev-only assertion checks as requested
if (import.meta.env.DEV) {
  const test1 = computePricing(1, 'STANDARD');
  console.assert(test1.subtotal === 240.00, `Expected subtotal 240.00, got ${test1.subtotal}`);
  console.assert(test1.shipping === 0.00, `Expected shipping 0.00, got ${test1.shipping}`);
  console.assert(test1.tax === 19.20, `Expected tax 19.20, got ${test1.tax}`);
  console.assert(test1.total === 259.20, `Expected total 259.20, got ${test1.total}`);

  const test2 = computePricing(2, 'EXPRESS');
  console.assert(test2.subtotal === 480.00, `Expected subtotal 480.00, got ${test2.subtotal}`);
  console.assert(test2.shipping === 18.00, `Expected shipping 18.00, got ${test2.shipping}`);
  console.assert(test2.tax === 38.40, `Expected tax 38.40, got ${test2.tax}`);
  console.assert(test2.total === 536.40, `Expected total 536.40, got ${test2.total}`);

  // Determinism checks
  const inputA = { name: 'Alex Vance', email: 'alex@kinetic.run', size: 10.5, colorway: 'volt' };
  const ref1 = makeReference(inputA);
  const ref2 = makeReference(inputA);
  console.assert(ref1 === ref2, `makeReference must be deterministic: ${ref1} vs ${ref2}`);
  console.assert(/^K1-1031-[0-9A-Z]{4}$/.test(ref1), `makeReference format invalid: ${ref1}`);

  const q1 = queuePosition(inputA);
  const q2 = queuePosition(inputA);
  console.assert(q1 === q2, `queuePosition must be deterministic: ${q1} vs ${q2}`);
  console.assert(q1 >= 1000 && q1 <= 12000, `queuePosition out of bounds: ${q1}`);
}
