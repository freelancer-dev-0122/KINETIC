// Eagerly glob all images from /src/assets/img/
const imageModules = import.meta.glob('/src/assets/img/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default'
});

// Normalize the keys to lowercase basename without extension
const imageMap = {};

for (const path in imageModules) {
  // Extract basename without directory or extension
  const match = path.match(/\/([^/]+)\.[^.]+$/);
  if (match) {
    const key = match[1].toLowerCase();
    imageMap[key] = imageModules[path];
  }
}

/**
 * Returns an inline SVG data URI representing a crisp, flat sneaker silhouette in the given accent color.
 * Guaranteed fallback so the page never looks empty.
 */
export function getSneakerFallbackSvg(accentColor = '#D6FF3A') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500" width="1000" height="500">
    <polygon points="120,380 160,260 260,220 380,180 500,200 620,290 820,320 890,370 870,410 740,420 540,420 340,420 180,420" fill="${accentColor}" stroke="#0E0E10" stroke-width="12" stroke-linejoin="miter"/>
    <polygon points="260,220 340,120 440,110 520,180 430,220" fill="none" stroke="#0E0E10" stroke-width="12"/>
    <path d="M 330 380 L 480 380 L 520 360 L 680 360 L 710 380 L 860 380 L 850 410 L 160 410 Z" fill="#0E0E10"/>
    <line x1="280" y1="280" x2="680" y2="340" stroke="#0E0E10" stroke-width="8" stroke-dasharray="16 8"/>
    <text x="320" y="340" font-family="'Archivo', sans-serif" font-weight="900" font-style="italic" font-size="52" fill="#0E0E10">K-1 AERO</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Get image URL by name with fuzzy fallback matching
 * @param {string} name 
 * @param {string} [fallbackAccent='#D6FF3A']
 * @returns {string} Image URL or inline SVG fallback
 */
export function getImage(name, fallbackAccent = '#D6FF3A') {
  if (!name) return getSneakerFallbackSvg(fallbackAccent);

  const clean = String(name).toLowerCase().replace(/\.[^.]+$/, '').trim();

  // Direct match
  if (imageMap[clean]) {
    return imageMap[clean];
  }

  // Fuzzy match (contains key)
  const keys = Object.keys(imageMap);
  const found = keys.find(k => k.includes(clean) || clean.includes(k));
  if (found) {
    return imageMap[found];
  }

  // Fallback flat SVG silhouette
  return getSneakerFallbackSvg(fallbackAccent);
}
