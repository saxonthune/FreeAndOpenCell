import type { Component } from 'solid-js';
import { TopBar } from './TopBar.js';
import { FreecellSlot } from './FreecellSlot.js';
import { FoundationSlot } from './FoundationSlot.js';
import { CascadeArea } from './CascadeArea.js';
import { DragGhost } from './DragGhost.js';
import { MenuOverlay } from './MenuOverlay.js';
import { AboutModal } from './AboutModal.js';
import { WinOverlay } from './WinOverlay.js';
import { LoseOverlay } from './LoseOverlay.js';

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
