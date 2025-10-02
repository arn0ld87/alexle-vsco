(function () {
  if (!window.CMS) {
    return;
  }

  const CMS = window.CMS;
  const React = CMS.React;
  const h = React.createElement;

  const previewStyles = `
    :root {
      color-scheme: light;
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    body {
      margin: 0;
      background: #f5f5f5;
      color: #0f172a;
    }
    .cms-preview {
      padding: 2.5rem clamp(1.5rem, 3vw, 3rem);
      max-width: 960px;
      margin: 0 auto;
      display: grid;
      gap: 1.75rem;
    }
    .preview-card {
      background: white;
      border-radius: 1rem;
      padding: clamp(1.5rem, 3vw, 2rem);
      box-shadow: 0 10px 35px -25px rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .preview-card h1,
    .preview-card h2,
    .preview-card h3 {
      margin-top: 0;
      color: #0f172a;
    }
    .preview-card p {
      color: #334155;
      line-height: 1.6;
    }
    .preview-grid {
      display: grid;
      gap: 1rem;
    }
    .preview-grid--columns {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .preview-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.75rem;
      border-radius: 999px;
      background: #e2e8f0;
      color: #0f172a;
      font-size: 0.75rem;
      font-weight: 600;
      margin: 0.2rem;
    }
    .preview-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      background: #2563eb;
      color: white;
      font-weight: 600;
      margin-top: 1.25rem;
      width: fit-content;
      box-shadow: 0 15px 30px -20px rgba(37, 99, 235, 0.6);
    }
    .media-preview {
      margin-top: 1.5rem;
      border-radius: 1rem;
      overflow: hidden;
      background: rgba(37, 99, 235, 0.08);
      border: 1px dashed rgba(37, 99, 235, 0.3);
      padding: 1rem;
      text-align: center;
      color: #1d4ed8;
      font-weight: 500;
    }
    .media-preview img,
    .media-preview video {
      width: 100%;
      max-height: 320px;
      object-fit: cover;
      border-radius: 0.75rem;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }
    .stat-card {
      background: #0f172a;
      color: white;
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    }
    .stat-card span {
      display: block;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.65;
      margin-bottom: 0.25rem;
    }
    .stat-card strong {
      font-size: 1.5rem;
      font-weight: 700;
    }
    .cms-markdown {
      margin-top: 1.5rem;
      display: grid;
      gap: 1rem;
      color: #1e293b;
    }
    .cms-markdown h2,
    .cms-markdown h3 {
      color: #0f172a;
    }
    .cms-markdown ul,
    .cms-markdown ol {
      padding-left: 1.25rem;
    }
    .cms-markdown blockquote {
      border-left: 4px solid rgba(37, 99, 235, 0.25);
      padding-left: 1rem;
      color: #475569;
      font-style: italic;
    }
    .preview-list {
      display: grid;
      gap: 1rem;
      padding: 0;
      margin: 0;
      list-style: none;
    }
    .preview-list-item {
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
      background: rgba(248, 250, 252, 0.95);
    }
    .progress {
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.3);
      overflow: hidden;
      margin-top: 0.75rem;
    }
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #22d3ee);
    }
  `;

  CMS.registerPreviewStyle(previewStyles, { raw: true });

  const getData = (entry) => {
    const data = entry && entry.get('data');
    return data && data.toJS ? data.toJS() : {};
  };

  const resolveAsset = (props, path) => {
    if (!path) return null;
    const asset = props.getAsset(path);
    if (asset && typeof asset.toString === 'function') {
      return asset.toString();
    }
    return path;
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('de-DE');
  };

  const HeroPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const mediaUrl = resolveAsset(this.props, data.media);
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--hero' }, [
          h('h1', { key: 'title' }, data.title || 'Hero Titel eingeben'),
          data.subtitle && h('p', { key: 'subtitle' }, data.subtitle),
          data.cta && h('div', { key: 'cta', className: 'preview-button' }, data.cta),
          mediaUrl && h('div', { key: 'media', className: 'media-preview' },
            data.media && data.media.endsWith('.mp4')
              ? h('video', { src: mediaUrl, controls: true })
              : h('img', { src: mediaUrl, alt: data.title || 'Hero Media' })
          )
        ])
      );
    }
  });

  const AboutPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const imageUrl = resolveAsset(this.props, data.profileImage);
      const body = this.props.widgetFor && this.props.widgetFor('body');
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--about' }, [
          h('h1', { key: 'title' }, data.title || 'Titel eingeben'),
          imageUrl && h('div', { key: 'image', className: 'media-preview' },
            h('img', { src: imageUrl, alt: data.profileImageAlt || data.title || 'Profilbild' })
          ),
          body && h('div', { key: 'body', className: 'cms-markdown' }, body)
        ])
      );
    }
  });

  const ServicesPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const items = Array.isArray(data.items) ? data.items : [];
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--services' }, [
          h('h1', { key: 'title' }, 'Services'),
          h('div', { key: 'items', className: 'preview-grid preview-grid--columns' },
            items.length
              ? items.map((item, index) => h('article', { key: index, className: 'preview-list-item' }, [
                  h('h3', { key: 'title' }, item.title || 'Service'),
                  item.description && h('p', { key: 'description' }, item.description),
                  item.tags && item.tags.length && h('div', { key: 'tags' },
                    item.tags.map((tag, tagIndex) => h('span', { key: tagIndex, className: 'preview-badge' }, tag))
                  )
                ]))
              : h('p', { key: 'empty' }, 'Noch keine Services angelegt.')
          )
        ])
      );
    }
  });

  const SkillsPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const items = Array.isArray(data.items) ? data.items : [];
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--skills' }, [
          h('h1', { key: 'title' }, 'Skills'),
          h('div', { key: 'items', className: 'preview-grid preview-grid--columns' },
            items.length
              ? items.map((item, index) => h('article', { key: index, className: 'preview-list-item' }, [
                  h('h3', { key: 'name' }, item.name || 'Skill'),
                  item.category && h('span', { key: 'category', className: 'preview-badge' }, item.category),
                  h('div', { key: 'progress', className: 'progress' },
                    h('div', {
                      className: 'progress-bar',
                      style: { width: `${Math.min(Math.max(item.percentage || 0, 0), 100)}%` }
                    })
                  )
                ]))
              : h('p', { key: 'empty' }, 'Noch keine Skills angelegt.')
          )
        ])
      );
    }
  });

  const ProjectsPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const imageUrl = resolveAsset(this.props, data.heroImage);
      const body = this.props.widgetFor && this.props.widgetFor('body');
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--project' }, [
          h('h1', { key: 'title' }, data.title || 'Projekt Titel'),
          data.summary && h('p', { key: 'summary' }, data.summary),
          (data.repo || data.demo) && h('div', { key: 'links' }, [
            data.repo && h('span', { key: 'repo', className: 'preview-badge' }, 'Repo-Link hinterlegt'),
            data.demo && h('span', { key: 'demo', className: 'preview-badge' }, 'Demo-Link hinterlegt')
          ]),
          imageUrl && h('div', { key: 'image', className: 'media-preview' },
            h('img', { src: imageUrl, alt: data.title || 'Projektbild' })
          ),
          body && h('div', { key: 'body', className: 'cms-markdown' }, body)
        ])
      );
    }
  });

  const LegalPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const body = this.props.widgetFor && this.props.widgetFor('body');
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--legal' }, [
          h('h1', { key: 'title' }, data.title || 'Rechtstext'),
          body && h('div', { key: 'body', className: 'cms-markdown' }, body)
        ])
      );
    }
  });

  const KiNewsPreview = CMS.createClass({
    render() {
      const data = getData(this.props.entry);
      const articles = Array.isArray(data.articles) ? data.articles : [];
      const stats = data.stats || {};
      return h('div', { className: 'cms-preview' },
        h('section', { className: 'preview-card preview-card--ki-news' }, [
          h('h1', { key: 'title' }, 'KI News Feed'),
          data.lastUpdate && h('p', { key: 'updated' }, `Stand: ${formatDateTime(data.lastUpdate)}`),
          h('div', { key: 'stats', className: 'stat-grid' }, [
            h('div', { key: 'totalFeeds', className: 'stat-card' }, [
              h('span', { key: 'label' }, 'Feeds eingelesen'),
              h('strong', { key: 'value' }, stats.totalFeeds ?? '–')
            ]),
            h('div', { key: 'totalArticles', className: 'stat-card' }, [
              h('span', { key: 'label' }, 'Artikel gesamt'),
              h('strong', { key: 'value' }, stats.totalArticles ?? '–')
            ]),
            h('div', { key: 'uniqueArticles', className: 'stat-card' }, [
              h('span', { key: 'label' }, 'Einzigartige Artikel'),
              h('strong', { key: 'value' }, stats.uniqueArticles ?? '–')
            ]),
            h('div', { key: 'finalArticles', className: 'stat-card' }, [
              h('span', { key: 'label' }, 'Kuratierte Artikel'),
              h('strong', { key: 'value' }, stats.finalArticles ?? '–')
            ])
          ]),
          h('ul', { key: 'articles', className: 'preview-list' },
            articles.length
              ? articles.map((article, index) => h('li', { key: index, className: 'preview-list-item' }, [
                  h('h3', { key: 'title' }, article.title || 'Artikel Titel'),
                  article.summary && h('p', { key: 'summary' }, article.summary),
                  h('div', { key: 'meta' }, [
                    article.source && h('span', { key: 'source', className: 'preview-badge' }, article.source),
                    article.publishedAt && h('span', { key: 'date', className: 'preview-badge' }, formatDateTime(article.publishedAt)),
                    typeof article.relevanceScore === 'number' && h('span', { key: 'score', className: 'preview-badge' }, `Score: ${article.relevanceScore}`)
                  ]),
                  article.tags && article.tags.length && h('div', { key: 'tags' },
                    article.tags.map((tag, tagIndex) => h('span', { key: tagIndex, className: 'preview-badge' }, tag))
                  )
                ]))
              : h('li', { key: 'empty', className: 'preview-list-item' }, 'Noch keine Artikel vorhanden.')
          )
        ])
      );
    }
  });

  CMS.registerPreviewTemplate('hero', HeroPreview);
  CMS.registerPreviewTemplate('about', AboutPreview);
  CMS.registerPreviewTemplate('services', ServicesPreview);
  CMS.registerPreviewTemplate('skills', SkillsPreview);
  CMS.registerPreviewTemplate('projects', ProjectsPreview);
  CMS.registerPreviewTemplate('legal', LegalPreview);
  CMS.registerPreviewTemplate('ki-news', KiNewsPreview);

  CMS.init();
})();
