import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: '/FreeAndOpenCell/',
  plugins: [solid(), tailwindcss()],
  resolve: {
    alias: {
      engine: r('./src/engine'),
      stores: r('./src/stores'),
      machines: r('./src/machines'),
      components: r('./src/components'),
      assets: r('./src/assets'),
      sidecars: r('./.carta/02-design'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
});
