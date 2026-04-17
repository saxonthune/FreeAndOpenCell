import type { Component } from 'solid-js';

export interface UndoButtonProps {
  canUndo: boolean;
}

export const UndoButton: Component<UndoButtonProps> = (props) => (
  <button
    type="button"
    disabled={!props.canUndo}
    class="px-3 py-1 rounded text-white bg-white/10 disabled:opacity-40"
  >
    ↩
  </button>
);
