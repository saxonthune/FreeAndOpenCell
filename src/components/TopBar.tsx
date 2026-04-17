import type { Component } from 'solid-js';
import { MenuButton } from './MenuButton.js';
import { UndoButton } from './UndoButton.js';
import { RedoButton } from './RedoButton.js';
import { MoveCounter } from './MoveCounter.js';
import { Timer } from './Timer.js';

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
