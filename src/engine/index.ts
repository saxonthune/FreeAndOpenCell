import type {
  Action,
  ActionError,
  Card,
  GameState,
  Rank,
  Result,
  Suit,
} from './types.js';

// mulberry32 — public domain seeded PRNG
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUITS: Suit[] = ['H', 'D', 'C', 'S'];

function makeCard(suit: Suit, rank: Rank): Card {
  return { suit, rank, id: `${suit}${rank}` };
}

function isRed(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

function alternatesColor(a: Card, b: Card): boolean {
  return isRed(a.suit) !== isRed(b.suit);
}

// Location encoding:
//   from cascade: "cascade.<col>.<row>"  (row = index of top card moved)
//   to cascade:   "cascade.<col>"        (append to column)
//   freecell:     "freecell.<i>"
//   foundation:   "foundation.<i>"

type ParsedLocation =
  | { kind: 'cascade'; col: number; row: number | undefined }
  | { kind: 'freecell'; index: number }
  | { kind: 'foundation'; index: number };

function parseLocation(s: string): ParsedLocation {
  const parts = s.split('.');
  if (parts[0] === 'cascade') {
    const col = Number.parseInt(parts[1] ?? '', 10);
    const rowStr = parts[2];
    return {
      kind: 'cascade',
      col,
      row: rowStr !== undefined ? Number.parseInt(rowStr, 10) : undefined,
    };
  }
  if (parts[0] === 'freecell') {
    return { kind: 'freecell', index: Number.parseInt(parts[1] ?? '', 10) };
  }
  if (parts[0] === 'foundation') {
    return { kind: 'foundation', index: Number.parseInt(parts[1] ?? '', 10) };
  }
  throw new Error(`Unknown location: ${s}`);
}

function supermoveCapacity(state: GameState, targetIsEmpty: boolean): number {
  const emptyFreecells = state.freecells.filter((c) => c === null).length;
  let emptyCascades = state.cascades.filter((c) => c.length === 0).length;
  if (targetIsEmpty) emptyCascades = Math.max(0, emptyCascades - 1);
  return (1 + emptyFreecells) * 2 ** emptyCascades;
}

function isValidDescendingRun(cards: Card[]): boolean {
  for (let i = 0; i < cards.length - 1; i++) {
    const top = cards[i];
    const next = cards[i + 1];
    if (top === undefined || next === undefined) return false;
    if (!alternatesColor(top, next)) return false;
    if (next.rank !== top.rank - 1) return false;
  }
  return true;
}

function cascadeAccepts(col: Card[], card: Card): boolean {
  if (col.length === 0) return true;
  const top = col[col.length - 1];
  if (top === undefined) return true;
  return alternatesColor(top, card) && card.rank === top.rank - 1;
}

function findFoundationTargets(state: GameState, card: Card): number[] {
  const targets: number[] = [];
  for (let i = 0; i < 4; i++) {
    const slot = state.foundations[i];
    if (slot === null || slot === undefined) {
      if (card.rank === 1) targets.push(i);
    } else {
      if (slot.suit === card.suit && slot.rank === card.rank - 1)
        targets.push(i);
    }
  }
  return targets;
}

export function deal(seed: number): GameState {
  const rand = mulberry32(seed);
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let r = 1; r <= 13; r++) {
      deck.push(makeCard(suit, r as Rank));
    }
  }
  for (let i = 51; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = tmp;
  }
  const cascades: Card[][] = Array.from({ length: 8 }, () => []);
  for (let i = 0; i < 52; i++) {
    cascades[i % 8]!.push(deck[i]!);
  }
  return {
    cascades,
    freecells: [null, null, null, null],
    foundations: [null, null, null, null],
    seed,
    moveCountLifetime: 0,
  };
}

