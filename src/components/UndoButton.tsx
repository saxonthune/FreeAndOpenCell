import type { Component } from 'solid-js';
import { canUndo } from '../stores/derived.js';
import { doUndo } from '../stores/dispatch.js';

export const UndoButton: Component = () => (
  <button
    type="button"
    disabled={!canUndo()}
    onClick={doUndo}
    class="px-3 py-1 rounded text-white bg-white/10 disabled:opacity-40"
  >
    ↩
  </button>
);
