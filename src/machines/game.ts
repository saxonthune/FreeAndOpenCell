import { createMachine } from 'xstate';
import { loadSidecar } from './load.js';

export const gameMachine = createMachine(
  loadSidecar('game') as Parameters<typeof createMachine>[0],
);
