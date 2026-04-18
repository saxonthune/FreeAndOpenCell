import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { isWon } from '../stores/derived.js';
import { newGame } from '../stores/dispatch.js';

export const NewGameButton: Component = () => (
  <Show when={isWon()}>
    <button
      type="button"
      onClick={() => newGame()}
      class="px-3 py-1 rounded text-white bg-green-600 hover:bg-green-500"
    >
      New game
    </button>
  </Show>
);
