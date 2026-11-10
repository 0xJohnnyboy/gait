import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  site: 'https://0xjohnnyboy.github.io',
  base: '/gait',
  integrations: [
    react(),
    starlight({
      title: 'gait',
      customCss: ['./src/styles/docs.css'],
      expressiveCode: false,
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/0xJohnnyboy/gait' }],
      sidebar: [
        {
          label: 'Start here',
          items: [{ label: 'Documentation', link: '/docs/' }, { label: 'Quickstart', link: '/docs/quickstart/' }],
        },
        {
          label: 'Use gait',
          autogenerate: { directory: 'docs/guides' },
        },
        {
          label: 'Understand the metrics',
          autogenerate: { directory: 'docs/metrics' },
        },
        {
          label: 'Integrations',
          autogenerate: { directory: 'docs/adapters' },
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'docs/reference' },
        },
        {
          label: 'Deep dive',
          items: [
            { label: 'Architecture', link: '/docs/architecture/' },
            { label: 'Performance', link: '/docs/performance/' },
            { label: 'Privacy & trust', link: '/docs/privacy/' },
          ],
        },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@gaitjs/browser': fileURLToPath(new URL('../packages/browser/src/index.ts', import.meta.url)),
        '@gaitjs/core': fileURLToPath(new URL('../packages/core/src/index.ts', import.meta.url)),
      },
    },
  },
});
