import type { GameState } from 'engine';
import { deal } from 'engine';

export const fakeGame: GameState = deal(1);
export const fakeMoveCount = 12;
export const fakeMoveCountLifetime = 42;
export const fakeElapsedMs = 194_000; // 03:14
export const fakeModal: 'menu' | 'about' | null = null;
export const fakeDrag = null;
export const fakeIsWon = false;
export const fakeIsStuck = false;
export const fakeCanUndo = true;
export const fakeCanRedo = false;
