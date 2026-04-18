import type { Rank, Suit } from 'engine';
import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { gameStore } from '../stores/gameStore.js';
import { Card } from './Card.js';

const SUIT_GLYPH: Record<Suit, string> = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠',
};

const SUIT_COLOR: Record<Suit, string> = {
  H: 'text-card-red',
  D: 'text-card-red',
  C: 'text-card-black',
  S: 'text-card-black',
};

export interface FoundationSlotProps {
  suit: Suit;
}

export const FoundationSlot: Component<FoundationSlotProps> = (props) => {
  const topRank = () => gameStore().foundations[props.suit];
  return (
    <div
      class="w-card h-card rounded-sm border-2 border-dashed border-legal/40 flex items-center justify-center"
      data-pile-id={`foundation:${props.suit}`}
    >
      <Show
        when={topRank()}
        fallback={
          <span class={`text-4xl opacity-20 ${SUIT_COLOR[props.suit]}`}>
            {SUIT_GLYPH[props.suit]}
          </span>
        }
      >
        {(r) => (
          <Card
            card={{
              suit: props.suit,
              rank: r() as Rank,
              id: `${props.suit}${r()}`,
            }}
          />
        )}
      </Show>
    </div>
  );
};
