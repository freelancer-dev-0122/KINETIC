/**
 * Technical layer data for the 5-layer exploded isometric view.
 * Ordered top to bottom (05 Knit Upper down to 01 Traction Outsole).
 */
export const TECH_LAYERS = [
  {
    index: 5,
    id: 'layer-knit-upper',
    name: '05 KNIT UPPER',
    title: 'ENGINEERED VAPOR MESH',
    description: 'Monofilament yarn woven with targeted zoned tension. Zero-absorption hydrophobic coating.',
    spec: '112 G, ENGINEERED MESH',
    specValue: '112',
    specUnit: 'G',
    fillColor: 'var(--cream)',
    strokeColor: 'var(--ink)',
    patternType: 'dots'
  },
  {
    index: 4,
    id: 'layer-lockdown-cage',
    name: '04 LOCKDOWN CAGE',
    title: 'THERMO-FUSED ANATOMICAL SKELETON',
    description: 'Ultralight internal cradle anchoring the navicular bone directly to the carbon bed.',
    spec: '14 G, SEAMLESS',
    specValue: '14',
    specUnit: 'G',
    fillColor: 'var(--ink)',
    strokeColor: 'var(--cream)',
    patternType: 'slots'
  },
  {
    index: 3,
    id: 'layer-carbon-plate',
    name: '03 CARBON PLATE',
    title: 'BIFURCATED SPOON CHASSIS',
    description: 'Pre-impregnated 3K carbon composite tuned for 38% kinetic energy return per stride cycle.',
    spec: '1 FULL-LENGTH PLATE',
    specValue: '1',
    specUnit: 'PLATE',
    fillColor: 'var(--accent)',
    strokeColor: 'var(--ink)',
    patternType: 'carbon'
  },
  {
    index: 2,
    id: 'layer-aero-foam',
    name: '02 AERO FOAM',
    title: 'SUPERCRITICAL PEBA MIDSOLE',
    description: 'High-resilience nitrogen-infused closed-cell foam with microscopic air pocket cushioning.',
    spec: '38% ENERGY RETURN',
    specValue: '38',
    specUnit: '%',
    fillColor: 'var(--fg)',
    strokeColor: 'var(--ink)',
    patternType: 'honeycomb'
  },
  {
    index: 1,
    id: 'layer-traction-outsole',
    name: '01 TRACTION OUTSOLE',
    title: 'HYDRO-GRIP CHEVRON COMPOUND',
    description: 'Razor-siped vulcanized compound providing 0.82 kinetic friction coefficient on wet tarmac.',
    spec: '3.2 MM LUG DEPTH',
    specValue: '3.2',
    specUnit: 'MM',
    fillColor: 'var(--ink)',
    strokeColor: 'var(--cream)',
    patternType: 'chevron'
  }
];
