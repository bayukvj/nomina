import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  site: process.env.SITE_URL ?? 'http://localhost:4321',
  adapter: node({ mode: 'standalone' }),
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['sharp'],
    },
  },
  server: {
    host: true,
    port: 4321,
  },
});
