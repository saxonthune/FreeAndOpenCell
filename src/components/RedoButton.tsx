import type { Component } from 'solid-js';

export interface RedoButtonProps {
  canRedo: boolean;
}

export const RedoButton: Component<RedoButtonProps> = (props) => (
  <button
    type="button"
    disabled={!props.canRedo}
    class="px-3 py-1 rounded text-white bg-white/10 disabled:opacity-40"
  >
    ↪
  </button>
);
