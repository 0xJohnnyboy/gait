import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://0xjohnnyboy.github.io',
  base: '/gait',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@gait/browser': fileURLToPath(new URL('../packages/browser/src/index.ts', import.meta.url)),
        '@gait/core': fileURLToPath(new URL('../packages/core/src/index.ts', import.meta.url)),
      },
    },
  },
});
