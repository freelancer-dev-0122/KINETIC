/**
 * Hotspot coordinate percentages relative to the shoe bounding box.
 * Default values tailored for a side-profile sneaker facing right.
 * Side indicates where the label and line sprout ('top', 'bottom', 'left', 'right').
 */
export const HOTSPOTS = [
  {
    id: 'plate',
    chapter: 2, // 02 SNAP
    x: 52,
    y: 78,
    label: 'CARBON PLATE',
    side: 'bottom',
    description: 'Dual-fork 3K carbon composite spoon plate.'
  },
  {
    id: 'foam',
    chapter: 3, // 03 FLOAT
    x: 30,
    y: 82,
    label: 'AERO FOAM',
    side: 'bottom',
    description: 'Supercritical PEBA core with zero compression fatigue.'
  },
  {
    id: 'collar',
    chapter: 1, // 01 LAUNCH
    x: 78,
    y: 38,
    label: 'KNIT COLLAR',
    side: 'top',
    description: 'Zero-seam anatomical ankle lock system.'
  },
  {
    id: 'laces',
    chapter: 4, // 04 LOCK
    x: 50,
    y: 28,
    label: 'LOCKDOWN LACES',
    side: 'top',
    description: 'Direct-pull micro-cord with friction weave.'
  }
];
