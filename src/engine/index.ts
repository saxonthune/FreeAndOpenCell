import type { Action, ActionError, GameState, Result } from './types.js';

export function deal(_seed: number): GameState {
  throw new Error('not implemented');
}

export function legalActions(_state: GameState): Action[] {
  throw new Error('not implemented');
}

export function applyAction(
  _state: GameState,
  _action: Action,
): Result<GameState, ActionError> {
  throw new Error('not implemented');
}

export function isWon(_state: GameState): boolean {
  throw new Error('not implemented');
}

export function isStuck(_state: GameState): boolean {
  throw new Error('not implemented');
}

export type * from './types.js';
