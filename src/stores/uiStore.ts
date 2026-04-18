import { createStore } from 'solid-js/store';

export interface UIState {
  drag: null | {
    phase: 'pressing' | 'dragging' | 'snapping' | 'cancelling';
    sourceId: string;
    span: number;
    pointer: { x: number; y: number };
    hoveredTargetId: string | null;
  };
  modal: 'menu' | 'about' | null;
  snap: { proximityThresholdPx: number; dragStartThresholdPx: number };
}

const initial: UIState = {
  drag: null,
  modal: null,
  snap: { proximityThresholdPx: 30, dragStartThresholdPx: 5 },
};

export const [uiStore, setUiStore] = createStore<UIState>(initial);

export function pressStart(
  sourceId: string,
  span: number,
  pointer: { x: number; y: number },
): void {
  setUiStore('drag', {
    phase: 'pressing',
    sourceId,
    span,
    pointer,
    hoveredTargetId: null,
  });
}

export function promoteToDragging(): void {
  if (uiStore.drag !== null && uiStore.drag.phase === 'pressing') {
    setUiStore('drag', 'phase', 'dragging');
  }
}

export function dragMove(
  pointer: { x: number; y: number },
  hoveredTargetId: string | null,
): void {
  if (uiStore.drag !== null) {
    setUiStore('drag', 'pointer', pointer);
    setUiStore('drag', 'hoveredTargetId', hoveredTargetId);
  }
}

export function dragEnd(phase: 'snapping' | 'cancelling'): void {
  if (uiStore.drag !== null) {
    setUiStore('drag', 'phase', phase);
  }
}

export function dragClear(): void {
  setUiStore('drag', null);
}

export function openModal(which: 'menu' | 'about'): void {
  setUiStore('modal', which);
}

export function closeModal(): void {
  setUiStore('modal', null);
}
