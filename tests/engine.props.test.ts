import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import {
  applyAction,
  deal,
  isStuck,
  isWon,
  legalActions,
} from '../src/engine/index.js';
import { assertInvariants } from '../src/engine/invariants.js';
import type { Action, GameState } from '../src/engine/types.js';

const SUITS = ['H', 'D', 'C', 'S'] as const;

function illegalAction(state: GameState, choice: number): Action | null {
  const legal = legalActions(state);
  const legalSet = new Set(
    legal.map((a) => `${a.type}:${a.from}:${a.count}:${a.to}`),
  );
  for (let col = 0; col < 8; col++) {
    const cascade = state.cascades[col];
    if (!cascade || cascade.length === 0) continue;
    const top = cascade.length - 1;
    for (let col2 = 0; col2 < 8; col2++) {
      if (col2 === col) continue;
      const wrongCount = cascade.length - top + 1;
      const candidate: Action = {
        type: 'MOVE_STACK',
        from: `cascade.${col}.${top}`,
        count: wrongCount,
        to: `cascade.${col2}`,
      };
      const key = `${candidate.type}:${candidate.from}:${candidate.count}:${candidate.to}`;
      if (!legalSet.has(key)) return candidate;
    }
  }
  const suit = SUITS[Math.floor(choice * 4) % 4];
  if (suit) {
    return { type: 'MOVE_STACK', from: 'freecell.99', count: 1, to: `foundation.${suit}` };
  }
  return null;
}

function checkCompleteness(state: GameState): void {
  const legal = legalActions(state);
  const legalSet = new Set(
    legal.map((a) => `${a.type}:${a.from}:${a.count}:${a.to}`),
  );
  const checkCandidate = (candidate: Action) => {
    const r = applyAction(state, candidate);
    if (r.ok) {
      const key = `${candidate.type}:${candidate.from}:${candidate.count}:${candidate.to}`;
      if (!legalSet.has(key)) {
        throw new Error(
          `ENG-6: applicable action not in legalActions: ${JSON.stringify(candidate)}`,
        );
      }
    }
  };
  for (let col = 0; col < 8; col++) {
    const cascade = state.cascades[col];
    if (!cascade || cascade.length === 0) continue;
    const top = cascade.length - 1;
    for (let col2 = 0; col2 < 8; col2++) {
      if (col2 !== col) checkCandidate({ type: 'MOVE_STACK', from: `cascade.${col}.${top}`, count: 1, to: `cascade.${col2}` });
    }
    for (let fi = 0; fi < 4; fi++) checkCandidate({ type: 'MOVE_STACK', from: `cascade.${col}.${top}`, count: 1, to: `freecell.${fi}` });
    for (const suit of SUITS) checkCandidate({ type: 'MOVE_STACK', from: `cascade.${col}.${top}`, count: 1, to: `foundation.${suit}` });
  }
  for (let fi = 0; fi < 4; fi++) {
    if (state.freecells[fi] === null) continue;
    for (let col = 0; col < 8; col++) checkCandidate({ type: 'MOVE_STACK', from: `freecell.${fi}`, count: 1, to: `cascade.${col}` });
    for (const suit of SUITS) checkCandidate({ type: 'MOVE_STACK', from: `freecell.${fi}`, count: 1, to: `foundation.${suit}` });
  }
}

describe('Engine properties', () => {
  it(
    'ENG-1..9: stateful walk',
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 2 ** 31 - 1 }),
          fc.array(fc.double({ min: 0, max: 1, noNaN: true }), {
            minLength: 0,
            maxLength: 20,
          }),
          (seed, choices) => {
            let state = deal(seed);

            assertInvariants(state);

            if (isWon(state) && isStuck(state))
              throw new Error('ENG-9: isWon and isStuck both true on initial deal');

            for (const choice of choices) {
              if (isWon(state)) {
                // ENG-8: terminal stability
                const probe = legalActions(deal(seed + 1));
                if (probe.length > 0) {
                  const r = applyAction(state, probe[0]!);
                  if (r.ok) throw new Error('ENG-8: applyAction on won state returned ok');
                }
                break;
              }

              const legal = legalActions(state);

              // ENG-9
              if (isStuck(state)) {
                if (legal.length !== 0) throw new Error('ENG-9: isStuck but legal.length !== 0');
                if (isWon(state)) throw new Error('ENG-9: isStuck and isWon both true');
                break;
              }

              if (legal.length === 0) break;

              // ENG-7
              const bad = illegalAction(state, choice);
              if (bad) {
                const r = applyAction(state, bad);
                if (r.ok) throw new Error(`ENG-7: illegal action returned ok: ${JSON.stringify(bad)}`);
              }

              const idx = Math.floor(choice * legal.length);
              const chosen = legal[idx];
              if (!chosen) break;

              // ENG-5: chosen legal action applies cleanly
              const result = applyAction(state, chosen);
              if (!result.ok) throw new Error(`ENG-5: legal action returned error: ${result.error}`);
              state = result.value;

              // ENG-1..4
              assertInvariants(state);
            }

            // ENG-6 completeness spot-check
            if (!isWon(state) && !isStuck(state)) {
              checkCompleteness(state);
            }
          },
        ),
        { numRuns: 10000 },
      );
    },
    60000,
  );
});
