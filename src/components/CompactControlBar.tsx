import type { Component } from 'solid-js';
import { openModal } from '../stores/uiStore.js';
import { MenuButton } from './MenuButton.js';
import { MoveCounter } from './MoveCounter.js';
import { NewGameButton } from './NewGameButton.js';
import { Timer } from './Timer.js';

// Compact-arrangement replacement for TopBar: a full-bleed bar overlaid on the
// foundation row when the chevron is open. Undo/redo are NOT here — they live
// in the always-visible tile stack under the chevron (CompactBoard). h-14 and
// pr-16 are sized so the chevron tile (h-10 at top-1.5 right-1.5) sits inside
// the bar and never overlaps the Timer.
export const CompactControlBar: Component = () => (
  <div class="absolute inset-x-0 top-0 z-40 h-14 bg-topbar text-fg border-b border-border-subtle shadow-lg flex items-center gap-3 pl-3 pr-16">
    <MenuButton />
    <NewGameButton />
    <span class="flex-1" />
    <button
      type="button"
      onClick={() => openModal('about')}
      class="font-display text-2xl tracking-wider hover:underline"
    >
      FAOC
    </button>
    <span class="flex-1" />
    <MoveCounter />
    <Timer />
  </div>
);
