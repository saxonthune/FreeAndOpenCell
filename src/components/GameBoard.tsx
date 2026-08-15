import type { Component } from 'solid-js';
import { createSignal, Index, Show } from 'solid-js';
import { isCompact } from '../stores/layout.js';
import { AboutModal } from './AboutModal.js';
import { CascadeArea } from './CascadeArea.js';
import { CompactControlBar } from './CompactControlBar.js';
import { DragGhost } from './DragGhost.js';
import { FoundationSlot } from './FoundationSlot.js';
import { FreecellSlot } from './FreecellSlot.js';
import { LoseOverlay } from './LoseOverlay.js';
import { MenuOverlay } from './MenuOverlay.js';
import { RedoButton } from './RedoButton.js';
import { TopBar } from './TopBar.js';
import { UndoButton } from './UndoButton.js';

// Compact rows consume the solver's gap variables (src/layout/computeLayout.ts)
// so geometry has one source of truth. The paddings here (py-1, pl-3, pr-16)
// are solver inputs (paddingStripes, marginX, chevronReserve) — change them
// together. Cascade rows center their fixed-width content; the solver's gap
// clamp is what makes the columns span the screen, so no max-w here.
const compactSlotRowClass =
  'shrink-0 flex items-start justify-start gap-[var(--slot-gap)] pl-3 pr-16 py-1';
const compactCascadeRowClass =
  'flex-1 flex items-start justify-center gap-[var(--cascade-gap)] py-1 overflow-hidden';

// Right-edge control tiles (chevron / undo / redo). h-10 ×3 with gaps stays
// inside the two slot rows' pr-16 gutter even on the smallest phones, clear of
// cascade band A.
const compactTileClass =
  'flex h-10 w-10 items-center justify-center rounded-lg bg-control/70 border border-border-subtle backdrop-blur-sm text-fg disabled:opacity-40';
const wideCascadeRowClass =
  'flex-1 w-full max-w-[var(--board-max-w)] mx-auto flex items-start justify-between px-4 py-2 overflow-hidden';

// Wide (landscape/desktop) board: one top row (4 freecells + 4 foundations),
// then 8 cascades in a single row.
const WideBoard: Component = () => (
  <>
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
    <div class={wideCascadeRowClass}>
      <Index each={[0, 1, 2, 3, 4, 5, 6, 7] as const}>
        {(i) => <CascadeArea index={i()} />}
      </Index>
    </div>
  </>
);

// Compact (portrait/mobile) board: foundations, freecells, then cascades 0–3
// and 4–7 as two bands. Splitting the 8 cascades into two rows of 4 lets every
// card be larger than the wide board would allow at this aspect ratio. No
// persistent TopBar — the chevron overlays it over the foundation row.
const CompactBoard: Component = () => {
  const [controlsOpen, setControlsOpen] = createSignal(false);
  return (
    <>
      <div class={compactSlotRowClass}>
        <Index each={[0, 1, 2, 3] as const}>
          {(i) => <FoundationSlot index={i()} />}
        </Index>
      </div>
      <div class={compactSlotRowClass}>
        <Index each={[0, 1, 2, 3] as const}>
          {(i) => <FreecellSlot index={i()} />}
        </Index>
      </div>
      <div class={compactCascadeRowClass}>
        <Index each={[0, 1, 2, 3] as const}>
          {(i) => <CascadeArea index={i()} />}
        </Index>
      </div>
      <div class={compactCascadeRowClass}>
        <Index each={[4, 5, 6, 7] as const}>
          {(i) => <CascadeArea index={i()} />}
        </Index>
      </div>
      <Show when={controlsOpen()}>
        <CompactControlBar />
      </Show>
      <div class="absolute top-1.5 right-1.5 z-50 flex flex-col gap-1">
        <button
          type="button"
          aria-label={controlsOpen() ? 'Hide controls' : 'Show controls'}
          aria-expanded={controlsOpen()}
          onClick={() => setControlsOpen((v) => !v)}
          class={compactTileClass}
        >
          <svg
            viewBox="0 0 24 24"
            class="h-5 w-5 transition-transform"
            classList={{ 'rotate-180': controlsOpen() }}
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <UndoButton class={compactTileClass} />
        <RedoButton class={compactTileClass} />
      </div>
    </>
  );
};

export const GameBoard: Component = () => {
  return (
    <>
      <div class="relative w-[100dvw] h-[100dvh] flex flex-col bg-table overflow-hidden">
        <Show when={isCompact()} fallback={<WideBoard />}>
          <CompactBoard />
        </Show>
        <DragGhost />
      </div>
      <MenuOverlay />
      <AboutModal />
      <LoseOverlay />
    </>
  );
};
