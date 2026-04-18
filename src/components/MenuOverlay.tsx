import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { newGame, restartGame } from '../stores/dispatch.js';
import { closeModal, openModal, uiStore } from '../stores/uiStore.js';

export const MenuOverlay: Component = () => (
  <Show when={uiStore.modal === 'menu'}>
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close menu"
        class="absolute inset-0 bg-black/50 cursor-default"
        onClick={closeModal}
        onKeyDown={(e) => e.key === 'Escape' && closeModal()}
      ></button>
      <div class="relative bg-white rounded-lg p-6 flex flex-col gap-3 min-w-48">
        <button
          type="button"
          onClick={() => newGame()}
          class="px-4 py-2 rounded bg-gray-100 text-left"
        >
          New game
        </button>
        <button
          type="button"
          onClick={restartGame}
          class="px-4 py-2 rounded bg-gray-100 text-left"
        >
          Restart
        </button>
        <button
          type="button"
          onClick={() => openModal('about')}
          class="px-4 py-2 rounded bg-gray-100 text-left"
        >
          About
        </button>
      </div>
    </div>
  </Show>
);
