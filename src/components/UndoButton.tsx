import type { Component } from 'solid-js';
import { canUndo } from '../stores/derived.js';
import { doUndo } from '../stores/dispatch.js';

export const UndoButton: Component = () => (
  <button
    type="button"
    aria-label="Undo"
    disabled={!canUndo()}
    onClick={doUndo}
    class="px-3 py-1 rounded bg-control hover:bg-control-hover disabled:opacity-40 inline-flex items-center justify-center"
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      class="w-5 h-5 fill-none stroke-current"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
    </svg>
  </button>
);
