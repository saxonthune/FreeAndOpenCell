import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { closeModal, uiStore } from '../stores/uiStore.js';

export const AboutModal: Component = () => (
  <Show when={uiStore.modal === 'about'}>
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close about"
        class="absolute inset-0 bg-black/50 cursor-default"
        onClick={closeModal}
        onKeyDown={(e) => e.key === 'Escape' && closeModal()}
      ></button>
      <div class="relative bg-white rounded-lg p-6 max-w-sm flex flex-col gap-4">
        <h2 class="text-xl font-bold">FreeAndOpenCell</h2>
        <p class="text-gray-700">
          A free and open-source FreeCell solitaire game built with SolidJS.
        </p>
        <button
          type="button"
          onClick={closeModal}
          class="px-4 py-2 rounded bg-gray-100"
        >
          Close
        </button>
      </div>
    </div>
  </Show>
);
