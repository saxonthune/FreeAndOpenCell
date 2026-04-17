import type { GameState, Suit } from './types.js';

const SUITS: Suit[] = ['H', 'D', 'C', 'S'];

function isRed(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

export function assertInvariants(state: GameState): void {
  const allCards = [
    ...state.cascades.flat(),
    ...state.freecells.filter((c): c is NonNullable<typeof c> => c !== null),
  ];

  for (const suit of SUITS) {
    const n = state.foundations[suit];
    for (let r = 1; r <= n; r++) {
      allCards.push({ suit, rank: r as never, id: `${suit}${r}` });
    }
  }

  if (allCards.length !== 52) {
    throw new Error(
      `INV-1 violated: expected 52 cards, found ${allCards.length}`,
    );
  }

  const seen = new Set<string>();
  for (const card of allCards) {
    const key = `${card.suit}${card.rank}`;
    if (seen.has(key)) throw new Error(`INV-2 violated: duplicate card ${key}`);
    seen.add(key);
  }

  // INV-3: the movable suffix of each cascade (the contiguous alternating-color
  // descending run at the bottom) is valid. Cards above the run are arbitrary
  // (placed by the initial deal). Only the suffix is checked because that is
  // what legal moves guarantee — the full column need not be ordered.
  for (let col = 0; col < state.cascades.length; col++) {
    const cascade = state.cascades[col];
    if (!cascade || cascade.length < 2) continue;
    // Find the start of the movable run (bottom suffix)
    let runStart = cascade.length - 1;
    while (runStart > 0) {
      const upper = cascade[runStart - 1];
      const lower = cascade[runStart];
      if (!upper || !lower) break;
      if (isRed(upper.suit) !== isRed(lower.suit) && lower.rank === upper.rank - 1) {
        runStart--;
      } else {
        break;
      }
    }
    // Verify the suffix from runStart is a valid run
    for (let i = runStart; i < cascade.length - 1; i++) {
      const upper = cascade[i];
      const lower = cascade[i + 1];
      if (!upper || !lower) continue;
      const colorOk = isRed(upper.suit) !== isRed(lower.suit);
      const rankOk = lower.rank === upper.rank - 1;
      if (!colorOk || !rankOk) {
        throw new Error(
          `INV-3 violated: cascade ${col} movable run position ${i}→${i + 1}: ${upper.id} ${lower.id}`,
        );
      }
    }
  }

  for (const suit of SUITS) {
    const n = state.foundations[suit];
    for (let r = 1; r <= n; r++) {
      const inCascade = state.cascades.some((c) =>
        c.some((card) => card.suit === suit && card.rank === r),
      );
      const inFreecell = state.freecells.some(
        (c) => c !== null && c.suit === suit && c.rank === r,
      );
      if (inCascade || inFreecell) {
        throw new Error(
          `INV-4 violated: ${suit}${r} in foundations but also on board`,
        );
      }
    }
  }
}
