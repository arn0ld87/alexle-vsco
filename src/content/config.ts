import { z, defineCollection } from 'astro:content';

const kiNewsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    lastUpdate: z.string(),
    articles: z.array(z.object({
      title: z.string(),
      summary: z.string(),
      url: z.string().url(),
      source: z.string(),
      publishedAt: z.string(),
      tags: z.array(z.string()),
      relevanceScore: z.number().min(0).max(100)
    })),
    stats: z.object({
      totalFeeds: z.number(),
      totalArticles: z.number(),
      uniqueArticles: z.number(),
      finalArticles: z.number()
    })
  })
});

export const collections = {
  'ki-news': kiNewsCollection
};