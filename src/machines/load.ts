import gameJson from 'sidecars/02-game.json';
import uiDragJson from 'sidecars/03-ui-drag.json';

const sidecars = {
  game: gameJson,
  uiDrag: uiDragJson,
} as const;

export type SidecarName = keyof typeof sidecars;

export function loadSidecar(name: SidecarName): unknown {
  return sidecars[name];
}