export function legalActions(state: GameState): Action[] {
  if (isWon(state)) return [];
  const actions: Action[] = [];

  // Sources: cascade tops and non-null freecells
  for (let col = 0; col < 8; col++) {
    const cascade = state.cascades[col]!;
    if (cascade.length === 0) continue;

    // Find longest movable run from bottom of cascade
    let runStart = cascade.length - 1;
    while (runStart > 0) {
      const upper = cascade[runStart - 1]!;
      const lower = cascade[runStart]!;
      if (alternatesColor(upper, lower) && lower.rank === upper.rank - 1) {
        runStart--;
      } else {
        break;
      }
    }

    // For each valid stack size from 1 to (cascade.length - runStart)
    for (let start = cascade.length - 1; start >= runStart; start--) {
      const count = cascade.length - start;
      const headCard = cascade[start]!;

      if (count === 1) {
        // To freecell
        for (let fi = 0; fi < 4; fi++) {
          if (state.freecells[fi] === null) {
            actions.push({
              type: 'MOVE_STACK',
              from: `cascade.${col}.${start}`,
              count: 1,
              to: `freecell.${fi}`,
            });
          }
        }
        // To foundation
        for (const fi of findFoundationTargets(state, headCard)) {
          actions.push({
            type: 'MOVE_STACK',
            from: `cascade.${col}.${start}`,
            count: 1,
            to: `foundation.${fi}`,
          });
        }
      }

      // To cascade
      for (let col2 = 0; col2 < 8; col2++) {
        if (col2 === col) continue;
        const target = state.cascades[col2]!;
        if (cascadeAccepts(target, headCard)) {
          const cap = supermoveCapacity(state, target.length === 0);
          if (count <= cap) {
            actions.push({
              type: 'MOVE_STACK',
              from: `cascade.${col}.${start}`,
              count,
              to: `cascade.${col2}`,
            });
          }
        }
      }
    }
  }

  // From freecell
  for (let fi = 0; fi < 4; fi++) {
    const card = state.freecells[fi];
    if (card === null) continue;

    // To foundation
    for (const fnd of findFoundationTargets(state, card)) {
      actions.push({
        type: 'MOVE_STACK',
        from: `freecell.${fi}`,
        count: 1,
        to: `foundation.${fnd}`,
      });
    }

    // To cascade
    for (let col = 0; col < 8; col++) {
      const target = state.cascades[col]!;
      if (cascadeAccepts(target, card)) {
        const cap = supermoveCapacity(state, target.length === 0);
        if (1 <= cap) {
          actions.push({
            type: 'MOVE_STACK',
            from: `freecell.${fi}`,
            count: 1,
            to: `cascade.${col}`,
          });
        }
      }
    }

    // Freecell to freecell
    for (let fi2 = 0; fi2 < 4; fi2++) {
      if (fi2 !== fi && state.freecells[fi2] === null) {
        actions.push({
          type: 'MOVE_STACK',
          from: `freecell.${fi}`,
          count: 1,
          to: `freecell.${fi2}`,
        });
      }
    }
  }

  return actions;
}

