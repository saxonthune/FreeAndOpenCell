import type { Component } from 'solid-js';
import { MenuButton } from './MenuButton.js';
import { MoveCounter } from './MoveCounter.js';
import { RedoButton } from './RedoButton.js';
import { Timer } from './Timer.js';
import { UndoButton } from './UndoButton.js';

export interface TopBarProps {
  moveCount: number;
  moveCountLifetime: number;
  elapsedMs: number;
  canUndo: boolean;
  canRedo: boolean;
}

export const TopBar: Component<TopBarProps> = (props) => (
  <header class="h-topbar bg-topbar flex items-center px-4 gap-3 shrink-0">
    <MenuButton />
    <UndoButton canUndo={props.canUndo} />
    <RedoButton canRedo={props.canRedo} />
    <span class="flex-1" />
    <MoveCounter count={props.moveCount} lifetime={props.moveCountLifetime} />
    <Timer elapsedMs={props.elapsedMs} />
  </header>
);
