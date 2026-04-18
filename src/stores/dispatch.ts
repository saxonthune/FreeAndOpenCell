import type { Action, GameState } from 'engine';
import { applyAction, isAutoPromotable, legalActions } from 'engine';
import { createSignal } from 'solid-js';
import { AUTO_SWEEP_DELAY_MS } from '../machines/game.js';
import { isStuck, isWon } from './derived.js';
import { gameStore, setGameState } from './gameStore.js';
import {
  clearHistory,
  historyStore,
  pushHistory,
  redo,
  undo,
} from './historyStore.js';
import { resetTimer, startTimer } from './timerStore.js';
import { closeModal } from './uiStore.js';

export interface LoggedMove {
  from: string;
  count: number;
  to: string;
}

const [moveLog, setMoveLog] = createSignal<LoggedMove[]>([]);

export { moveLog };

const [isAutoSweeping, setIsAutoSweeping] = createSignal(false);

export { isAutoSweeping };

let sweepTimer: number | null = null;

function findNextAutoPromotion(state: GameState): Action | null {
  const candidates: string[] = [];
  for (const card of state.freecells) {
    if (card !== null) candidates.push(card.id);
  }
  for (const col of state.cascades) {
    const top = col[col.length - 1];
    if (top !== undefined) candidates.push(top.id);
  }
  for (const cardId of candidates) {
    if (!isAutoPromotable(cardId, state)) continue;
    const actions = legalActions(state);
    const action = actions.find((a) => {
      if (
        a.type !== 'MOVE_STACK' ||
        a.count !== 1 ||
        !a.to.startsWith('foundation.')
      )
        return false;
      const loc = a.from.split('.');
      if (loc[0] === 'cascade') {
        const col = Number.parseInt(loc[1] ?? '', 10);
        const row = Number.parseInt(loc[2] ?? '', 10);
        return state.cascades[col]?.[row]?.id === cardId;
      }
      if (loc[0] === 'freecell') {
        const fi = Number.parseInt(loc[1] ?? '', 10);
        return state.freecells[fi]?.id === cardId;
      }
      return false;
    });
    if (action) return action;
  }
  return null;
}

function stepAutoSweep(): void {
  sweepTimer = null;
  const action = findNextAutoPromotion(gameStore());
  if (!action) {
    setIsAutoSweeping(false);
    return;
  }
  const result = applyAction(gameStore(), action);
  if (!result.ok) {
    setIsAutoSweeping(false);
    return;
  }
  setGameState(result.value);
  pushHistory(result.value);
  sweepTimer = window.setTimeout(stepAutoSweep, AUTO_SWEEP_DELAY_MS);
}

function cancelAutoSweep(): void {
  if (sweepTimer !== null) {
    clearTimeout(sweepTimer);
    sweepTimer = null;
  }
  setIsAutoSweeping(false);
}

function startAutoSweep(): void {
  if (findNextAutoPromotion(gameStore()) === null) return;
  setIsAutoSweeping(true);
  sweepTimer = window.setTimeout(stepAutoSweep, AUTO_SWEEP_DELAY_MS);
}

export function doMove(from: string, count: number, to: string): void {
  if (isAutoSweeping()) return;
  const result = applyAction(gameStore(), {
    type: 'MOVE_STACK',
    from,
    count,
    to,
  });
  if (!result.ok) return;
  setGameState(result.value);
  pushHistory(result.value);
  setMoveLog((log) => [...log, { from, count, to }]);

  startAutoSweep();
}

export function newGame(seed?: number): void {
  cancelAutoSweep();
  const action: Action = {
    type: 'NEW_GAME',
    ...(seed !== undefined ? { seed } : {}),
  };
  const result = applyAction(gameStore(), action);
  if (!result.ok) return;
  setGameState(result.value);
  clearHistory(result.value);
  setMoveLog([]);
  resetTimer();
  startTimer();
  closeModal();
}

export function restartGame(): void {
  cancelAutoSweep();
  const result = applyAction(gameStore(), { type: 'RESTART_GAME' });
  if (!result.ok) return;
  setGameState(result.value);
  clearHistory(result.value);
  setMoveLog([]);
  resetTimer();
  startTimer();
  closeModal();
}

export function doUndo(): void {
  if (isAutoSweeping()) return;
  if (historyStore.head <= 0) return;
  undo();
  const snap = historyStore.snapshots[historyStore.head];
  if (snap) {
    setGameState(snap);
    if (!isWon() && !isStuck()) startTimer();
  }
}

export function doRedo(): void {
  if (isAutoSweeping()) return;
  if (historyStore.head >= historyStore.snapshots.length - 1) return;
  redo();
  const snap = historyStore.snapshots[historyStore.head];
  if (snap) setGameState(snap);
}
