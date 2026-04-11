import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import remarkObsidianCallouts from './src/plugins/remark-obsidian-callouts.mjs';

export default defineConfig({
  site: 'https://transparency.quietlyworking.org',
  output: 'static',
  integrations: [svelte(), sitemap()],
  markdown: {
    remarkPlugins: [remarkObsidianCallouts],
    shikiConfig: {
      theme: 'one-dark-pro',
    },
  },
});
