import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 6872,
    watch: { ignored: ['**/.carta/**'] },
  },
  preview: { port: 6872 },
  plugins: [solid(), tailwindcss()],
  resolve: {
    alias: {
      engine: r('./src/engine'),
      stores: r('./src/stores'),
      machines: r('./src/machines'),
      components: r('./src/components'),
      assets: r('./src/assets'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
  },
});
