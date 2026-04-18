import { createRoot } from 'solid-js';
import { beforeEach, describe, expect, it } from 'vitest';
import { autoFoundationFloor, isAutoPromotable } from '../src/engine/index.js';
import type { Card, GameState } from '../src/engine/types.js';
import { doMove, doUndo } from '../src/stores/dispatch.js';
import { gameStore, setGameState } from '../src/stores/gameStore.js';
import { clearHistory, historyStore } from '../src/stores/historyStore.js';

function card(suit: 'H' | 'D' | 'C' | 'S', rank: number): Card {
  return { suit, rank: rank as Card['rank'], id: `${suit}${rank}` };
}

function emptyState(): GameState {
  return {
    cascades: Array.from({ length: 8 }, () => []),
    freecells: [null, null, null, null],
    foundations: [null, null, null, null],
    seed: 0,
    moveCountLifetime: 0,
  };
}

describe('autoFoundationFloor', () => {
  it('returns 1 with all empty foundations', () => {
    expect(autoFoundationFloor(emptyState())).toBe(1);
  });

  it('returns min+1 for mixed-rank foundations', () => {
    const state = emptyState();
    state.foundations[0] = card('H', 5);
    state.foundations[1] = card('D', 3);
    state.foundations[2] = card('C', 7);
    state.foundations[3] = card('S', 6);
    expect(autoFoundationFloor(state)).toBe(4);
  });

  it('returns 14 when all foundations hold kings', () => {
    const state = emptyState();
    state.foundations[0] = card('H', 13);
    state.foundations[1] = card('D', 13);
    state.foundations[2] = card('C', 13);
    state.foundations[3] = card('S', 13);
    expect(autoFoundationFloor(state)).toBe(14);
  });
});

describe('isAutoPromotable', () => {
  it('returns false for a legally-promotable 9 when floor is 8', () => {
    const state = emptyState();
    // foundations: H7, D8, C7, S7 → floor = min(7,8,7,7)+1 = 8
    state.foundations[0] = card('H', 7);
    state.foundations[1] = card('D', 8);
    state.foundations[2] = card('C', 7);
    state.foundations[3] = card('S', 7);
    // D9 can legally go to foundation.1 (has D8), but rank 9 > floor 8
    state.cascades[0] = [card('D', 9)];
    expect(autoFoundationFloor(state)).toBe(8);
    expect(isAutoPromotable('D9', state)).toBe(false);
  });

  it('returns true for a legally-playable 8 when floor is 8', () => {
    const state = emptyState();
    state.foundations[0] = card('H', 7);
    state.foundations[1] = card('D', 7);
    state.foundations[2] = card('C', 7);
    state.foundations[3] = card('S', 7);
    state.cascades[0] = [card('H', 8)];
    expect(autoFoundationFloor(state)).toBe(8);
    expect(isAutoPromotable('H8', state)).toBe(true);
  });

  it('returns true for any ace when any foundation is empty', () => {
    const state = emptyState();
    state.foundations[0] = card('H', 1);
    state.foundations[1] = card('D', 1);
    state.foundations[2] = card('C', 1);
    // foundation[3] is null → floor = min(1,1,1,0)+1 = 1
    state.cascades[0] = [card('S', 1)];
    expect(autoFoundationFloor(state)).toBe(1);
    expect(isAutoPromotable('S1', state)).toBe(true);
  });

  it('returns false for a freecell card whose rank exceeds the floor', () => {
    const state = emptyState();
    state.foundations[0] = card('H', 7);
    state.foundations[1] = card('D', 7);
    state.foundations[2] = card('C', 7);
    state.foundations[3] = card('S', 7);
    state.freecells[0] = card('H', 9);
    // H9 cannot go to foundation (H8 needed next, not H9)
    expect(isAutoPromotable('H9', state)).toBe(false);
  });
});

describe('auto-foundation sweep — dispatch integration', () => {
  beforeEach(() => {
    const init = emptyState();
    setGameState(init);
    clearHistory(init);
  });

  it('sweeps all promotable cards after a foundation landing', () => {
    createRoot((dispose) => {
      // All 4 aces placed; 4 twos on cascade tops; D3 on freecell
      // User will move H2 → foundation.0 (has H1)
      // Then sweep: D2, C2, S2 auto-promote (floor stays 2 until all 4 twos placed)
      // Then D3 auto-promotes (floor becomes 3 once all 4 twos are placed)
      const state: GameState = {
        cascades: [
          [card('H', 2)],
          [card('D', 2)],
          [card('C', 2)],
          [card('S', 2)],
          [],
          [],
          [],
          [],
        ],
        freecells: [card('D', 3), null, null, null],
        foundations: [card('H', 1), card('D', 1), card('C', 1), card('S', 1)],
        seed: 0,
        moveCountLifetime: 0,
      };
      setGameState(state);
      clearHistory(state);

      const snapshotsBefore = historyStore.snapshots.length;

      doMove('cascade.0.0', 1, 'foundation.0');

      const final = gameStore();

      // All twos should be on foundations
      expect(final.foundations[0]?.rank).toBe(2); // H2
      expect(final.foundations[1]?.rank).toBe(3); // D2 then D3
      expect(final.foundations[2]?.rank).toBe(2); // C2
      expect(final.foundations[3]?.rank).toBe(2); // S2

      // 1 user move + 4 auto-promotions (D2, C2, S2, D3)
      expect(historyStore.snapshots.length).toBe(snapshotsBefore + 5);

      // Undo rewinds exactly one step (un-promotes D3)
      doUndo();
      expect(gameStore().foundations[1]?.rank).toBe(2);

      dispose();
    });
  });

  it('does not sweep after a non-foundation move', () => {
    createRoot((dispose) => {
      const state: GameState = {
        cascades: [[card('H', 2)], [card('D', 2)], [], [], [], [], [], []],
        freecells: [null, null, null, null],
        foundations: [card('H', 1), card('D', 1), card('C', 1), card('S', 1)],
        seed: 0,
        moveCountLifetime: 0,
      };
      setGameState(state);
      clearHistory(state);

      const snapshotsBefore = historyStore.snapshots.length;

      // Move H2 to empty cascade 2 — not a foundation move
      doMove('cascade.0.0', 1, 'cascade.2');

      // Only 1 new snapshot (no sweep)
      expect(historyStore.snapshots.length).toBe(snapshotsBefore + 1);
      // D2 still on cascade 1
      expect(gameStore().cascades[1]?.[0]?.id).toBe('D2');

      dispose();
    });
  });
});
