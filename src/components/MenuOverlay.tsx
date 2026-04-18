import type { Component } from 'solid-js';
import { createSignal, Show } from 'solid-js';
import { moveLog, newGame, restartGame } from '../stores/dispatch.js';
import { gameStore } from '../stores/gameStore.js';
import { closeModal, openModal, uiStore } from '../stores/uiStore.js';

export const MenuOverlay: Component = () => {
  const [seedInput, setSeedInput] = createSignal('');
  const [copied, setCopied] = createSignal(false);

  const startWithSeed = () => {
    const raw = seedInput().trim();
    if (raw === '') {
      newGame();
      return;
    }
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n)) newGame(n);
  };

  const copyRepro = async () => {
    const payload = JSON.stringify(
      { seed: gameStore().seed, moves: moveLog() },
      null,
      2,
    );
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — fall through
    }
  };

  return (
    <Show when={uiStore.modal === 'menu'}>
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <button
          type="button"
          aria-label="Close menu"
          class="absolute inset-0 backdrop-blur-sm backdrop-brightness-50 cursor-default"
          onClick={closeModal}
          onKeyDown={(e) => e.key === 'Escape' && closeModal()}
        ></button>
        <div class="relative bg-surface text-fg rounded-lg p-6 flex flex-col gap-3 min-w-64 border border-border-subtle">
          <div class="text-sm text-fg-muted">
            Current seed:{' '}
            <span class="font-mono text-fg">{gameStore().seed}</span>
          </div>
          <button
            type="button"
            onClick={() => newGame()}
            class="px-4 py-2 rounded bg-control hover:bg-control-hover text-left"
          >
            New game
          </button>
          <div class="flex gap-2">
            <input
              type="text"
              inputmode="numeric"
              placeholder="seed"
              value={seedInput()}
              onInput={(e) => setSeedInput(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && startWithSeed()}
              class="flex-1 px-3 py-2 rounded border border-border-subtle bg-control text-fg placeholder-fg-muted font-mono text-sm"
            />
            <button
              type="button"
              onClick={startWithSeed}
              class="px-3 py-2 rounded bg-control hover:bg-control-hover"
            >
              Play seed
            </button>
          </div>
          <button
            type="button"
            onClick={restartGame}
            class="px-4 py-2 rounded bg-control hover:bg-control-hover text-left"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={copyRepro}
            class="px-4 py-2 rounded bg-control hover:bg-control-hover text-left"
          >
            {copied() ? 'Copied!' : 'Copy repro (seed + moves)'}
          </button>
          <button
            type="button"
            onClick={() => openModal('about')}
            class="px-4 py-2 rounded bg-control hover:bg-control-hover text-left"
          >
            About
          </button>
        </div>
      </div>
    </Show>
  );
};
