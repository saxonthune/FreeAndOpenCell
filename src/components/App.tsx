import type { Component } from 'solid-js';
import { onCleanup, onMount } from 'solid-js';
import { newGame } from '../stores/dispatch.js';
import { tickTimer } from '../stores/timerStore.js';
import { GameBoard } from './GameBoard.js';

export const App: Component = () => {
  onMount(() => {
    newGame();
    const id = setInterval(() => tickTimer(1000), 1000);
    onCleanup(() => clearInterval(id));
  });
  return <GameBoard />;
};
