import type { Card as CardData } from 'engine';
import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { grabOffset, settleTarget } from '../stores/dragGeometry.js';
import { gameStore } from '../stores/gameStore.js';
import { dragClear, uiStore } from '../stores/uiStore.js';
import { Card } from './Card.js';

function cardsForSource(sourceId: string, span: number): CardData[] {
  if (sourceId.startsWith('cascade.')) {
    const parts = sourceId.split('.');
    const col = Number.parseInt(parts[1] ?? '', 10);
    const row = Number.parseInt(parts[2] ?? '', 10);
    if (!Number.isFinite(col) || !Number.isFinite(row)) return [];
    const column = gameStore().cascades[col] ?? [];
    return column.slice(row, row + span);
  }
  if (sourceId.startsWith('freecell.')) {
    const i = Number.parseInt(sourceId.slice('freecell.'.length), 10);
    const c = gameStore().freecells[i];
    return c ? [c] : [];
  }
  return [];
}

export const DragGhost: Component = () => (
  <Show when={uiStore.drag}>
    {(drag) => {
      const phase = () => drag().phase;
      const isSettling = () =>
        phase() === 'snapping' || phase() === 'cancelling';
      const ghostPos = () => {
        if (isSettling()) {
          const t = settleTarget();
          if (t) return { x: t.x, y: t.y };
        }
        return {
          x: drag().pointer.x - grabOffset().x,
          y: drag().pointer.y - grabOffset().y,
        };
      };
      const cards = () => cardsForSource(drag().sourceId, drag().span);
      return (
        <div
          class="pointer-events-none fixed z-40 cascade-area"
          classList={{ 'transition-all duration-150 ease-out': isSettling() }}
          style={`left: ${ghostPos().x}px; top: ${ghostPos().y}px; --n: ${cards().length}`}
          onTransitionEnd={() => {
            const d = uiStore.drag;
            if (d && (d.phase === 'snapping' || d.phase === 'cancelling'))
              dragClear();
          }}
        >
          <For each={cards()}>
            {(c, i) => (
              <div class="cascade-card-slot" style={`--i: ${i()}`}>
                <Card card={c} />
              </div>
            )}
          </For>
        </div>
      );
    }}
  </Show>
);
