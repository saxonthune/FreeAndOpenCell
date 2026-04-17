import type { Component } from 'solid-js';
import { AboutModal } from './AboutModal.js';
import { CascadeArea } from './CascadeArea.js';
import { DragGhost } from './DragGhost.js';
import { FoundationSlot } from './FoundationSlot.js';
import { FreecellSlot } from './FreecellSlot.js';
import { LoseOverlay } from './LoseOverlay.js';
import { MenuOverlay } from './MenuOverlay.js';
import { TopBar } from './TopBar.js';
import { WinOverlay } from './WinOverlay.js';

export const GameBoard: Component = () => {
  return (
    <>
      <TopBar />
      <FreecellSlot index={0} />
      <FoundationSlot suit="H" />
      <CascadeArea index={0} />
      <DragGhost />
      <MenuOverlay />
      <AboutModal />
      <WinOverlay />
      <LoseOverlay />
    </>
  );
};
