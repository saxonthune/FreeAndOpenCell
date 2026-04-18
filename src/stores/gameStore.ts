import type { GameState } from 'engine';
import { deal } from 'engine';
import { createSignal } from 'solid-js';

const [gameState, setGameState] = createSignal<GameState>(deal(1));

export const gameStore = gameState;
export { setGameState };
