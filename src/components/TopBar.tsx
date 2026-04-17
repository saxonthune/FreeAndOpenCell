import type { Component } from 'solid-js';
import { MenuButton } from './MenuButton.js';
import { MoveCounter } from './MoveCounter.js';
import { RedoButton } from './RedoButton.js';
import { Timer } from './Timer.js';
import { UndoButton } from './UndoButton.js';

export const TopBar: Component = () => {
  return (
    <header>
      <MenuButton />
      <UndoButton />
      <RedoButton />
      <MoveCounter />
      <Timer />
    </header>
  );
};
