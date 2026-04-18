import { setup } from 'xstate';

type GameEvent =
  | { type: 'DEAL' }
  | { type: 'READY' }
  | { type: 'ACTION' }
  | { type: 'AUTO_SWEEP_START' }
  | { type: 'TICK' }
  | { type: 'SWEEP_DONE' }
  | { type: 'WIN' }
  | { type: 'STUCK' };

export const AUTO_SWEEP_DELAY_MS = 60;

export const gameMachine = setup({
  types: { events: {} as GameEvent },
}).createMachine({
  id: 'game',
  initial: 'idle',
  states: {
    idle: { on: { DEAL: 'dealing' } },
    dealing: { on: { READY: 'playing' } },
    playing: {
      on: {
        ACTION: 'playing',
        AUTO_SWEEP_START: 'autoSweeping',
        STUCK: 'lost',
      },
    },
    autoSweeping: {
      on: { TICK: 'autoSweeping', SWEEP_DONE: 'playing', WIN: 'won' },
    },
    won: { on: { DEAL: 'dealing' } },
    lost: { on: { DEAL: 'dealing' } },
  },
});
