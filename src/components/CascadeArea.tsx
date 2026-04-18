import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { autoTarget } from '../stores/derived.js';
import { doMove } from '../stores/dispatch.js';
import { gameStore } from '../stores/gameStore.js';
import { Card } from './Card.js';

export interface CascadeAreaProps {
  index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export const CascadeArea: Component<CascadeAreaProps> = (props) => {
  const cards = () => gameStore().cascades[props.index] ?? [];
  return (
    <div
      class="cascade-area"
      style={`--n: ${cards().length}`}
      data-pile-id={`cascade:${props.index}`}
    >
      <For each={cards()}>
        {(card, i) => {
          const isTop = () => i() === cards().length - 1;
          const sourceId = () => `cascade.${props.index}.${i()}`;
          const onDbl = () => {
            if (!isTop()) return;
            const target = autoTarget(sourceId());
            if (target) doMove(sourceId(), 1, target);
          };
          return (
            <div class="cascade-card-slot" style={`--i: ${i()}`}>
              <Card card={card} onDblClick={onDbl} />
            </div>
          );
        }}
      </For>
    </div>
  );
};
