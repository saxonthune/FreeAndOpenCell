import { describe, expect, it } from 'vitest';
import { computeLayout } from './computeLayout.js';

// Supported-viewport matrix, doc02.10 §Supported viewports. The 430×750 row is
// an iPhone with Safari chrome visible (dynamic viewport smaller than screen).
const portrait: Array<[number, number]> = [
  [360, 640],
  [390, 844],
  [430, 750],
  [430, 932],
  [768, 1024],
];
const landscape: Array<[number, number]> = [
  [800, 400],
  [1024, 600],
  [1920, 1080],
  [3840, 2160],
];

describe('computeLayout — compact (portrait)', () => {
  it.each(portrait)('%dx%d satisfies the layout constraints', (vw, vh) => {
    const l = computeLayout({ viewportW: vw, viewportH: vh });
    expect(l.arrangement).toBe('compact');

    // Aspect ratio holds by construction.
    expect(l.cardH).toBeCloseTo(l.cardW * (7 / 5), 6);

    // L1 height budget: 2 clipped slot rows + 2 bands + padding stripes fit.
    const stack = 2 * l.slotClip * l.cardH + 2 * l.rowsAvailable * l.cardH + 32;
    expect(stack).toBeLessThanOrEqual(vh + 1e-6);

    // L2 width bound: the widest row plus margins fits the viewport.
    expect(l.boardMaxW).toBeLessThanOrEqual(vw - 2 * 12 + 1e-6);

    // Gap clamp: tight tableau spacing, leftover width goes to edge margins.
    expect(l.cascadeGap).toBeGreaterThanOrEqual(0.05 * l.cardW - 1e-6);
    expect(l.cascadeGap).toBeLessThanOrEqual(0.12 * l.cardW + 1e-6);

    // Slot row (4 slots + chevron reserve) fits.
    const slotRow = 4 * l.cardW + 3 * l.slotGap + 12 + 56;
    expect(slotRow).toBeLessThanOrEqual(vw + 1e-6);
  });

  it('caps gaps when height-bound; leftover width becomes edge margins', () => {
    const l = computeLayout({ viewportW: 430, viewportH: 750 });
    // Height-bound here; gaps take leftover width only up to the tight cap.
    const leftover = 430 - 2 * 12 - 4 * l.cardW;
    expect(l.cascadeGap).toBeCloseTo(Math.min(0.12 * l.cardW, leftover / 3), 6);
  });
});

describe('computeLayout — wide (landscape)', () => {
  it.each(landscape)('%dx%d matches the wide formula', (vw, vh) => {
    const l = computeLayout({ viewportW: vw, viewportH: vh });
    expect(l.arrangement).toBe('wide');
    expect(l.cardW).toBeCloseTo(Math.min(0.08 * vw, 0.17 * vh, 110), 6);
    expect(l.cardH).toBeCloseTo(l.cardW * (7 / 5), 6);
    expect(l.boardMaxW).toBeCloseTo(l.cardW * 12, 6);
  });
});

describe('computeLayout — L6 arrangement switch', () => {
  it('compact never yields smaller cards where it engages', () => {
    for (const [vw, vh] of [...portrait, [600, 600] as [number, number]]) {
      const compact = computeLayout({ viewportW: vw, viewportH: vh });
      const wideCardW = Math.min(0.08 * vw, 0.17 * vh, 110);
      expect(compact.cardW).toBeGreaterThanOrEqual(wideCardW - 1e-6);
    }
  });
});
