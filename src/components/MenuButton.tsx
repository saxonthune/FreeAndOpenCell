import type { Component } from 'solid-js';
import { openModal, uiStore } from '../stores/uiStore.js';

export const MenuButton: Component = () => (
  <button
    type="button"
    class="px-3 py-1 rounded bg-control hover:bg-control-hover disabled:opacity-40"
    disabled={uiStore.modal !== null || uiStore.drag !== null}
    onClick={() => openModal('menu')}
  >
    ☰
  </button>
);
