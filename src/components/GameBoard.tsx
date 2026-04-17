import type { Component } from 'solid-js';
import {
  fakeCanRedo,
  fakeCanUndo,
  fakeElapsedMs,
  fakeGame,
  fakeMoveCount,
  fakeMoveCountLifetime,
} from '../dev/sampleData.js';
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
  <div class="w-screen h-screen flex flex-col bg-table overflow-hidden">
    <TopBar
      moveCount={fakeMoveCount}
      moveCountLifetime={fakeMoveCountLifetime}
      elapsedMs={fakeElapsedMs}
      canUndo={fakeCanUndo}
      canRedo={fakeCanRedo}
    />
    {/* Freecell + Foundation slot row */}
    <div class="shrink-0 flex items-start justify-between px-4 py-2">
      <FreecellSlot index={0} card={fakeGame.freecells[0] ?? null} />
      <FreecellSlot index={1} card={fakeGame.freecells[1] ?? null} />
      <FreecellSlot index={2} card={fakeGame.freecells[2] ?? null} />
      <FreecellSlot index={3} card={fakeGame.freecells[3] ?? null} />
      <FoundationSlot suit="H" topRank={fakeGame.foundations.H} />
      <FoundationSlot suit="D" topRank={fakeGame.foundations.D} />
      <FoundationSlot suit="C" topRank={fakeGame.foundations.C} />
      <FoundationSlot suit="S" topRank={fakeGame.foundations.S} />
    </div>
    {/* Cascade columns */}
    <div class="flex-1 flex items-start justify-between px-4 py-2 overflow-hidden">
      <CascadeArea index={0} cards={fakeGame.cascades[0] ?? []} />
      <CascadeArea index={1} cards={fakeGame.cascades[1] ?? []} />
      <CascadeArea index={2} cards={fakeGame.cascades[2] ?? []} />
      <CascadeArea index={3} cards={fakeGame.cascades[3] ?? []} />
      <CascadeArea index={4} cards={fakeGame.cascades[4] ?? []} />
      <CascadeArea index={5} cards={fakeGame.cascades[5] ?? []} />
      <CascadeArea index={6} cards={fakeGame.cascades[6] ?? []} />
      <CascadeArea index={7} cards={fakeGame.cascades[7] ?? []} />
    </div>
    {/* Overlays (all hidden in task 01) */}
    <DragGhost />
    <MenuOverlay open={false} />
    <AboutModal open={false} />
    <WinOverlay open={false} />
    <LoseOverlay open={false} />
  </div>
);
