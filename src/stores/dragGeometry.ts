import { createSignal } from 'solid-js';

// Pointer minus source-card top-left at grab time.
export const [grabOffset, setGrabOffset] = createSignal<{
  x: number;
  y: number;
}>({ x: 0, y: 0 });

// Target rect center for snap animation on legal drop; source rect center for cancel.
// Set at dragEnd; read by DragGhost during snapping/cancelling phase.
export const [settleTarget, setSettleTarget] = createSignal<{
  x: number;
  y: number;
} | null>(null);
