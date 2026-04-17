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

export function dragStart(_sourceId: string, _span: number, _pointer: { x: number; y: number }): void {
  throw new Error('not implemented');
}

export function dragMove(_pointer: { x: number; y: number }, _hoveredTargetId: string | null): void {
  throw new Error('not implemented');
}

export function dragEnd(_targetId: string | null): void {
  throw new Error('not implemented');
}

export function openModal(_which: 'menu' | 'about'): void {
  setUiStore('modal', _which);
}

export function closeModal(): void {
  setUiStore('modal', null);
}
