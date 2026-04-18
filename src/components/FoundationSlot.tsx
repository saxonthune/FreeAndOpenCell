import type { Component } from 'solid-js';
import { onCleanup, onMount, Show } from 'solid-js';
import { registerSlot } from '../stores/dragInput.js';
import { gameStore } from '../stores/gameStore.js';
import { Card } from './Card.js';

export interface FoundationSlotProps {
  index: 0 | 1 | 2 | 3;
}

export const FoundationSlot: Component<FoundationSlotProps> = (props) => {
  let slotEl!: HTMLDivElement;

  onMount(() => {
    const unregister = registerSlot(`foundation.${props.index}`, slotEl);
    onCleanup(unregister);
  });

  const slot = () => gameStore().foundations[props.index] ?? null;

  return (
    <div
      class="w-card h-card rounded-sm border-2 border-dashed border-legal/40 flex items-center justify-center"
      data-pile-id={`foundation.${props.index}`}
      ref={slotEl}
    >
      <Show when={slot()}>{(card) => <Card card={card()} />}</Show>
    </div>
  );
};
