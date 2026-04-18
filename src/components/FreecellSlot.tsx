import type { Component } from 'solid-js';
import { onCleanup, onMount, Show } from 'solid-js';
import { autoTarget } from '../stores/derived.js';
import { doMove } from '../stores/dispatch.js';
import { beginDrag, registerSlot } from '../stores/dragInput.js';
import { gameStore } from '../stores/gameStore.js';
import { uiStore } from '../stores/uiStore.js';
import { Card } from './Card.js';

export interface FreecellSlotProps {
  index: 0 | 1 | 2 | 3;
}

export const FreecellSlot: Component<FreecellSlotProps> = (props) => {
  let slotEl!: HTMLDivElement;

  onMount(() => {
    const unregister = registerSlot(`freecell.${props.index}`, slotEl);
    onCleanup(unregister);
  });

  const card = () => {
    const c = gameStore().freecells[props.index] ?? null;
    const drag = uiStore.drag;
    if (drag && drag.sourceId === `freecell.${props.index}`) return null;
    return c;
  };

  const sourceId = () => `freecell.${props.index}`;

  const onDbl = () => {
    const target = autoTarget(sourceId());
    if (target) doMove(sourceId(), 1, target);
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    beginDrag(sourceId(), slotEl, e);
  };

  return (
    <div
      class="w-card h-card rounded-sm border-2 border-dashed border-legal/40 flex items-center justify-center"
      data-pile-id={`freecell.${props.index}`}
      ref={slotEl}
    >
      <Show when={card()}>
        {(c) => (
          <Card card={c()} onDblClick={onDbl} onPointerDown={onPointerDown} />
        )}
      </Show>
    </div>
  );
};
