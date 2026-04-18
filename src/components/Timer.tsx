import type { Component } from 'solid-js';
import { timerStore } from '../stores/timerStore.js';

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const Timer: Component = () => (
  <span class="text-white font-mono tabular-nums">
    {formatMs(timerStore.elapsedMs)}
  </span>
);
