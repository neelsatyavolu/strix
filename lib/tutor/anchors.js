'use client';

// Teaching-mode coordinate space.
//
// The tutor's live view is a re-render of the student's screen, not a pixel
// mirror: different width, different column layout, independent scroll. Screen
// coordinates therefore can't be shared. Instead every annotatable box registers
// itself under a stable id ("<questionId>::stem", "<questionId>::choice-A", …)
// and points are stored relative to that box.
//
// Both axes are divided by the region's WIDTH — not width for x and height for
// y — so a circle drawn on a narrow panel arrives as a circle on a wide one
// instead of an ellipse.

const regions = new Map(); // id -> HTMLElement

export const REGION_ATTR = 'data-teach-region';

export function regionId(qid, part) {
  return `${qid || 'q'}::${part}`;
}

// Returns an unregister function so callers can use it directly in an effect.
export function registerRegion(id, el) {
  if (!id || !el) return () => {};
  regions.set(id, el);
  return () => { if (regions.get(id) === el) regions.delete(id); };
}

export function regionRect(id) {
  const el = regions.get(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return r;
}

// Viewport point -> { region, x, y }, or null if the point isn't over any
// region. elementsFromPoint returns the stack topmost-first, so the innermost
// region (a choice) wins over its container without measuring everything.
export function encodePoint(clientX, clientY) {
  if (typeof document === 'undefined') return null;
  const stack = document.elementsFromPoint(clientX, clientY) || [];
  for (const el of stack) {
    const id = el.getAttribute?.(REGION_ATTR);
    if (!id || !regions.has(id)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    return {
      region: id,
      x: round((clientX - r.left) / r.width),
      y: round((clientY - r.top) / r.width),
    };
  }
  return null;
}

// { region, x, y } -> viewport pixels, plus the region width so stroke weights
// can scale the same way the geometry does. Null when the region isn't on
// screen — an unknown region drops its ink rather than misplacing it.
export function decodePoint(region, x, y) {
  const r = regionRect(region);
  if (!r) return null;
  return { px: r.left + x * r.width, py: r.top + y * r.width, width: r.width };
}

// Where an annotated region sits relative to the viewport: 'visible', 'above',
// 'below', or null when it isn't on the page at all.
export function regionPlacement(id) {
  const r = regionRect(id);
  if (!r) return null;
  const h = window.innerHeight;
  if (r.bottom < 0) return 'above';
  if (r.top > h) return 'below';
  return 'visible';
}

export function scrollRegionIntoView(id) {
  const el = regions.get(id);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function regionWidth(region) {
  const r = regionRect(region);
  return r ? r.width : 0;
}

function round(n) {
  return Math.round(n * 10000) / 10000;
}
