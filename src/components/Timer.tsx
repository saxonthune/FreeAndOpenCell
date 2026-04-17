import type { Component } from 'solid-js';

function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export interface TimerProps {
  elapsedMs: number;
}

export const Timer: Component<TimerProps> = (props) => (
  <span class="text-white font-mono tabular-nums">
    {formatMs(props.elapsedMs)}
  </span>
);
