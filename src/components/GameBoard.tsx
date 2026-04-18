import type { Component } from 'solid-js';
import { Index } from 'solid-js';
import { AboutModal } from './AboutModal.js';
import { CascadeArea } from './CascadeArea.js';
import { DragGhost } from './DragGhost.js';
import { FoundationSlot } from './FoundationSlot.js';
import { FreecellSlot } from './FreecellSlot.js';
import { LoseOverlay } from './LoseOverlay.js';
import { MenuOverlay } from './MenuOverlay.js';
import { TopBar } from './TopBar.js';
import { WinOverlay } from './WinOverlay.js';

export const GameBoard: Component = () => (
  <div class="w-[100dvw] h-[100dvh] flex flex-col bg-table overflow-hidden">
    <TopBar />
    <div class="shrink-0 w-full max-w-[var(--board-max-w)] mx-auto flex items-start justify-center gap-[var(--card-w)] px-4 py-2">
      <div class="flex items-start gap-[calc(var(--card-w)*0.5)]">
        <Index each={[0, 1, 2, 3] as const}>
          {(i) => <FreecellSlot index={i()} />}
        </Index>
      </div>
      <div class="flex items-start gap-[calc(var(--card-w)*0.5)]">
        <Index each={[0, 1, 2, 3] as const}>
          {(i) => <FoundationSlot index={i()} />}
        </Index>
      </div>
    </div>
    <div class="flex-1 w-full max-w-[var(--board-max-w)] mx-auto flex items-start justify-between px-4 py-2 overflow-hidden">
      <Index each={[0, 1, 2, 3, 4, 5, 6, 7] as const}>
        {(i) => <CascadeArea index={i()} />}
      </Index>
    </div>
    <DragGhost />
    <MenuOverlay />
    <AboutModal />
    <WinOverlay />
    <LoseOverlay />
  </div>
);
