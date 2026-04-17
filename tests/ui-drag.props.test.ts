import * as fc from 'fast-check';
import { describe, it } from 'vitest';
import { createActor } from 'xstate';
import {
  canDragStart,
  canOpenMenu,
  uiDragMachine,
} from '../src/machines/uiDrag.js';

type Phase = 'idle' | 'dragging' | 'snapping' | 'cancelling';

describe('UI drag machine properties', () => {
  it('UI-1: drag eventually returns to idle', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            'POINTER_DOWN',
            'POINTER_MOVE',
            'POINTER_UP_LEGAL',
            'POINTER_UP_ILLEGAL',
            'ANIMATION_END',
          ) as fc.Arbitrary<string>,
          { minLength: 0, maxLength: 20 },
        ),
        (events) => {
          const actor = createActor(uiDragMachine);
          actor.start();

          for (const ev of events) {
            if (ev === 'POINTER_DOWN')
              actor.send({
                type: 'POINTER_DOWN',
                sourceId: 'cascade.0.6',
                span: 1,
                x: 0,
                y: 0,
              });
            else if (ev === 'POINTER_MOVE')
              actor.send({
                type: 'POINTER_MOVE',
                x: 1,
                y: 1,
                hoveredTargetId: null,
              });
            else if (ev === 'POINTER_UP_LEGAL')
              actor.send({ type: 'POINTER_UP_LEGAL' });
            else if (ev === 'POINTER_UP_ILLEGAL')
              actor.send({ type: 'POINTER_UP_ILLEGAL' });
            else if (ev === 'ANIMATION_END')
              actor.send({ type: 'ANIMATION_END' });
          }

          // UI-1: any sequence ending with POINTER_UP_* then ANIMATION_END reaches idle
          const phase = actor.getSnapshot().value;
          if (phase === 'snapping' || phase === 'cancelling') {
            actor.send({ type: 'ANIMATION_END' });
          }
          const finalPhase = actor.getSnapshot().value;
          if (finalPhase !== 'idle' && finalPhase !== 'dragging') {
            throw new Error(
              `UI-1: machine stuck in ${String(finalPhase)} after ANIMATION_END`,
            );
          }

          actor.stop();
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('UI-2: OPEN_MENU rejected when drag phase is not idle', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Phase>('idle', 'dragging', 'snapping', 'cancelling'),
        (phase) => {
          // Use the precondition helper — OPEN_MENU should only be accepted in idle
          const canOpen = canOpenMenu(phase === 'idle' ? null : phase);
          if (phase !== 'idle' && canOpen) {
            throw new Error(
              `UI-2: canOpenMenu returned true for phase=${phase}`,
            );
          }
          if (phase === 'idle' && !canOpen) {
            throw new Error(`UI-2: canOpenMenu returned false for idle phase`);
          }

          // Also verify machine state: OPEN_MENU in dragging stays in dragging
          if (phase === 'dragging') {
            const actor = createActor(uiDragMachine);
            actor.start();
            actor.send({
              type: 'POINTER_DOWN',
              sourceId: 'cascade.0.6',
              span: 1,
              x: 0,
              y: 0,
            });
            const phaseBefore = actor.getSnapshot().value;
            actor.send({ type: 'OPEN_MENU' });
            const phaseAfter = actor.getSnapshot().value;
            actor.stop();
            if (phaseBefore !== 'dragging')
              throw new Error('setup: expected dragging');
            if (phaseAfter !== 'dragging') {
              throw new Error(
                `UI-2: OPEN_MENU in dragging changed state to ${String(phaseAfter)}`,
              );
            }
          }
        },
      ),
      { numRuns: 10000 },
    );
  });

  it('UI-3: DRAG_START rejected when modal is open', () => {
    fc.assert(
      fc.property(
        fc.option(fc.constantFrom<'menu' | 'about'>('menu', 'about'), {
          nil: null,
        }),
        (modal) => {
          const canDrag = canDragStart(modal);
          if (modal !== null && canDrag) {
            throw new Error(
              `UI-3: canDragStart returned true when modal=${modal}`,
            );
          }
          if (modal === null && !canDrag) {
            throw new Error(
              'UI-3: canDragStart returned false when modal=null',
            );
          }

          // Machine level: DRAG_START in idle stays idle (it's a self-transition)
          const actor = createActor(uiDragMachine);
          actor.start();
          actor.send({ type: 'DRAG_START' });
          const phaseAfter = actor.getSnapshot().value;
          actor.stop();
          if (phaseAfter !== 'idle') {
            throw new Error(
              `UI-3: DRAG_START in idle changed state to ${String(phaseAfter)}`,
            );
          }
        },
      ),
      { numRuns: 10000 },
    );
  });
});
