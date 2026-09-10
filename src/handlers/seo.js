/**
 * src/handlers/seo.js - SEO-related handlers (sitemap, robots)
 */

import { normalizeSlug, normalizeCategorySlug, generateJobPermalink } from '../core/seo.js';

export const generateSitemap = async (config, canonicalHostname) => {
  try {
    const baseUrl = `https://${canonicalHostname}`;
    
    // Fetch active jobs
    const result = await config.db.prepare(
      'SELECT id, title FROM offers WHERE status = ? ORDER BY created_at DESC'
    ).bind('active').all();
    
    const jobs = result.results || [];
    
    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Static URLs
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/jobs/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';
    
    // Category landing pages
    const categoriesResult = await config.db.prepare(
      'SELECT DISTINCT category FROM offers WHERE status = "active"'
    ).all();
    
    const categories = categoriesResult.results || [];
    for (const catRow of categories) {
      if (catRow.category) {
        const categorySlug = normalizeCategorySlug(catRow.category);
        const countResult = await config.db.prepare(
          'SELECT COUNT(*) as count FROM offers WHERE status = "active" AND category = ?'
        ).bind(catRow.category).first();
        
        if (countResult && countResult.count > 0) {
          xml += '  <url>\n';
          xml += `    <loc>${baseUrl}/jobs/category/${categorySlug}</loc>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        }
      }
    }
    
    // Job detail URLs
    for (const job of jobs) {
      const url = generateJobPermalink(job, baseUrl);
      if (url) {
        xml += '  <url>\n';
        xml += `    <loc>${url}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    }
    
    xml += '</urlset>';
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('generateSitemap error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
};

export const serveRobotsTxt = (canonicalHostname) => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /jobs/

Sitemap: https://${canonicalHostname}/sitemap.xml
`;
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
