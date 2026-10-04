import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';
import remarkObsidianCallouts from './src/plugins/remark-obsidian-callouts.mjs';

export default defineConfig({
  site: 'https://transparency.quietlyworking.org',
  output: 'static',
  integrations: [svelte(), sitemap()],
  markdown: {
    // Off deliberately: it rewrote '--' in prose into an em dash, which both
    // breaks the QWF em-dash ban and turned published CLI flags such as
    // --dry-run into commands that fail when a reader copies them.
    smartypants: false,
    remarkPlugins: [remarkObsidianCallouts],
    shikiConfig: {
      theme: 'one-dark-pro',
    },
  },
});
