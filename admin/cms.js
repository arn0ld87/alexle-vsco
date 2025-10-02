const bootstrapCms = () => {
  const cms = window.CMS;
  if (!cms) {
    console.error('Decap CMS konnte nicht geladen werden.');
    return;
  }

  const h = window.h || window.React?.createElement;
  if (!h) {
    console.error('Kein JSX/React Renderer verfügbar.');
    return;
  }

  const baseStyles = {
    fontFamily: "'Inter', system-ui, sans-serif",
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    padding: '32px',
    boxSizing: 'border-box',
    lineHeight: 1.6,
  };

  const sectionStyles = {
    marginBottom: '32px',
    padding: '24px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(14,165,233,0.08))',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.35)'
  };

  const headline = (text, level = 'h2') =>
    h(level, { style: { margin: '0 0 12px', fontWeight: 600 } }, text);

  const paragraph = (text, extra = {}) =>
    h('p', { style: { margin: '0 0 12px', color: '#cbd5f5', ...extra } }, text);

  const toJS = (entry, path = ['data']) => {
    const data = entry.getIn(path);
    return data && typeof data.toJS === 'function' ? data.toJS() : data;
  };

  cms.registerPreviewStyle(
    `:root { color-scheme: dark; }
     body { font-family: 'Inter', system-ui, sans-serif; background: #020617; color: #e2e8f0; }
     a { color: #38bdf8; }
     .cms-preview-card { display: block; padding: 18px; border-radius: 16px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(148, 163, 184, 0.2); margin-bottom: 16px; }
     table { width: 100%; border-collapse: collapse; }
     th, td { padding: 10px 12px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); text-align: left; }
    `,
    { raw: true }
  );

  cms.registerPreviewTemplate('hero', ({ entry }) => {
    const data = toJS(entry) || {};
    const media = data.media;
    const cta = data.cta;
    return h(
      'div',
      { style: baseStyles },
      h(
        'section',
        { style: { ...sectionStyles, display: 'grid', gap: '24px', alignItems: 'center' } },
        [
          h('div', { key: 'copy' }, [
            paragraph('IT-Systemintegration & DevOps', { textTransform: 'uppercase', letterSpacing: '0.35em', fontSize: '0.75rem', color: '#60a5fa' }),
            headline(data.title || 'Hero Titel'),
            data.subtitle ? paragraph(data.subtitle) : null,
            cta
              ? h(
                  'a',
                  {
                    href: data.ctaHref || '/projekte/',
                    style: {
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '18px',
                      padding: '12px 22px',
                      borderRadius: '999px',
                      background: '#2563eb',
                      color: '#f8fafc',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase'
                    }
                  },
                  [cta, h('span', { 'aria-hidden': 'true' }, '→')]
                )
              : null
          ]),
          media
            ? h(
                'div',
                {
                  key: 'media',
                  style: {
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: 'rgba(15, 23, 42, 0.7)',
                  }
                },
                [
                  media.endsWith('.mp4')
                    ? h('video', { src: media, controls: true, style: { width: '100%', display: 'block' } })
                    : h('img', { src: media, alt: '', style: { width: '100%', display: 'block' } })
                ]
              )
            : null
        ]
      )
    );
  });

  cms.registerPreviewTemplate('about', ({ entry, widgetFor }) => {
    const data = toJS(entry) || {};
    return h('div', { style: baseStyles }, [
      h('section', { style: sectionStyles }, [
        headline(data.title || 'Über mich'),
        data.profileImage
          ? h('img', {
              src: data.profileImage,
              alt: data.profileImageAlt || '',
              style: { width: '160px', borderRadius: '999px', marginBottom: '20px' }
            })
          : null,
        widgetFor('body')
      ])
    ]);
  });

  cms.registerPreviewTemplate('services', ({ entry }) => {
    const data = toJS(entry) || {};
    const items = data?.items || [];
    return h('div', { style: baseStyles }, [
      h('section', { style: sectionStyles }, [
        headline('Leistungen'),
        h(
          'div',
          {
            style: {
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
            }
          },
          items.map((service, index) =>
            h('article', { className: 'cms-preview-card', key: index }, [
              h('h3', { style: { marginTop: 0, marginBottom: '8px' } }, service.title || 'Neuer Service'),
              paragraph(service.description || ''),
              service.tags && service.tags.length
                ? h(
                    'ul',
                    {
                      style: {
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        listStyle: 'none',
                        padding: 0,
                        margin: '12px 0 0'
                      }
                    },
                    service.tags.map((tag, tagIndex) =>
                      h(
                        'li',
                        {
                          key: tagIndex,
                          style: {
                            padding: '4px 10px',
                            borderRadius: '999px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            fontSize: '0.75rem'
                          }
                        },
                        tag
                      )
                    )
                  )
                : null
            ])
          )
        )
      ])
    ]);
  });

  cms.registerPreviewTemplate('skills', ({ entry }) => {
    const data = toJS(entry) || {};
    const items = data?.items || [];
    return h('div', { style: baseStyles }, [
      h('section', { style: sectionStyles }, [
        headline('Skills & Expertise'),
        ...items.map((skill, index) =>
          h('div', { className: 'cms-preview-card', key: index }, [
            h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' } }, [
              h('strong', null, skill.name || 'Skill'),
              h('span', { style: { color: '#94a3b8' } }, `${skill.percentage ?? 0}%`)
            ]),
            skill.category ? paragraph(skill.category, { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }) : null,
            h('div', { style: { height: '6px', borderRadius: '999px', background: 'rgba(148,163,184,0.25)' } }, [
              h('div', {
                style: {
                  height: '100%',
                  borderRadius: '999px',
                  background: '#3b82f6',
                  width: `${Math.min(Math.max(skill.percentage || 0, 0), 100)}%`
                }
              })
            ])
          ])
        )
      ])
    ]);
  });

  cms.registerPreviewTemplate('projects', ({ entry, widgetFor }) => {
    const data = toJS(entry) || {};
    const tags = data?.tags || [];
    return h('div', { style: baseStyles }, [
      h('article', { style: sectionStyles }, [
        data.heroImage
          ? h('img', { src: data.heroImage, alt: '', style: { width: '100%', borderRadius: '16px', marginBottom: '18px' } })
          : null,
        headline(data.title || 'Projekt Titel', 'h1'),
        data.summary ? paragraph(data.summary) : null,
        tags.length
          ? h(
              'ul',
              {
                style: {
                  display: 'flex',
                  listStyle: 'none',
                  gap: '8px',
                  padding: 0,
                  margin: '0 0 16px'
                }
              },
              tags.map((tag, index) =>
                h(
                  'li',
                  {
                    key: index,
                    style: {
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(59, 130, 246, 0.2)',
                      fontSize: '0.75rem'
                    }
                  },
                  tag
                )
              )
            )
          : null,
        widgetFor('body')
      ])
    ]);
  });

  cms.registerPreviewTemplate('legal', ({ entry, widgetFor }) => {
    const data = toJS(entry) || {};
    return h('div', { style: baseStyles }, [
      h('section', { style: sectionStyles }, [
        headline(data.title || 'Rechtstext', 'h1'),
        data.description ? paragraph(data.description) : null,
        widgetFor('body')
      ])
    ]);
  });

  cms.registerPreviewTemplate('ki-news', ({ entry }) => {
    const data = toJS(entry) || {};
    const articles = data?.articles || [];
    const stats = data?.stats || {};
    return h('div', { style: baseStyles }, [
      h('section', { style: sectionStyles }, [
        headline('KI-News Feed'),
        data.lastUpdate ? paragraph(`Stand: ${new Date(data.lastUpdate).toLocaleString('de-DE')}`) : null,
        h('div', { className: 'cms-preview-card' }, [
          headline('Statistiken', 'h3'),
          paragraph(`Feeds: ${stats.totalFeeds ?? '–'}`),
          paragraph(`Artikel gesamt: ${stats.totalArticles ?? '–'}`),
          paragraph(`Einzigartige Artikel: ${stats.uniqueArticles ?? '–'}`),
          paragraph(`Finale Artikel: ${stats.finalArticles ?? '–'}`)
        ]),
        h('table', { key: 'table' }, [
          h('thead', null, [
            h('tr', null, [
              h('th', null, 'Titel'),
              h('th', null, 'Quelle'),
              h('th', null, 'Datum'),
              h('th', null, 'Relevanz')
            ])
          ]),
          h(
            'tbody',
            null,
            articles.map((article, index) =>
              h('tr', { key: index }, [
                h('td', null, article.title || 'Artikel'),
                h('td', null, article.source || '–'),
                h('td', null, article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('de-DE') : '–'),
                h('td', null, article.relevanceScore ?? '–')
              ])
            )
          )
        ])
      ])
    ]);
  });

  cms.init();
};

const waitForCms = () => {
  if (window.CMS) {
    bootstrapCms();
  } else {
    setTimeout(waitForCms, 50);
  }
};

waitForCms();
