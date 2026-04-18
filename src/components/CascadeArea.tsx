import type { Component } from 'solid-js';
import { For, onCleanup, onMount } from 'solid-js';
import { autoTarget } from '../stores/derived.js';
import { doMove } from '../stores/dispatch.js';
import { beginDrag, registerSlot } from '../stores/dragInput.js';
import { gameStore } from '../stores/gameStore.js';
import { uiStore } from '../stores/uiStore.js';
import { Card } from './Card.js';

export interface CascadeAreaProps {
  index: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export const CascadeArea: Component<CascadeAreaProps> = (props) => {
  let areaEl!: HTMLDivElement;

  onMount(() => {
    const unregister = registerSlot(`cascade.${props.index}`, areaEl);
    onCleanup(unregister);
  });

  const cards = () => {
    const all = gameStore().cascades[props.index] ?? [];
    const drag = uiStore.drag;
    const prefix = `cascade.${props.index}.`;
    if (!drag?.sourceId.startsWith(prefix)) return all;
    const row = Number.parseInt(drag.sourceId.slice(prefix.length), 10);
    if (!Number.isFinite(row)) return all;
    return all.slice(0, row);
  };

  return (
    <div
      class="cascade-area"
      style={`--n: ${cards().length}`}
      data-pile-id={`cascade.${props.index}`}
      ref={areaEl}
    >
      <For each={cards()}>
        {(card, i) => {
          let slotEl!: HTMLDivElement;
          const isTop = () => i() === cards().length - 1;
          const sourceId = () => `cascade.${props.index}.${i()}`;
          const onDbl = () => {
            if (!isTop()) return;
            const target = autoTarget(sourceId());
            if (target) doMove(sourceId(), 1, target);
          };
          const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            beginDrag(sourceId(), slotEl, e);
          };
          return (
            <div class="cascade-card-slot" style={`--i: ${i()}`} ref={slotEl}>
              <Card
                card={card}
                onDblClick={onDbl}
                onPointerDown={onPointerDown}
              />
            </div>
          );
        }}
      </For>
    </div>
  );
};
