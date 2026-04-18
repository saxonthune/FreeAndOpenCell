import type { Component } from 'solid-js';
import { canRedo } from '../stores/derived.js';
import { doRedo } from '../stores/dispatch.js';

export const RedoButton: Component = () => (
  <button
    type="button"
    aria-label="Redo"
    disabled={!canRedo()}
    onClick={doRedo}
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
      <path d="m15 14 5-5-5-5" />
      <path d="M20 9H9a5 5 0 0 0 0 10h3" />
    </svg>
  </button>
);
