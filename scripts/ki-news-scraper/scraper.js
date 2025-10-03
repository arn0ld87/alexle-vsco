const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser();

// RSS-Feeds für KI-Nachrichten (deutsche + internationale)
const rssFeeds = [
  // Deutsche Quellen
  { url: 'https://www.heise.de/rss/heise.rdf', name: 'Heise', language: 'de' },
  { url: 'https://www.golem.de/rss.php', name: 'Golem', language: 'de' },
  { url: 'https://www.computerwoche.de/rss', name: 'Computerwoche', language: 'de' },
  
  // Internationale KI-Quellen
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', name: 'TechCrunch AI', language: 'en' },
  { url: 'https://venturebeat.com/ai/feed/', name: 'VentureBeat AI', language: 'en' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Technology Review', language: 'en' },
  
  // KI-spezifische Blogs
  { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog', language: 'en' },
  { url: 'https://www.anthropic.com/news/rss', name: 'Anthropic News', language: 'en' },
  { url: 'https://ai.googleblog.com/feeds/posts/default', name: 'Google AI Blog', language: 'en' },
  
  // Weitere Quellen
  { url: 'https://www.theverge.com/ai-artificial-intelligence/rss/index.xml', name: 'The Verge AI', language: 'en' },
  { url: 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', name: 'ZDNet AI', language: 'en' }
];

// KI-relevante Keywords für Filterung
const kiKeywords = [
  'artificial intelligence', 'machine learning', 'deep learning', 'neural network',
  'künstliche intelligenz', 'maschinelles lernen', 'neuronales netzwerk',
  'gpt', 'chatgpt', 'openai', 'anthropic', 'claude', 'gemini',
  'computer vision', 'natural language processing', 'nlp', 'ai', 'ki',
  'robotics', 'autonomous', 'algorithm', 'algorithmus'
];

async function scrapeRSSFeed(feed) {
  try {
    console.log(`Scraping ${feed.name}...`);
    const feedData = await parser.parseURL(feed.url);
    
    const articles = feedData.items
      .filter(item => {
        // Filtere nach KI-relevanten Artikeln
        const title = item.title?.toLowerCase() || '';
        const description = item.contentSnippet?.toLowerCase() || item.content?.toLowerCase() || '';
        const combined = `${title} ${description}`;
        
        return kiKeywords.some(keyword => combined.includes(keyword.toLowerCase()));
      })
      .slice(0, 5) // Maximal 5 Artikel pro Feed
      .map(item => ({
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
    console.error(`Error scraping ${feed.name}:`, error.message);
    return [];
  }
}

function extractThumbnail(item) {
  // Versuche verschiedene Methoden für Thumbnail-Extraktion
  if (item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  if (item['media:content']?.[0]?.['$']?.url) {
    return item['media:content'][0]['$'].url;
  }
  
  // Fallback: Suche nach Bildern im Content
  const content = item.content || item.contentSnippet || '';
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch) {
    return imgMatch[1];
  }
  
  // Default Thumbnail basierend auf Quelle
  const defaultThumbnails = {
    'Heise': '/media/heise-logo.png',
    'Golem': '/media/golem-logo.png',
    'TechCrunch AI': '/media/techcrunch-logo.png',
    'OpenAI Blog': '/media/openai-logo.png',
    'Google AI Blog': '/media/google-logo.png'
  };
  
  return defaultThumbnails[item.source] || '/media/default-news.png';
}

function categorizeArticle(text) {
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

async function scrapeAllFeeds() {
  console.log('Starting KI-News scraping...');
  
  const allArticles = [];
  
  for (const feed of rssFeeds) {
    const articles = await scrapeRSSFeed(feed);
    allArticles.push(...articles);
    
    // Kleine Pause zwischen Requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Sortiere nach Datum (neueste zuerst)
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
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
  
  // Speichere als JSON
  const outputPath = path.join(__dirname, 'ki-news-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(mixedArticles, null, 2));
  
  console.log(`Scraped ${mixedArticles.length} KI articles`);
  console.log(`German articles: ${germanArticles.length}`);
  console.log(`English articles: ${englishArticles.length}`);
  console.log(`Data saved to: ${outputPath}`);
  
  return mixedArticles;
}

// Führe das Scraping aus
if (require.main === module) {
  scrapeAllFeeds().catch(console.error);
}

module.exports = { scrapeAllFeeds };
