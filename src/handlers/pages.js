/**
 * src/handlers/pages.js - Server-side rendered page handlers
 */

import { escapeHtml, generateJobPermalink, normalizeCategorySlug } from '../core/seo.js';
import { serveStatic } from './static.js';

export const serveJobDetail = async (pathname, config, canonicalHostname) => {
  try {
    // Extract job ID from pathname: /jobs/<slug>-<id>
    const pathSegment = pathname.slice(6); // Remove '/jobs/'
    
    // Match Ashby format: ashby-<uuid>
    const ashbyMatch = pathSegment.match(/(ashby-[a-f0-9-]+)$/i);
    let jobId = null;
    
    if (ashbyMatch) {
      jobId = ashbyMatch[1];
    } else {
      // Extract from last segment after last dash
      const lastDashIndex = pathSegment.lastIndexOf('-');
      if (lastDashIndex !== -1) {
        jobId = pathSegment.slice(lastDashIndex + 1);
      }
    }
    
    if (!jobId) {
      return serveStatic('/');
    }
    
    // Fetch job from database
    const job = await config.db.prepare(
      'SELECT * FROM offers WHERE id = ?'
    ).bind(jobId).first();
    
    if (!job) {
      return serveStatic('/');
    }
    
    // Job found but inactive - return 404 or 410
    if (job.status !== 'active') {
      return new Response('Job listing no longer available', { status: 410 });
    }
    
    // Build SEO-optimized job detail page
    const title = `${job.title} | USA Jobs`;
    const description = (job.description || '').substring(0, 160);
    const canonicalUrl = `https://${canonicalHostname}${pathname}`;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:type" content="website">
  
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    url: canonicalUrl,
    datePosted: job.created_at,
    validThrough: job.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company || 'USA Jobs',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US',
      },
    },
  })}
  </script>
  
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div id="app"></div>
  <script>window.__INITIAL_JOB__ = ${JSON.stringify(job)};</script>
  <script src="/js/app.js"></script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('serveJobDetail error:', error);
    return serveStatic('/');
  }
};

export const serveCategoryPage = async (categorySlug, config, canonicalHostname) => {
  try {
    // Map slug back to category name
    const categoriesResult = await config.db.prepare(
      'SELECT DISTINCT category FROM offers WHERE status = "active"'
    ).all();
    
    const categories = categoriesResult.results || [];
    let categoryName = null;
    
    for (const cat of categories) {
      if (normalizeCategorySlug(cat.category) === categorySlug) {
        categoryName = cat.category;
        break;
      }
    }
    
    if (!categoryName) {
      return new Response('Category not found', { status: 404 });
    }
    
    // Fetch jobs in this category
    const jobsResult = await config.db.prepare(
      'SELECT * FROM offers WHERE status = "active" AND category = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(categoryName).all();
    
    const jobs = jobsResult.results || [];
    const jobCount = jobs.length;
    
    if (jobCount === 0) {
      return new Response('Category not found', { status: 404 });
    }
    
    const title = `${categoryName} Jobs | USA Jobs`;
    const description = `Browse ${jobCount} ${categoryName} job${jobCount !== 1 ? 's' : ''} on USA Jobs.`;
    const canonicalUrl = `https://${canonicalHostname}/jobs/category/${categorySlug}`;
    
    const jobListHtml = jobs.map(job => {
      const permalink = generateJobPermalink(job, '');
      const desc = (job.description || '').substring(0, 150);
      return `
        <div class="category-job-card">
          <h3><a href="${permalink}">${escapeHtml(job.title)}</a></h3>
          <p>${escapeHtml(desc)}${desc.length >= 150 ? '...' : ''}</p>
        </div>
      `;
    }).join('');
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div id="app">
    <section class="category-landing">
      <nav class="breadcrumb">
        <a href="/">Home</a> &gt; <a href="/jobs/">Jobs</a> &gt; ${escapeHtml(categoryName)}
      </nav>
      
      <h1>${escapeHtml(categoryName)} Jobs</h1>
      <p>Explore ${jobCount} ${categoryName} job${jobCount !== 1 ? 's' : ''}.</p>
      
      <div class="category-jobs">
        ${jobListHtml}
      </div>
      
      <div class="category-footer">
        <a href="/jobs/">← View All Jobs</a>
      </div>
    </section>
  </div>
  <script src="/js/app.js"></script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('serveCategoryPage error:', error);
    return new Response('Error loading category page', { status: 500 });
  }
};
