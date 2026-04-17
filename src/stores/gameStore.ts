import { createSignal } from 'solid-js';
import type { GameState } from 'engine';

const [gameState, setGameState] = createSignal<GameState | null>(null);

export const gameStore = gameState;
export { setGameState };
