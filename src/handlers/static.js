/**
 * src/handlers/static.js - Static asset serving
 * Files embedded at build time via Wrangler bundler
 */

// Static file contents will be injected by build process
// For now, serve from memory using proper Response API
export const serveStatic = async (pathname, config) => {
  // For Cloudflare Workers, static files must be handled differently
  // Option 1: Use Workers Sites (wrangler.toml [site] config)
  // Option 2: Use Assets binding (recommended for new projects)
  // Option 3: Embed directly (for small files only)
  
  // For now, fetch from actual static URLs
  // This will be replaced with proper asset serving
  const staticPaths = {
    '/': '/index.html',
    '/index.html': '/index.html',
    '/css/style.css': '/css/style.css',
    '/js/app.js': '/js/app.js',
  };
  
  const filePath = staticPaths[pathname];
  
  if (filePath) {
    // In Workers, we need to either:
    // 1. Use KV for caching static assets
    // 2. Use Workers Sites
    // 3. Return inline content (for critical files only)
    
    // For MVP: Return minimal inline HTML for homepage
    if (filePath === '/index.html') {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>USA Jobs | Accounting & Finance Opportunities</title>
  <link rel="stylesheet" href="/css/style.css">
  <link rel="canonical" href="https://${config.canonicalHostname}/">
</head>
<body>
  <header role="banner">
    <nav class="nav" role="navigation">
      <a href="/" class="logo">USA JOBS</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/jobs/">Browse Jobs</a>
      </div>
    </nav>
  </header>
  
  <main id="app" role="main">
    <div class="loading">Loading...</div>
  </main>
  
  <footer role="contentinfo">
    <p>&copy; 2026 USA Jobs. Discover accounting and finance opportunities.</p>
  </footer>
  
  <script src="/js/app.js"></script>
</body>
</html>`;
      
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // For CSS and JS, check KV cache first
    if (config.kv) {
      const cachedContent = await config.kv.get(`static:${filePath}`);
      if (cachedContent) {
        const contentType = filePath.endsWith('.css') 
          ? 'text/css; charset=utf-8'
          : 'application/javascript; charset=utf-8';
        
        return new Response(cachedContent, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      }
    }
  }
  
  return new Response('Not Found', { status: 404 });
};
