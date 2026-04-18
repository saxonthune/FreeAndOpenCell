import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { autoTarget } from '../stores/derived.js';
import { doMove } from '../stores/dispatch.js';
import { gameStore } from '../stores/gameStore.js';
import { Card } from './Card.js';

export interface FreecellSlotProps {
  index: 0 | 1 | 2 | 3;
}

export const FreecellSlot: Component<FreecellSlotProps> = (props) => {
  const card = () => gameStore().freecells[props.index] ?? null;
  const sourceId = () => `freecell.${props.index}`;
  const onDbl = () => {
    const target = autoTarget(sourceId());
    if (target) doMove(sourceId(), 1, target);
  };
  return (
    <div
      class="w-card h-card rounded-sm border-2 border-dashed border-legal/40 flex items-center justify-center"
      data-pile-id={`freecell:${props.index}`}
    >
      <Show when={card()}>{(c) => <Card card={c()} onDblClick={onDbl} />}</Show>
    </div>
  );
};