export function applyAction(
  state: GameState,
  action: Action,
): Result<GameState, ActionError> {
  if (action.type === 'NEW_GAME') {
    const seed = action.seed ?? Math.floor(Date.now() % 1000000);
    return { ok: true, value: deal(seed) };
  }

  if (action.type === 'RESTART_GAME') {
    return { ok: true, value: { ...deal(state.seed), moveCountLifetime: 0 } };
  }

  // MOVE_STACK
  if (isWon(state)) return { ok: false, error: 'game_over' };

  const { from, count, to } = action;

  let fromLoc: ParsedLocation;
  let toLoc: ParsedLocation;
  try {
    fromLoc = parseLocation(from);
    toLoc = parseLocation(to);
  } catch {
    return { ok: false, error: 'unknown_source' };
  }

  // Validate source exists
  let cards: Card[];
  if (fromLoc.kind === 'cascade') {
    const col = state.cascades[fromLoc.col];
    if (col === undefined) return { ok: false, error: 'unknown_source' };
    const row = fromLoc.row;
    if (row === undefined) return { ok: false, error: 'unknown_source' };
    if (row < 0 || row >= col.length)
      return { ok: false, error: 'unknown_source' };
    cards = col.slice(row);
    if (cards.length !== count) return { ok: false, error: 'illegal_move' };
  } else if (fromLoc.kind === 'freecell') {
    const card = state.freecells[fromLoc.index];
    if (card === undefined || card === null)
      return { ok: false, error: 'unknown_source' };
    if (count !== 1) return { ok: false, error: 'illegal_move' };
    cards = [card];
  } else {
    return { ok: false, error: 'unknown_source' };
  }

  // Validate target exists
  if (toLoc.kind === 'cascade' && (toLoc.col < 0 || toLoc.col >= 8)) {
    return { ok: false, error: 'unknown_target' };
  }
  if (toLoc.kind === 'freecell' && (toLoc.index < 0 || toLoc.index >= 4)) {
    return { ok: false, error: 'unknown_target' };
  }

  // Check legality by verifying action appears in legalActions
  const legal = legalActions(state);
  const isLegal = legal.some(
    (a) =>
      a.type === 'MOVE_STACK' &&
      a.from === from &&
      a.count === count &&
      a.to === to,
  );
  if (!isLegal) return { ok: false, error: 'illegal_move' };

  // Apply: build new state immutably
  const newCascades = state.cascades.map((c) => [...c]);
  const newFreecells = [...state.freecells] as (Card | null)[];
  const newFoundations = [...state.foundations] as (Card | null)[];

  // Remove from source
  if (fromLoc.kind === 'cascade') {
    newCascades[fromLoc.col] = newCascades[fromLoc.col]!.slice(0, fromLoc.row);
  } else if (fromLoc.kind === 'freecell') {
    newFreecells[fromLoc.index] = null;
  }

  // Place at target
  if (toLoc.kind === 'cascade') {
    for (const card of cards) {
      newCascades[toLoc.col]!.push(card);
    }
  } else if (toLoc.kind === 'freecell') {
    newFreecells[toLoc.index] = cards[0]!;
  } else if (toLoc.kind === 'foundation') {
    newFoundations[toLoc.index] = cards[0]!;
  }

  return {
    ok: true,
    value: {
      cascades: newCascades,
      freecells: newFreecells,
      foundations: newFoundations,
      seed: state.seed,
      moveCountLifetime: state.moveCountLifetime + 1,
    },
  };
}

export function isWon(state: GameState): boolean {
  return state.foundations.every((f) => f !== null && f.rank === 13);
}

export function isStuck(state: GameState): boolean {
  return !isWon(state) && legalActions(state).length === 0;
}

export function autoFoundationFloor(
  state: GameState,
  color: 'red' | 'black',
): number {
  const oppositeSuits: Suit[] = color === 'red' ? ['C', 'S'] : ['H', 'D'];
  let min = 13;
  for (const suit of oppositeSuits) {
    const f = state.foundations.find((x) => x?.suit === suit);
    const rank = f?.rank ?? 0;
    if (rank < min) min = rank;
  }
  return min + 1;
}

export function isAutoPromotable(cardId: string, state: GameState): boolean {
  const suit = cardId[0] as Suit;
  const rank = Number.parseInt(cardId.slice(1), 10);
  const color: 'red' | 'black' = suit === 'H' || suit === 'D' ? 'red' : 'black';
  if (rank > autoFoundationFloor(state, color)) return false;
  const actions = legalActions(state);
  return actions.some((a) => {
    if (
      a.type !== 'MOVE_STACK' ||
      a.count !== 1 ||
      !a.to.startsWith('foundation.')
    )
      return false;
    const loc = parseLocation(a.from);
    if (loc.kind === 'cascade') {
      const col = state.cascades[loc.col];
      const row = loc.row;
      return col !== undefined && row !== undefined && col[row]?.id === cardId;
    }
    if (loc.kind === 'freecell') {
      return state.freecells[loc.index]?.id === cardId;
    }
    return false;
  });
}

export type * from './types.js';
