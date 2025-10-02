#!/usr/bin/env node

/**
 * KI-Nachrichten Scraper
 * Sammelt echte Nachrichten von verschiedenen KI-Publikationen
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RSS-Feeds von führenden KI-Publikationen
const RSS_FEEDS = [
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/blog/rss.xml',
    category: 'OpenAI'
  },
  {
    name: 'Google AI Blog',
    url: 'https://ai.googleblog.com/feeds/posts/default',
    category: 'Google'
  },
  {
    name: 'Anthropic Blog',
    url: 'https://www.anthropic.com/news/rss.xml',
    category: 'Anthropic'
  },
  {
    name: 'Microsoft AI Blog',
    url: 'https://blogs.microsoft.com/ai/feed/',
    category: 'Microsoft'
  },
  {
    name: 'Meta AI Blog',
    url: 'https://ai.meta.com/blog/rss.xml',
    category: 'Meta'
  },
  {
    name: 'DeepMind Blog',
    url: 'https://deepmind.com/blog/rss.xml',
    category: 'DeepMind'
  },
  {
    name: 'Hugging Face Blog',
    url: 'https://huggingface.co/blog/rss.xml',
    category: 'Hugging Face'
  },
  {
    name: 'AI News',
    url: 'https://www.artificialintelligence-news.com/feed/',
    category: 'AI News'
  },
  {
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/ai/feed/',
    category: 'VentureBeat'
  },
  {
    name: 'MIT Technology Review AI',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    category: 'MIT'
  }
];

// KI-relevante Keywords für Filterung
const KI_KEYWORDS = [
  'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
  'AI', 'ML', 'GPT', 'ChatGPT', 'OpenAI', 'Claude', 'Gemini', 'LLM', 'transformer',
  'computer vision', 'natural language processing', 'NLP', 'robotics', 'automation',
  'reinforcement learning', 'generative AI', 'diffusion model', 'stable diffusion',
  'midjourney', 'dall-e', 'copilot', 'assistant', 'agent', 'autonomous'
];

/**
 * Fetch RSS Feed Content
 */
async function fetchRSSFeed(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      console.error(`Fehler beim Laden von ${url}:`, err.message);
      reject(err);
    });
  });
}

/**
 * Parse RSS XML to extract articles
 */
function parseRSSFeed(xmlContent, source) {
  const articles = [];
  
  try {
    // Einfache XML-Parsing für RSS-Feeds
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g;
    const linkRegex = /<link>(.*?)<\/link>/g;
    const descriptionRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/g;
    const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/g;
    
    const titles = [...xmlContent.matchAll(titleRegex)];
    const links = [...xmlContent.matchAll(linkRegex)];
    const descriptions = [...xmlContent.matchAll(descriptionRegex)];
    const pubDates = [...xmlContent.matchAll(pubDateRegex)];
    
    for (let i = 0; i < Math.min(titles.length, links.length, descriptions.length); i++) {
      const title = titles[i][1] || titles[i][2] || '';
      const link = links[i][1] || '';
      const description = descriptions[i][1] || descriptions[i][2] || '';
      const pubDate = pubDates[i] ? pubDates[i][1] : new Date().toISOString();
      
      // Filtere nur KI-relevante Artikel
      if (isKIRelevant(title, description)) {
        articles.push({
          title: cleanText(title),
          summary: cleanText(description).substring(0, 200) + '...',
          url: link,
          source: source.name,
          publishedAt: new Date(pubDate).toISOString().split('T')[0],
          tags: extractTags(title, description),
          relevanceScore: calculateRelevanceScore(title, description)
        });
      }
    }
  } catch (error) {
    console.error(`Fehler beim Parsen von ${source.name}:`, error.message);
  }
  
  return articles;
}

/**
 * Check if article is KI-relevant
 */
function isKIRelevant(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  return KI_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()));
}

/**
 * Extract relevant tags from article
 */
function extractTags(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  const tags = [];
  
  const tagMap = {
    'openai': ['openai', 'gpt', 'chatgpt'],
    'google': ['google', 'gemini', 'deepmind'],
    'anthropic': ['anthropic', 'claude'],
    'microsoft': ['microsoft', 'copilot'],
    'meta': ['meta', 'llama'],
    'machine learning': ['machine learning', 'ml'],
    'deep learning': ['deep learning', 'neural network'],
    'computer vision': ['computer vision', 'cv'],
    'nlp': ['natural language processing', 'nlp'],
    'robotics': ['robotics', 'robot']
  };
  
  for (const [tag, keywords] of Object.entries(tagMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      tags.push(tag);
    }
  }
  
  return tags.slice(0, 3); // Maximal 3 Tags
}

/**
 * Calculate relevance score
 */
function calculateRelevanceScore(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  let score = 0;
  
  // Höhere Gewichtung für Titel
  const titleText = title.toLowerCase();
  KI_KEYWORDS.forEach(keyword => {
    if (titleText.includes(keyword.toLowerCase())) {
      score += 3;
    }
  });
  
  // Normale Gewichtung für Beschreibung
  KI_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword.toLowerCase())) {
      score += 1;
    }
  });
  
  return Math.min(Math.max(score * 5, 60), 100); // Score zwischen 60-100
}

/**
 * Clean text content
 */
function cleanText(text) {
  return text
    .replace(/<[^>]*>/g, '') // HTML-Tags entfernen
    .replace(/&[^;]+;/g, ' ') // HTML-Entities entfernen
    .replace(/\s+/g, ' ') // Mehrfache Leerzeichen
    .trim();
}

/**
 * Remove duplicates based on title similarity
 */
function removeDuplicates(articles) {
  const unique = [];
  const seen = new Set();
  
  for (const article of articles) {
    const normalizedTitle = article.title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      unique.push(article);
    }
  }
  
  return unique;
}

/**
 * Main scraping function
 */
async function scrapeKINews() {
  console.log('🤖 Starte KI-Nachrichten Scraping...');
  
  const allArticles = [];
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 Lade ${feed.name}...`);
      const xmlContent = await fetchRSSFeed(feed.url);
      const articles = parseRSSFeed(xmlContent, feed);
      
      console.log(`✅ ${articles.length} Artikel von ${feed.name}`);
      allArticles.push(...articles);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Fehler bei ${feed.name}:`, error.message);
    }
  }
  
  // Duplikate entfernen und nach Relevanz sortieren
  const uniqueArticles = removeDuplicates(allArticles);
  const sortedArticles = uniqueArticles
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 20); // Top 20 Artikel
  
  console.log(`🎯 ${sortedArticles.length} relevante Artikel gefunden`);
  
  // Speichere Ergebnisse
  const outputPath = path.join(__dirname, '..', 'src', 'content', 'ki-news', 'index.json');
  const outputData = {
    lastUpdate: new Date().toISOString(),
    articles: sortedArticles,
    stats: {
      totalFeeds: RSS_FEEDS.length,
      totalArticles: allArticles.length,
      uniqueArticles: uniqueArticles.length,
      finalArticles: sortedArticles.length
    }
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`💾 Artikel gespeichert in ${outputPath}`);
  
  return outputData;
}

// Führe Scraping aus wenn Script direkt aufgerufen wird
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeKINews()
    .then(() => {
      console.log('✅ KI-Nachrichten Scraping abgeschlossen!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fehler beim Scraping:', error);
      process.exit(1);
    });
}

export { scrapeKINews };
