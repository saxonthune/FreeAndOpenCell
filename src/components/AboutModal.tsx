import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import { closeModal, uiStore } from '../stores/uiStore.js';

export const AboutModal: Component = () => (
  <Show when={uiStore.modal === 'about'}>
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close about"
        class="absolute inset-0 backdrop-blur-sm backdrop-brightness-50 cursor-default"
        onClick={closeModal}
        onKeyDown={(e) => e.key === 'Escape' && closeModal()}
      ></button>
      <div class="relative bg-surface text-fg rounded-lg p-6 max-w-sm flex flex-col gap-4 border border-border-subtle">
        <div class="flex items-baseline justify-between gap-2">
          <h2 class="text-xl font-bold">FreeAndOpenCell</h2>
          <span class="text-xs text-fg-muted">v{__APP_VERSION__}</span>
        </div>
        <p>
          A free and open-source FreeCell solitaire game built with SolidJS.
        </p>
        <p class="text-sm text-fg-muted">
          &copy; {new Date().getFullYear()}{' '}
          <a
            href="https://computation.saxon.zone"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
          >
            Saxon Thune
          </a>
          . Licensed under{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
          >
            AGPL-3.0
          </a>
          .
        </p>
        <ul class="text-sm text-fg-muted list-none p-0 m-0">
          <li>
            <a
              href="https://github.com/saxonthune/FreeAndOpenCell"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 underline"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                class="w-4 h-4 fill-current"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Source on GitHub
            </a>
          </li>
        </ul>
        <p class="text-sm text-fg-muted">
          Playing card art by Adrian Kennard, released under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
          >
            CC0
          </a>
          . Source:{' '}
          <a
            href="https://www.me.uk/cards/"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
          >
            me.uk/cards
          </a>
          .
        </p>
        <button
          type="button"
          onClick={closeModal}
          class="px-4 py-2 rounded bg-control hover:bg-control-hover"
        >
          Close
        </button>
      </div>
    </div>
  </Show>
);
