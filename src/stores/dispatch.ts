import type { Action, GameState } from 'engine';
import { applyAction, isAutoPromotable, legalActions } from 'engine';
import { createSignal } from 'solid-js';
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

function runAutoFoundationSweep(): void {
  let state: GameState = gameStore();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidates: string[] = [];
    for (const card of state.freecells) {
      if (card !== null) candidates.push(card.id);
    }
    for (const col of state.cascades) {
      const top = col[col.length - 1];
      if (top !== undefined) candidates.push(top.id);
    }

    let promoted = false;
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
      if (!action || action.type !== 'MOVE_STACK') continue;
      const result = applyAction(state, action);
      if (!result.ok) continue;
      state = result.value;
      setGameState(state);
      pushHistory(state);
      promoted = true;
      break;
    }

    if (!promoted) break;
  }
}

export function doMove(from: string, count: number, to: string): void {
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

  runAutoFoundationSweep();
}

export function newGame(seed?: number): void {
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
  if (historyStore.head <= 0) return;
  undo();
  const snap = historyStore.snapshots[historyStore.head];
  if (snap) {
    setGameState(snap);
    if (!isWon() && !isStuck()) startTimer();
  }
}

export function doRedo(): void {
  if (historyStore.head >= historyStore.snapshots.length - 1) return;
  redo();
  const snap = historyStore.snapshots[historyStore.head];
  if (snap) setGameState(snap);
}
