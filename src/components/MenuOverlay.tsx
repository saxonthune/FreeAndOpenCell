import type { Component } from 'solid-js';

export interface MenuOverlayProps {
  open: boolean;
}

export const MenuOverlay: Component<MenuOverlayProps> = (props) => {
  if (!props.open) return null;
  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 flex flex-col gap-3 min-w-48">
        <button
          type="button"
          disabled
          class="px-4 py-2 rounded bg-gray-100 text-left"
        >
          New game
        </button>
        <button
          type="button"
          disabled
          class="px-4 py-2 rounded bg-gray-100 text-left"
        >
          Restart
        </button>
        <button
          type="button"
          disabled
          class="px-4 py-2 rounded bg-gray-100 text-left"
        >
          About
        </button>
      </div>
    </div>
  );
};
