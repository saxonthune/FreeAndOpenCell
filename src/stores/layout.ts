import { createEffect, createMemo, createRoot, createSignal } from 'solid-js';
import { computeLayout } from '../layout/computeLayout.js';

/*
 * Board geometry lives in one place: the pure solver (computeLayout) runs on a
 * viewport signal, and this root pushes its result onto document.documentElement
 * as CSS variables — so components, overlays, and the drag ghost all read the
 * same numbers, and the DOM arrangement (isCompact) can never disagree with the
 * card-size formulas (doc02.10 L6). The @theme values in tailwind.css are only
 * the pre-JS fallback.
 *
 * App-lifetime singleton: createRoot with no dispose keeps the signal and the
 * listeners alive for the whole session. window.visualViewport also fires when
 * mobile browser chrome collapses/expands, which window resize can miss.
 */
export const { isCompact, boardLayout } = createRoot(() => {
  if (typeof window === 'undefined') {
    const layout = computeLayout({ viewportW: 1024, viewportH: 768 });
    return { isCompact: () => false, boardLayout: () => layout };
  }

  const read = () => ({ w: window.innerWidth, h: window.innerHeight });
  const [viewport, setViewport] = createSignal(read(), {
    equals: (a, b) => a.w === b.w && a.h === b.h,
  });
  const update = () => setViewport(read());
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);

  const boardLayout = createMemo(() =>
    computeLayout({ viewportW: viewport().w, viewportH: viewport().h }),
  );
  const isCompact = createMemo(() => boardLayout().arrangement === 'compact');

  createEffect(() => {
    const l = boardLayout();
    const s = document.documentElement.style;
    s.setProperty('--card-w', `${l.cardW}px`);
    s.setProperty('--board-max-w', `${l.boardMaxW}px`);
    s.setProperty('--cascade-gap', `${l.cascadeGap}px`);
    s.setProperty('--slot-gap', `${l.slotGap}px`);
    s.setProperty('--slot-clip', `${l.slotClip}`);
    s.setProperty('--cascade-rows-available', `${l.rowsAvailable}`);
  });

  return { isCompact, boardLayout };
});
