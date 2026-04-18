import type { Component } from 'solid-js';
import { MenuButton } from './MenuButton.js';
import { MoveCounter } from './MoveCounter.js';
import { RedoButton } from './RedoButton.js';
import { Timer } from './Timer.js';
import { UndoButton } from './UndoButton.js';

export const TopBar: Component = () => (
  <header class="h-topbar bg-topbar flex items-center px-4 gap-3 shrink-0">
    <MenuButton />
    <UndoButton />
    <RedoButton />
    <span class="flex-1" />
    <MoveCounter />
    <Timer />
  </header>
);
