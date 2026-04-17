import type { Card as CardData } from 'engine';
import type { Component } from 'solid-js';
import { For } from 'solid-js';
import { Card } from './Card.js';

export interface CascadeAreaProps {
  index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  cards: CardData[];
}

export const CascadeArea: Component<CascadeAreaProps> = (props) => (
  <div
    class="cascade-area"
    style={`--n: ${props.cards.length}`}
    data-pile-id={`cascade:${props.index}`}
  >
    <For each={props.cards}>
      {(card, i) => (
        <div class="cascade-card-slot" style={`--i: ${i()}`}>
          <Card card={card} />
        </div>
      )}
    </For>
  </div>
);
