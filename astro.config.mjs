import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://seminaire-orthodoxe.fr',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  compressHTML: true,
});
