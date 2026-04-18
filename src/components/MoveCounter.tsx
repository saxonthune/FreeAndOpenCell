import type { Component } from 'solid-js';
import { moveCount, moveCountLifetime } from '../stores/derived.js';

export const MoveCounter: Component = () => (
  <span class="text-white font-mono tabular-nums">
    {moveCount()} ({moveCountLifetime()})
  </span>
);
