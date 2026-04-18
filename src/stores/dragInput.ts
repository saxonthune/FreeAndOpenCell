import { canDragStart } from '../machines/uiDrag.js';
import { legalActions } from './derived.js';
import { doMove } from './dispatch.js';
import { grabOffset, setGrabOffset, setSettleTarget } from './dragGeometry.js';
import { dragEnd, dragMove, dragStart, uiStore } from './uiStore.js';

// Slot registry — pileId in dot format ('cascade.0', 'freecell.0', 'foundation.0')
const slots = new Map<string, HTMLElement>();

export function registerSlot(pileId: string, el: HTMLElement): () => void {
  slots.set(pileId, el);
  return () => slots.delete(pileId);
}

// Ghost dimensions captured at beginDrag from the source card element.
let ghostSize = { w: 0, h: 0 };

function computeSpan(sourceId: string): number | null {
  let best: number | null = null;
  for (const a of legalActions()) {
    if (a.type !== 'MOVE_STACK' || a.from !== sourceId) continue;
    if (best === null || a.count > best) best = a.count;
  }
  return best;
}

export function beginDrag(
  sourceId: string,
  cardEl: HTMLElement,
  e: PointerEvent,
): void {
  if (!canDragStart(uiStore.modal)) return;
  const span = computeSpan(sourceId);
  if (span === null || span < 1) return;
  const rect = cardEl.getBoundingClientRect();
  ghostSize = { w: rect.width, h: rect.height };
  setGrabOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  dragStart(sourceId, span, { x: e.clientX, y: e.clientY });
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);
  document.addEventListener('pointercancel', onPointerCancel);
}

function rectOverlap(a: DOMRect, b: DOMRect): number {
  const w = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const h = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return w * h;
}

function tiebreakRank(pileId: string): number {
  if (pileId.startsWith('foundation.')) return 3;
  if (pileId.startsWith('freecell.')) return 2;
  return 1; // cascade
}

// Ghost rect uses source card's captured dimensions, positioned at pointer - grabOffset.
// Only the top card size is used for hit-testing (good enough — top card is what users aim with).
function ghostRect(): DOMRect {
  const drag = uiStore.drag;
  if (!drag) return new DOMRect(0, 0, 0, 0);
  const x = drag.pointer.x - grabOffset().x;
  const y = drag.pointer.y - grabOffset().y;
  return new DOMRect(x, y, ghostSize.w, ghostSize.h);
}

function resolveHovered(): string | null {
  const gr = ghostRect();
  let best: { pileId: string; area: number; rank: number } | null = null;
  for (const [pileId, el] of slots) {
    const area = rectOverlap(gr, el.getBoundingClientRect());
    if (area <= 0) continue;
    const rank = tiebreakRank(pileId);
    if (
      best === null ||
      area > best.area ||
      (area === best.area && rank > best.rank)
    )
      best = { pileId, area, rank };
  }
  return best?.pileId ?? null;
}

function onPointerMove(e: PointerEvent): void {
  dragMove({ x: e.clientX, y: e.clientY }, resolveHovered());
}

function findLegalMove(from: string, to: string) {
  for (const a of legalActions()) {
    if (a.type === 'MOVE_STACK' && a.from === from && a.to === to) return a;
  }
  return null;
}

function slotCenter(pileId: string): { x: number; y: number } | null {
  const el = slots.get(pileId);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// For cascade source 'cascade.3.5', return center of 'cascade.3' slot.
function computeSourceCenter(
  sourceId: string,
): { x: number; y: number } | null {
  const prefix = sourceId.startsWith('cascade.')
    ? sourceId.split('.').slice(0, 2).join('.')
    : sourceId;
  return slotCenter(prefix);
}

function onPointerUp(_e: PointerEvent): void {
  const drag = uiStore.drag;
  if (!drag) {
    cleanup();
    return;
  }
  const hovered = drag.hoveredTargetId;
  const move = hovered ? findLegalMove(drag.sourceId, hovered) : null;
  if (move) {
    doMove(move.from, move.count, move.to);
    const center = slotCenter(move.to);
    setSettleTarget(center ?? null);
    dragEnd('snapping');
  } else {
    const sourceCenter = computeSourceCenter(drag.sourceId);
    setSettleTarget(sourceCenter);
    dragEnd('cancelling');
  }
  cleanup();
}

function onPointerCancel(_e: PointerEvent): void {
  const drag = uiStore.drag;
  if (!drag) {
    cleanup();
    return;
  }
  const sourceCenter = computeSourceCenter(drag.sourceId);
  setSettleTarget(sourceCenter);
  dragEnd('cancelling');
  cleanup();
}

function cleanup(): void {
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
  document.removeEventListener('pointercancel', onPointerCancel);
}
