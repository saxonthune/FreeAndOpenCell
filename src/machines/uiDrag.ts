import { setup } from 'xstate';

type DragEvent =
  | {
      type: 'POINTER_DOWN';
      sourceId: string;
      span: number;
      x: number;
      y: number;
    }
  | {
      type: 'POINTER_MOVE';
      x: number;
      y: number;
      hoveredTargetId: string | null;
    }
  | { type: 'POINTER_UP_LEGAL' }
  | { type: 'POINTER_UP_ILLEGAL' }
  | { type: 'ANIMATION_END' }
  | { type: 'OPEN_MENU' }
  | { type: 'DRAG_START' };

export const uiDragMachine = setup({
  types: { events: {} as DragEvent },
}).createMachine({
  id: 'ui-drag',
  initial: 'idle',
  states: {
    idle: {
      on: {
        POINTER_DOWN: 'dragging',
        OPEN_MENU: 'idle',
        DRAG_START: 'idle',
      },
    },
    dragging: {
      on: {
        POINTER_MOVE: 'dragging',
        POINTER_UP_LEGAL: 'snapping',
        POINTER_UP_ILLEGAL: 'cancelling',
      },
    },
    snapping: { on: { ANIMATION_END: 'idle' } },
    cancelling: { on: { ANIMATION_END: 'idle' } },
  },
});

// Precondition helpers for UI-2 and UI-3 properties
// UI-2: OPEN_MENU is only valid when drag.phase === 'idle'
export function canOpenMenu(phase: string | null): boolean {
  return phase === null || phase === 'idle';
}

// UI-3: DRAG_START is only valid when modal === null
export function canDragStart(modal: string | null): boolean {
  return modal === null;
}
