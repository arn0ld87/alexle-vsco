const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { scrapeAllFeeds } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Statische Dateien für die Demo
app.use('/demos/ki-news', express.static(path.join(__dirname, '../../public/demos/ki-news')));

// API Endpoint für KI-Nachrichten
app.get('/api/ki-news', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'ki-news-data.json');
    
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      res.json({
        success: true,
        articles: data,
        count: data.length,
        lastUpdated: fs.statSync(dataPath).mtime
      });
    } else {
      res.json({
        success: false,
        message: 'No data available. Run scraper first.',
        articles: []
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reading data',
      error: error.message
    });
  }
});

// Endpoint zum manuellen Scraping
app.post('/api/scrape', async (req, res) => {
  try {
    console.log('Manual scraping triggered...');
    const articles = await scrapeAllFeeds();
    
    res.json({
      success: true,
      message: 'Scraping completed',
      count: articles.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Scraping failed',
      error: error.message
    });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Starte Server
app.listen(PORT, () => {
  console.log(`KI-News API Server running on port ${PORT}`);
  console.log(`API Endpoints:`);
  console.log(`  GET  /api/ki-news - Get KI articles`);
  console.log(`  POST /api/scrape  - Trigger scraping`);
  console.log(`  GET  /api/health  - Health check`);
  console.log(`Demo available at: http://localhost:${PORT}/demos/ki-news/index.html`);
});

// Automatisches Scraping alle 6 Stunden
setInterval(async () => {
  console.log('Auto-scraping triggered...');
  try {
    await scrapeAllFeeds();
    console.log('Auto-scraping completed');
  } catch (error) {
    console.error('Auto-scraping failed:', error);
  }
}, 6 * 60 * 60 * 1000); // 6 Stunden

module.exports = app;
