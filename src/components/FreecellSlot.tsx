import type { Card as CardData } from 'engine';
import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { Card } from './Card.js';

export interface FreecellSlotProps {
  index: 0 | 1 | 2 | 3;
  card: CardData | null;
}

export const FreecellSlot: Component<FreecellSlotProps> = (props) => (
  <div
    class="w-card h-card rounded-sm border-2 border-dashed border-legal/40 flex items-center justify-center"
    data-pile-id={`freecell:${props.index}`}
  >
    <Show when={props.card}>{(card) => <Card card={card()} />}</Show>
  </div>
);
