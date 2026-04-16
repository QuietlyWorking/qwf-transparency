import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    pillar: z.enum(['built-from-broken', 'open-playbook', 'living-proof', 'root']),
    description: z.string().default(''),
    publishDate: z.string().optional(),
    modifiedDate: z.string().optional(),
    tags: z.array(z.string()).default([]),
    series: z.string().optional(),
    volume: z.number().optional(),
    hook: z.string().optional(),
    isHome: z.boolean().default(false),
    vaultPath: z.string().optional(),
  }),
});

export const collections = { pages };
