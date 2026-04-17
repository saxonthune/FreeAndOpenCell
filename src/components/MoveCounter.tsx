import type { Component } from 'solid-js';

export interface MoveCounterProps {
  count: number;
  lifetime: number;
}

export const MoveCounter: Component<MoveCounterProps> = (props) => (
  <span class="text-white font-mono tabular-nums">
    {props.count} ({props.lifetime})
  </span>
);
