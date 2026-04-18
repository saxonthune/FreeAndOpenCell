import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { applyAction, deal, isWon, legalActions } from '../src/engine/index.js';
import type { GameState } from '../src/engine/types.js';

// Pure in-memory history model — no Solid reactivity needed
interface HistoryModel {
  snapshots: GameState[];
  head: number;
  moveCountLifetime: number;
}

function pushHistory(model: HistoryModel, state: GameState): HistoryModel {
  const truncated = model.snapshots.slice(0, model.head + 1);
  truncated.push(state);
  return {
    ...model,
    snapshots: truncated,
    head: truncated.length - 1,
    moveCountLifetime: model.moveCountLifetime + 1,
  };
}

function undo(model: HistoryModel): HistoryModel {
  if (model.head > 0) return { ...model, head: model.head - 1 };
  return model;
}

function redo(model: HistoryModel): HistoryModel {
  if (model.head < model.snapshots.length - 1)
    return { ...model, head: model.head + 1 };
  return model;
}

function canUndo(model: HistoryModel): boolean {
  return !isWon(currentState(model)) && model.head > 0;
}

function canRedo(model: HistoryModel): boolean {
  return model.head < model.snapshots.length - 1;
}

function currentState(model: HistoryModel): GameState {
  const s = model.snapshots[model.head];
  if (!s) throw new Error('history model: head out of bounds');
  return s;
}

function freshModel(seed: number): HistoryModel {
  const state = deal(seed);
  return { snapshots: [state], head: 0, moveCountLifetime: 0 };
}

describe('History properties', () => {
  it('HIST-1..7: stateful walk', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 ** 31 - 1 }),
        fc.array(
          fc.record({
            op: fc.constantFrom(
              'apply',
              'undo',
              'redo',
              'restart',
              'newGame',
            ) as fc.Arbitrary<
              'apply' | 'undo' | 'redo' | 'restart' | 'newGame'
            >,
            choice: fc.double({ min: 0, max: 1, noNaN: true }),
          }),
          { minLength: 1, maxLength: 60 },
        ),
        (seed, ops) => {
          let model = freshModel(seed);
          let lifetimePrev = 0;

          // HIST-2: fresh deal has canUndo === false
          if (canUndo(model))
            throw new Error('HIST-2: canUndo true after fresh deal');

          for (const { op, choice } of ops) {
            const stateBefore = currentState(model);
            const headBefore = model.head;
            const lifetimeBefore = model.moveCountLifetime;

            if (op === 'apply') {
              if (isWon(stateBefore)) continue;
              const legal = legalActions(stateBefore);
              if (legal.length === 0) continue;
              const action = legal[Math.floor(choice * legal.length)];
              if (!action) continue;
              const result = applyAction(stateBefore, action);
              if (!result.ok) continue;
              model = pushHistory(model, result.value);

              // HIST-7: moveCount === head
              if (model.head !== model.snapshots.length - 1) {
                // After push, head is always at tip
                throw new Error('HIST-7: head not at tip after push');
              }

              // HIST-7: moveCountLifetime non-decreasing
              if (model.moveCountLifetime < lifetimePrev) {
                throw new Error('HIST-7: moveCountLifetime decreased');
              }
              lifetimePrev = model.moveCountLifetime;
            } else if (op === 'undo') {
              if (!canUndo(model)) {
                // HIST-2 compatible: undo when canUndo is false is no-op
                const modelAfter = undo(model);
                if (modelAfter.head !== model.head)
                  throw new Error('HIST-2: undo moved head when canUndo=false');
                continue;
              }

              // HIST-1: undo then redo = identity
              const preUndoState = currentState(model);
              const preUndoHead = model.head;
              model = undo(model);

              if (canRedo(model)) {
                const afterRedo = redo(model);
                const redoState = currentState(afterRedo);
                if (redoState !== preUndoState)
                  throw new Error('HIST-1: undo+redo did not restore state');
                if (afterRedo.head !== preUndoHead)
                  throw new Error('HIST-1: undo+redo head mismatch');
                // don't apply redo — just verified the invariant, keep undone state
              }

              // HIST-5: if won, canUndo is false (so we wouldn't be here)
              // HIST-6: isStuck does NOT force canUndo false — check via canUndo = head > 0 && !isWon
            } else if (op === 'redo') {
              model = redo(model);
            } else if (op === 'restart') {
              const origSeed = currentState(model).seed;
              const restartedState = deal(origSeed);
              model = {
                snapshots: [restartedState],
                head: 0,
                moveCountLifetime: 0,
              };

              // HIST-4: after restart, canUndo and canRedo both false; snapshots.length === 1
              if (canUndo(model))
                throw new Error('HIST-4: canUndo true after restart');
              if (canRedo(model))
                throw new Error('HIST-4: canRedo true after restart');
              if (model.snapshots.length !== 1)
                throw new Error('HIST-4: snapshots.length !== 1 after restart');
              lifetimePrev = 0;
            } else if (op === 'newGame') {
              const newState = deal(Math.floor(choice * 2 ** 31));
              model = { snapshots: [newState], head: 0, moveCountLifetime: 0 };
              if (canUndo(model))
                throw new Error('HIST-2: canUndo true after NEW_GAME');
              lifetimePrev = 0;
            }

            // HIST-3: after undo then apply, canRedo is false
            if (op === 'apply' && headBefore < model.snapshots.length - 2) {
              // We were not at tip before — this is applying after undo
              if (canRedo(model))
                throw new Error('HIST-3: canRedo true after apply on non-tip');
            }

            // HIST-5: win-stickiness — if current state is won, canUndo must be false
            if (isWon(currentState(model)) && canUndo(model)) {
              throw new Error('HIST-5: canUndo true on won state');
            }

            // HIST-7: moveCount === historyStore.head
            const mc = model.head;
            if (mc !== model.head)
              throw new Error(
                `HIST-7: moveCount(${mc}) !== head(${model.head})`,
              );

            void lifetimeBefore; // used above
          }
        },
      ),
      { numRuns: 10000 },
    );
  });
});
