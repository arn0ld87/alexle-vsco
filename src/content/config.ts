import { defineCollection, z } from 'astro:content';

const heroCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    cta: z.string().optional(),
    ctaHref: z.string().optional(),
    media: z.string().optional()
  })
});

const aboutCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    profileImage: z.string().optional(),
    profileImageAlt: z.string().optional(),
    description: z.string().optional()
  })
});

const servicesCollection = defineCollection({
  type: 'data',
  schema: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
        color: z.string().optional(),
        tags: z.array(z.string()).optional()
      })
    )
  })
});

const skillsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        percentage: z.number().min(0).max(100),
        category: z.string().optional()
      })
    )
  })
});

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string().optional(),
    tags: z.array(z.string()).optional(),
    heroImage: z.string().optional(),
    repo: z.string().optional(),
    demo: z.string().optional()
  })
});

const legalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional()
  })
});

const kiNewsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    lastUpdate: z.string(),
    articles: z.array(
      z.object({
        title: z.string(),
        summary: z.string(),
        url: z.string().url(),
        source: z.string(),
        publishedAt: z.string(),
        tags: z.array(z.string()).optional(),
        relevanceScore: z.number().min(0).max(100),
        language: z.string().optional(),
        priority: z.number().optional()
      })
    ),
    stats: z.object({
      totalFeeds: z.number(),
      totalArticles: z.number(),
      uniqueArticles: z.number(),
      finalArticles: z.number()
    })
  })
});

export const collections = {
  hero: heroCollection,
  about: aboutCollection,
  services: servicesCollection,
  skills: skillsCollection,
  projects: projectsCollection,
  legal: legalCollection,
  'ki-news': kiNewsCollection
};
