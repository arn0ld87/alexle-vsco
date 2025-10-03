import type { APIRoute } from 'astro';
import Parser from 'rss-parser';

const parser = new Parser();

// RSS-Feeds für KI-Nachrichten (nur funktionierende)
const rssFeeds = [
  // Deutsche Quellen
  { url: 'https://www.heise.de/rss/heise.rdf', name: 'Heise', language: 'de' },
  { url: 'https://www.golem.de/rss.php', name: 'Golem', language: 'de' },
  
  // Internationale KI-Quellen
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI', language: 'en' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Technology Review', language: 'en' },
  { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog', language: 'en' },
  { url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', name: 'ZDNet AI', language: 'en' },
  
  // Weitere funktionierende Quellen
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF', name: 'VentureBeat', language: 'en' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', language: 'en' }
];

// KI-relevante Keywords für Filterung
const kiKeywords = [
  'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
  'künstliche intelligenz', 'maschinelles lernen', 'neuronales netzwerk',
  'gpt', 'chatgpt', 'openai', 'anthropic', 'claude', 'gemini',
  'computer vision', 'natural language processing', 'nlp', 'ai', 'ki',
  'robotics', 'autonomous', 'algorithm', 'algorithmus'
];

function extractThumbnail(item: any) {
  // Versuche verschiedene Methoden für Thumbnail-Extraktion
  
  // 1. Enclosure (RSS Standard)
  if (item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  // 2. Media Content (Media RSS)
  if (item['media:content']?.[0]?.['$']?.url) {
    return item['media:content'][0]['$'].url;
  }
  
  // 3. Media Thumbnail (Media RSS)
  if (item['media:thumbnail']?.['$']?.url) {
    return item['media:thumbnail']['$'].url;
  }
  
  // 4. Suche nach Bildern im Content
  const content = item.content || item.contentSnippet || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  // 5. Suche nach Bildern mit verschiedenen Attributen
  const imgMatch2 = content.match(/<img[^>]+src='([^']+)'/i);
  if (imgMatch2) {
    return imgMatch2[1];
  }
  
  // 6. Default Thumbnail basierend auf Quelle
  const defaultThumbnails: Record<string, string> = {
    'Heise': '/media/alex-gemini.png',
    'Golem': '/media/alex-gemini.png',
    'TechCrunch AI': '/media/alex-gemini.png',
    'OpenAI Blog': '/media/alex-gemini.png',
    'ZDNet AI': '/media/alex-gemini.png',
    'MIT Technology Review': '/media/alex-gemini.png',
    'VentureBeat': '/media/alex-gemini.png',
    'Wired': '/media/alex-gemini.png'
  };
  
  return defaultThumbnails[item.source] || '/media/default-news.png';
}

function categorizeArticle(text: string) {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('gpt') || lowerText.includes('chatgpt') || lowerText.includes('openai')) {
    return 'Large Language Models';
  }
  if (lowerText.includes('computer vision') || lowerText.includes('image') || lowerText.includes('visual')) {
    return 'Computer Vision';
  }
  if (lowerText.includes('robotics') || lowerText.includes('robot') || lowerText.includes('autonomous')) {
    return 'Robotics';
  }
  if (lowerText.includes('machine learning') || lowerText.includes('deep learning') || lowerText.includes('neural')) {
    return 'Machine Learning';
  }
  if (lowerText.includes('nlp') || lowerText.includes('natural language') || lowerText.includes('language model')) {
    return 'Natural Language Processing';
  }
  
  return 'Artificial Intelligence';
}

async function scrapeRSSFeed(feed: any) {
  try {
    console.log(`Scraping ${feed.name}...`);
    const feedData = await parser.parseURL(feed.url);
    
    const articles = feedData.items
      .filter((item: any) => {
        // Filtere nach KI-relevanten Artikeln
        const title = item.title?.toLowerCase() || '';
        const description = item.contentSnippet?.toLowerCase() || item.content?.toLowerCase() || '';
        const combined = `${title} ${description}`;
        
        return kiKeywords.some(keyword => combined.includes(keyword.toLowerCase()));
      })
      .slice(0, 5) // Maximal 5 Artikel pro Feed
      .map((item: any) => ({
        title: item.title,
        link: item.link,
        description: item.contentSnippet || item.content?.substring(0, 200) + '...',
        pubDate: item.pubDate,
        source: feed.name,
        language: feed.language,
        thumbnail: extractThumbnail(item),
        category: categorizeArticle(item.title + ' ' + item.contentSnippet)
      }));
    
    return articles;
  } catch (error) {
    console.error(`Error scraping ${feed.name}:`, error);
    return [];
  }
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const allArticles = [];
    
    // Scrape alle Feeds
    for (const feed of rssFeeds) {
      const articles = await scrapeRSSFeed(feed);
      allArticles.push(...articles);
      
      // Kleine Pause zwischen Requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Sortiere nach Datum (neueste zuerst)
    allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    // Bevorzuge deutsche Artikel
    const germanArticles = allArticles.filter(article => article.language === 'de');
    const englishArticles = allArticles.filter(article => article.language === 'en');
    
    // Mische deutsche und englische Artikel (deutsche bevorzugt)
    const mixedArticles = [];
    const maxArticles = 20;
    
    for (let i = 0; i < Math.min(maxArticles, germanArticles.length + englishArticles.length); i++) {
      if (i < germanArticles.length) {
        mixedArticles.push(germanArticles[i]);
      }
      if (mixedArticles.length < maxArticles && i < englishArticles.length) {
        mixedArticles.push(englishArticles[i]);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      articles: mixedArticles,
      count: mixedArticles.length,
      germanCount: germanArticles.length,
      englishCount: englishArticles.length,
      lastUpdated: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 Minuten Cache
      }
    });
    
  } catch (error) {
    console.error('Error in KI-News API:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Error fetching KI news',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
