import { createStore } from 'solid-js/store';

export interface UIState {
  drag: null | {
    phase: 'dragging' | 'snapping' | 'cancelling';
    sourceId: string;
    span: number;
    pointer: { x: number; y: number };
    hoveredTargetId: string | null;
  };
  modal: 'menu' | 'about' | null;
  snap: { proximityThresholdPx: number };
}

const initial: UIState = {
  drag: null,
  modal: null,
  snap: { proximityThresholdPx: 30 },
};

export const [uiStore, setUiStore] = createStore<UIState>(initial);

export function dragStart(
  sourceId: string,
  span: number,
  pointer: { x: number; y: number },
): void {
  setUiStore('drag', {
    phase: 'dragging',
    sourceId,
    span,
    pointer,
    hoveredTargetId: null,
  });
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
