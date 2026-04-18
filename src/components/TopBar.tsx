import type { Component } from 'solid-js';
import { openModal } from '../stores/uiStore.js';
import { MenuButton } from './MenuButton.js';
import { MoveCounter } from './MoveCounter.js';
import { NewGameButton } from './NewGameButton.js';
import { RedoButton } from './RedoButton.js';
import { Timer } from './Timer.js';
import { UndoButton } from './UndoButton.js';

export const TopBar: Component = () => (
  <header class="relative h-topbar bg-topbar text-fg flex items-center px-4 gap-3 shrink-0 border-b border-border-subtle">
    <MenuButton />
    <UndoButton />
    <RedoButton />
    <NewGameButton />
    <button
      type="button"
      onClick={() => openModal('about')}
      class="absolute left-1/2 -translate-x-1/2 font-display text-3xl sm:text-4xl tracking-wider hover:underline"
    >
      FreeAndOpenCell
    </button>
    <span class="flex-1" />
    <MoveCounter />
    <Timer />
  </header>
);
