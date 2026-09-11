/**
 * src/handlers/static.js - Static asset serving
 * Assets embedded as string constants for Workers compatibility
 */

const INDEX_HTML = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n  <meta charset=\"UTF-8\">\r\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n  <meta name=\"description\" content=\"Find accounting and finance job opportunities. Browse high-paying CPA positions from top employers.\">\r\n  <meta name=\"theme-color\" content=\"#0066cc\">\r\n  <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\r\n  <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">\r\n  \r\n  <!-- Open Graph -->\r\n  <meta property=\"og:type\" content=\"website\">\r\n  <meta property=\"og:site_name\" content=\"USA Jobs\">\r\n  <meta property=\"og:locale\" content=\"en_US\">\r\n  \r\n  <!-- Twitter -->\r\n  <meta name=\"twitter:card\" content=\"summary_large_image\">\r\n  \r\n  <title>USA Jobs | Accounting & Finance Jobs</title>\r\n  <link rel=\"canonical\" href=\"https://usajobs.usajobs.workers.dev/\">\r\n  <link rel=\"stylesheet\" href=\"/css/style.css\">\r\n  <link rel=\"icon\" type=\"image/svg+xml\" href=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%230066cc' width='100' height='100'/%3E%3Ctext x='50' y='65' font-size='60' font-weight='bold' fill='white' text-anchor='middle'%3EJ%3C/text%3E%3C/svg%3E\">\r\n  <base href=\"/\">\r\n  <meta name=\"google-site-verification\" content=\"zEgd8iW1JqgWv7knYKK_EgkhdK4bwDpBRPIT5kkdYZg\">\r\n</head>";

const STYLE_CSS = "/* USA JOBS — REJOIN REFERENCE MATCH\r\n   Complete visual redesign to match Rejoin job portal\r\n   Reference: https://preview.sprukomarket.com/html/listing/rejoin/Rejoin/html/index.html\r\n*/";

const APP_JS = "// app.js - USA JOBS Frontend MVP\r\nclass CPAJobsApp {}";

const STATIC_FILES = {
  '/': { content: INDEX_HTML, type: 'text/html; charset=utf-8' },
  '/index.html': { content: INDEX_HTML, type: 'text/html; charset=utf-8' },
  '/css/style.css': { content: STYLE_CSS, type: 'text/css; charset=utf-8' },
  '/js/app.js': { content: APP_JS, type: 'application/javascript; charset=utf-8' },
};

export const serveStatic = (pathname, config) => {
  const file = STATIC_FILES[pathname];
  
  if (file) {
    return new Response(file.content, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  
  if (pathname !== '/') {
    return serveStatic('/', config);
  }
  
  return new Response('Not Found', { status: 404 });
};
