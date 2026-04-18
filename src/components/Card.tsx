import type { Card as CardData } from 'engine';
import type { Component } from 'solid-js';

const faces = import.meta.glob('/src/assets/cards/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export interface CardProps {
  card: CardData;
  hidden?: boolean;
  onDblClick?: (e: MouseEvent) => void;
}

export const Card: Component<CardProps> = (props) => (
  <img
    src={faces[`/src/assets/cards/${props.card.id}.svg`] ?? ''}
    alt={props.card.id}
    class="w-card h-card block rounded-sm"
    onDblClick={props.onDblClick}
  />
);
