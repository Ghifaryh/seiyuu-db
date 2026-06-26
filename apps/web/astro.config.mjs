// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

const apiUrl = process.env.API_URL || 'http://localhost:3001';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.API_URL': JSON.stringify(apiUrl),
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3001',
      },
    },
  },
});