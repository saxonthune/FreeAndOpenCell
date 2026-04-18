import type { Component } from 'solid-js';
import { canRedo } from '../stores/derived.js';
import { doRedo } from '../stores/dispatch.js';

export const RedoButton: Component = () => (
  <button
    type="button"
    disabled={!canRedo()}
    onClick={doRedo}
    class="px-3 py-1 rounded text-white bg-white/10 disabled:opacity-40"
  >
    ↪
  </button>
);
