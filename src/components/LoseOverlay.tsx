import type { Component } from 'solid-js';

export interface LoseOverlayProps {
  open: boolean;
}

export const LoseOverlay: Component<LoseOverlayProps> = (props) => {
  if (!props.open) return null;
  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-8 flex flex-col gap-4 items-center">
        <h2 class="text-2xl font-bold text-red-700">No moves left</h2>
        <button type="button" disabled class="px-6 py-2 rounded bg-red-100">
          New game
        </button>
        <button type="button" disabled class="px-6 py-2 rounded bg-gray-100">
          Undo
        </button>
      </div>
    </div>
  );
};
