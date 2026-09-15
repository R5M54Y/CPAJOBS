/**
 * src/handlers/seo.js - SEO-related handlers (sitemap index, child sitemaps, robots)
 */

import { normalizeSlug, normalizeCategorySlug, generateJobPermalink } from '../core/seo.js';

/**
 * XML escape helper
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sitemap Index - /sitemap.xml
 * Returns a sitemap index pointing to child sitemaps
 */
export const generateSitemapIndex = (canonicalHostname) => {
  const baseUrl = `https://${canonicalHostname}`;
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  xml += '  <sitemap>\n';
  xml += `    <loc>${escapeXml(baseUrl)}/sitemap-pages.xml</loc>\n`;
  xml += '  </sitemap>\n';
  
  xml += '  <sitemap>\n';
  xml += `    <loc>${escapeXml(baseUrl)}/sitemap-jobs.xml</loc>\n`;
  xml += '  </sitemap>\n';
  
  xml += '</sitemapindex>';
  
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

/**
 * Pages Sitemap - /sitemap-pages.xml
 * Static/public pages and category landing pages
 */
export const generatePagesSitemap = async (config, canonicalHostname) => {
  try {
    const baseUrl = `https://${canonicalHostname}`;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Homepage
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    // Jobs index
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/jobs/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';
    
    // Privacy Policy
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(baseUrl)}/privacy/</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.5</priority>\n';
    xml += '  </url>\n';
    
    // Category landing pages (only if they have active jobs)
    const categoriesResult = await config.db.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active"'
    ).all();
    
    const categories = categoriesResult.results || [];
    for (const catRow of categories) {
      if (catRow.category_id) {
        const categorySlug = normalizeCategorySlug(catRow.category_id);
        const countResult = await config.db.prepare(
          'SELECT COUNT(*) as count FROM offers WHERE status = "active" AND category_id = ?'
        ).bind(catRow.category_id).first();
        
        if (countResult && countResult.count > 0) {
          xml += '  <url>\n';
          xml += `    <loc>${escapeXml(baseUrl)}/jobs/category/${escapeXml(categorySlug)}</loc>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        }
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
    console.error('generatePagesSitemap error:', error);
    return new Response('Error generating pages sitemap', { status: 500 });
  }
};

/**
 * Jobs Sitemap - /sitemap-jobs.xml
 * Active job detail pages only
 */
export const generateJobsSitemap = async (config, canonicalHostname) => {
  try {
    const baseUrl = `https://${canonicalHostname}`;
    
    // Fetch ACTIVE jobs only (no deleted/expired)
    const result = await config.db.prepare(
      'SELECT id, title FROM offers WHERE status = ? ORDER BY created_at DESC'
    ).bind('active').all();
    
    const jobs = result.results || [];
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Job detail URLs (canonical internal permalinks)
    for (const job of jobs) {
      const url = generateJobPermalink(job, baseUrl);
      if (url) {
        xml += '  <url>\n';
        xml += `    <loc>${escapeXml(url)}</loc>\n`;
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
    console.error('generateJobsSitemap error:', error);
    return new Response('Error generating jobs sitemap', { status: 500 });
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
