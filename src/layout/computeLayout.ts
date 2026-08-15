export interface Viewport {
  viewportW: number;
  viewportH: number;
}

export interface BoardLayout {
  arrangement: 'wide' | 'compact';
  cardW: number;
  cardH: number;
  /** Space between cascade columns (compact bands). */
  cascadeGap: number;
  /** Space between foundation/freecell slots (compact rows). */
  slotGap: number;
  /** Visible slot height as a fraction of card height (pocket clip). */
  slotClip: number;
  /** Cascade rows a band can show before offset compression (doc02.10 L3). */
  rowsAvailable: number;
  /** Content width of the widest row — drives --board-max-w. */
  boardMaxW: number;
}

const ASPECT = 7 / 5;
const CARD_W_MAX = 110;

// Constants below mirror doc02.09 `layout` / `layout.compact` tokens — change
// the JSON first, then here. GameBoard's row padding classes (py-1, pl-3,
// pr-16) must agree with marginX / paddingStripes / chevronReserve.
const WIDE = {
  widthCoef: 0.08,
  heightCoef: 0.17,
  rowsAvailable: 4.4,
  topRowUnits: 12,
};

const COMPACT = {
  cols: 4,
  marginX: 12,
  paddingStripes: 32,
  // Tight clamp: columns read as one tableau; leftover width becomes
  // symmetric edge margins (justify-center) rather than column spacing.
  gapMinRatio: 0.05,
  gapMaxRatio: 0.12,
  slotGapRatio: 0.12,
  slotClip: 0.75,
  // 2.6: a fresh deal's 7-card columns need 1 + 0.25·6 = 2.5 rows at the
  // default offset, so they render uncompressed; longer columns compress.
  // Raising this shrinks every card to reserve room deep stacks rarely use.
  rowsAvailable: 2.6,
  chevronReserve: 56,
};

/*
 * Pure board-geometry solver — the single source of truth for card size,
 * gaps, and the arrangement switch (doc02.06 §Card sizing, doc02.10 L6).
 * Prior art: desktop solitaire engines size cards to the min of a width
 * solve and a height solve, then spread columns across the full playfield;
 * here the leftover width goes into cascadeGap, clamped to
 * [gapMin, gapMax]·cardW, so a height-bound card never strands dead margins.
 */
export function computeLayout(vp: Viewport): BoardLayout {
  const vw = vp.viewportW;
  const vh = vp.viewportH;

  if (vw > vh) {
    const cardW = Math.min(
      WIDE.widthCoef * vw,
      WIDE.heightCoef * vh,
      CARD_W_MAX,
    );
    return {
      arrangement: 'wide',
      cardW,
      cardH: cardW * ASPECT,
      cascadeGap: 0,
      slotGap: 0,
      slotClip: 1,
      rowsAvailable: WIDE.rowsAvailable,
      boardMaxW: cardW * WIDE.topRowUnits,
    };
  }

  const c = COMPACT;
  const innerW = vw - 2 * c.marginX;
  const widthBound = innerW / (c.cols + (c.cols - 1) * c.gapMinRatio);
  const heightBound =
    (vh - c.paddingStripes) / (ASPECT * 2 * (c.slotClip + c.rowsAvailable));
  const slotRowBound =
    (vw - c.marginX - c.chevronReserve) /
    (c.cols + (c.cols - 1) * c.slotGapRatio);
  const cardW = Math.min(widthBound, heightBound, slotRowBound, CARD_W_MAX);
  const cascadeGap = Math.min(
    c.gapMaxRatio * cardW,
    (innerW - c.cols * cardW) / (c.cols - 1),
  );
  return {
    arrangement: 'compact',
    cardW,
    cardH: cardW * ASPECT,
    cascadeGap,
    slotGap: c.slotGapRatio * cardW,
    slotClip: c.slotClip,
    rowsAvailable: c.rowsAvailable,
    boardMaxW: c.cols * cardW + (c.cols - 1) * cascadeGap,
  };
}
