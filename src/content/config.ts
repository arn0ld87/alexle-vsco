import { z, defineCollection } from 'astro:content';

const hero = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    cta: z.string().optional(),
    media: z.string().optional()
  })
});

const services = defineCollection({
  type: 'data',
  schema: z.object({
    items: z.array(z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
      tags: z.array(z.string()).optional()
    }))
  })
});

const skills = defineCollection({
  type: 'data',
  schema: z.object({
    items: z.array(z.object({
      name: z.string(),
      percentage: z.number().int().min(0).max(100),
      category: z.string().optional()
    }))
  })
});

const about = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() })
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().optional(),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
    repo: z.string().optional(),
    demo: z.string().optional()
  })
});

const legal = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string() })
});

export const collections = { hero, services, skills, about, projects, legal };
