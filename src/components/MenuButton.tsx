import type { Component } from 'solid-js';
import { openModal, uiStore } from '../stores/uiStore.js';

export const MenuButton: Component = () => (
  <button
    type="button"
    class="px-3 py-1 rounded text-white bg-white/10 disabled:opacity-40"
    disabled={uiStore.modal !== null || uiStore.drag !== null}
    onClick={() => openModal('menu')}
  >
    ☰
  </button>
);
