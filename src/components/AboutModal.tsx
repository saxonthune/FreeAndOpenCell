import type { Component } from 'solid-js';

export interface AboutModalProps {
  open: boolean;
}

export const AboutModal: Component<AboutModalProps> = (props) => {
  if (!props.open) return null;
  return (
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm flex flex-col gap-4">
        <h2 class="text-xl font-bold">FreeAndOpenCell</h2>
        <p class="text-gray-700">
          A free and open-source FreeCell solitaire game built with SolidJS.
        </p>
        <button type="button" disabled class="px-4 py-2 rounded bg-gray-100">
          Close
        </button>
      </div>
    </div>
  );
};
