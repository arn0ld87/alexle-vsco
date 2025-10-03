/**
 * Decap CMS GitHub OAuth Provider für Cloudflare Workers
 * 
 * Dieser Worker ermöglicht die OAuth-Authentifizierung für Decap CMS
 * ohne eigenen Server. Er läuft auf Cloudflare's Edge Network.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS Headers für alle Responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://www.alexle135.de',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // OAuth Authorization Endpoint
    if (url.pathname === '/auth') {
      const clientId = env.GITHUB_CLIENT_ID;
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user`;
      
      return Response.redirect(authUrl, 302);
    }

    // OAuth Callback Endpoint
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      
      if (!code) {
        return new Response('Missing code parameter', { 
          status: 400,
          headers: corsHeaders 
        });
      }

      try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }

        // Return HTML that sends token back to opener window
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 1rem;
                backdrop-filter: blur(10px);
              }
              .success-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
              }
              h1 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
              }
              p {
                margin: 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✓</div>
              <h1>Authentifizierung erfolgreich!</h1>
              <p>Dieses Fenster wird automatisch geschlossen...</p>
            </div>
            <script>
              (function() {
                function receiveMessage(e) {
                  window.opener.postMessage(
                    'authorization:github:success:' + JSON.stringify({
                      token: '${tokenData.access_token}',
                      provider: 'github'
                    }),
                    e.origin
                  );
                  window.removeEventListener('message', receiveMessage, false);
                }
                window.addEventListener('message', receiveMessage, false);
                window.opener.postMessage('authorizing:github', '*');
                setTimeout(function() { window.close(); }, 1000);
              })();
            </script>
          </body>
          </html>
        `;

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders,
          },
        });
      } catch (error) {
        console.error('OAuth error:', error);
        
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
              }
              .container {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 1rem;
                backdrop-filter: blur(10px);
                max-width: 500px;
              }
              .error-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
              }
              h1 {
                margin: 0 0 0.5rem 0;
                font-size: 1.5rem;
              }
              p {
                margin: 0.5rem 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error-icon">✗</div>
              <h1>Authentifizierung fehlgeschlagen</h1>
              <p>${error.message}</p>
              <p style="margin-top: 1rem; font-size: 0.875rem;">
                Bitte schließe dieses Fenster und versuche es erneut.
              </p>
            </div>
          </body>
          </html>
        `;

        return new Response(errorHtml, {
          status: 500,
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders,
          },
        });
      }
    }

    // Success endpoint (optional status check)
    if (url.pathname === '/success') {
      return new Response(JSON.stringify({ 
        status: 'ok',
        message: 'OAuth provider is running' 
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Default response
    return new Response('Decap CMS OAuth Provider\n\nEndpoints:\n- /auth\n- /callback\n- /success', {
      headers: {
        'Content-Type': 'text/plain',
        ...corsHeaders,
      },
    });
  },
};
