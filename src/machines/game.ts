import { setup } from 'xstate';

type GameEvent =
  | { type: 'DEAL' }
  | { type: 'READY' }
  | { type: 'ACTION' }
  | { type: 'WIN' }
  | { type: 'STUCK' };

export const gameMachine = setup({
  types: { events: {} as GameEvent },
}).createMachine({
  id: 'game',
  initial: 'idle',
  states: {
    idle: { on: { DEAL: 'dealing' } },
    dealing: { on: { READY: 'playing' } },
    playing: { on: { ACTION: 'playing', WIN: 'won', STUCK: 'lost' } },
    won: { type: 'final' },
    lost: { type: 'final' },
  },
});
