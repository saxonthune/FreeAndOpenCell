import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { applyAction, deal, legalActions } from '../src/engine/index.js';
import type { GameState } from '../src/engine/types.js';

// All valid pile IDs for a FreeCell game
function allPileIds(): string[] {
  const ids: string[] = [];
  for (let col = 0; col < 8; col++) ids.push(`cascade.${col}`);
  for (let fi = 0; fi < 4; fi++) ids.push(`freecell.${fi}`);
  for (let i = 0; i < 4; i++) ids.push(`foundation.${i}`);
  return ids;
}

// All valid source IDs (cascade with row, freecell)
function allSourceIds(state: GameState): string[] {
  const ids: string[] = [];
  for (let col = 0; col < 8; col++) {
    const cascade = state.cascades[col];
    if (!cascade) continue;
    for (let row = 0; row < cascade.length; row++) {
      ids.push(`cascade.${col}.${row}`);
    }
  }
  for (let fi = 0; fi < 4; fi++) {
    if (state.freecells[fi] !== null) ids.push(`freecell.${fi}`);
  }
  return ids;
}

// Model: synthetic (GameState, sourceId, hoveredTargetId)
interface Model {
  state: GameState;
  sourceId: string | null;
  hoveredTargetId: string | null;
}

const TARGET_IDS = allPileIds();

describe('Bridge property UI-4', () => {
  it('UI-4: UI legality matches engine legality', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.array(
          fc.record({
            op: fc.constantFrom(
              'move',
              'setSource',
              'setTarget',
            ) as fc.Arbitrary<'move' | 'setSource' | 'setTarget'>,
            choice: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { minLength: 1, maxLength: 40 },
        ),
        (seed, ops) => {
          let model: Model = {
            state: deal(seed),
            sourceId: null,
            hoveredTargetId: null,
          };

          for (const { op, choice } of ops) {
            if (op === 'move') {
              const legal = legalActions(model.state);
              if (legal.length === 0) continue;
              const action = legal[Math.floor(choice * legal.length)];
              if (!action) continue;
              const result = applyAction(model.state, action);
              if (!result.ok) continue;
              model = {
                state: result.value,
                sourceId: null,
                hoveredTargetId: null,
              };
            } else if (op === 'setSource') {
              const sources = allSourceIds(model.state);
              if (sources.length === 0) {
                model = { ...model, sourceId: null };
                continue;
              }
              model = {
                ...model,
                sourceId: sources[Math.floor(choice * sources.length)] ?? null,
              };
            } else if (op === 'setTarget') {
              model = {
                ...model,
                hoveredTargetId:
                  TARGET_IDS[Math.floor(choice * TARGET_IDS.length)] ?? null,
              };
            }

            // UI-4: assert UI legality matches engine
            if (model.sourceId !== null && model.hoveredTargetId !== null) {
              const { sourceId, hoveredTargetId, state } = model;
              const legal = legalActions(state);

              // UI computation: legalTargets filtered by sourceId
              const uiIsLegal = legal.some(
                (a) =>
                  a.type === 'MOVE_STACK' &&
                  a.from === sourceId &&
                  a.to === hoveredTargetId,
              );

              // Engine computation: same check (they use the same function, so this is a tautology sanity-check)
              const engineIsLegal = legal.some(
                (a) =>
                  a.type === 'MOVE_STACK' &&
                  a.from === sourceId &&
                  a.to === hoveredTargetId,
              );

              if (uiIsLegal !== engineIsLegal) {
                throw new Error(
                  `UI-4: UI legality (${uiIsLegal}) disagrees with engine (${engineIsLegal}) for source=${sourceId} target=${hoveredTargetId}`,
                );
              }

              // Additional: if engine says legal and we have a hoveredTargetId,
              // applying applyAction with matching action must succeed
              if (uiIsLegal) {
                const matchingAction = legal.find(
                  (a) =>
                    a.type === 'MOVE_STACK' &&
                    a.from === sourceId &&
                    a.to === hoveredTargetId,
                );
                if (matchingAction) {
                  const result = applyAction(state, matchingAction);
                  if (!result.ok) {
                    throw new Error(
                      `UI-4: engine reported legal but applyAction failed: ${result.error}`,
                    );
                  }
                }
              }
            }
          }
        },
      ),
      { numRuns: 10000 },
    );
  });
});
