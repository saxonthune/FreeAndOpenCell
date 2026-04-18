import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { isWon } from '../stores/derived.js';
import { newGame } from '../stores/dispatch.js';

export const WinOverlay: Component = () => (
  <Show when={isWon()}>
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 flex flex-col gap-4 items-center">
        <h2 class="text-2xl font-bold text-green-700">You Win!</h2>
        <button
          type="button"
          onClick={() => newGame()}
          class="px-6 py-2 rounded bg-green-100"
        >
          New game
        </button>
      </div>
    </div>
  </Show>
);
