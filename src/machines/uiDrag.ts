import { createMachine } from 'xstate';
import { loadSidecar } from './load.js';

export const uiDragMachine = createMachine(
  loadSidecar('uiDrag') as Parameters<typeof createMachine>[0],
);
