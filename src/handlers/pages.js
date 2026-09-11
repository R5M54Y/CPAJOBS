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
    
    // Build comprehensive JobPosting JSON-LD from raw Ashby data
    let sourceRaw = null;
    try {
      sourceRaw = job.source_raw ? JSON.parse(job.source_raw) : null;
    } catch (e) {
      // Ignore parse errors
    }
    
    const jobPostingJson = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description || '',
      url: canonicalUrl,
      identifier: {
        '@type': 'PropertyValue',
        name: 'Job ID',
        value: job.external_id || job.id,
      },
    };
    
    // datePosted: Use original published date from Ashby if available
    if (job.date_posted) {
      jobPostingJson.datePosted = job.date_posted;
    } else if (job.created_at) {
      jobPostingJson.datePosted = job.created_at;
    }
    
    // validThrough: Only if explicitly available
    if (job.valid_through) {
      jobPostingJson.validThrough = job.valid_through;
    } else if (job.expires_at) {
      jobPostingJson.validThrough = job.expires_at;
    }
    
    // hiringOrganization: Extract company from Ashby raw data or database
    const companyName = job.company || (sourceRaw?.jobBoardName ? sourceRaw.jobBoardName.charAt(0).toUpperCase() + sourceRaw.jobBoardName.slice(1) : null);
    if (companyName) {
      jobPostingJson.hiringOrganization = {
        '@type': 'Organization',
        name: companyName,
      };
      if (job.company_domain) {
        jobPostingJson.hiringOrganization.sameAs = `https://${job.company_domain}`;
      }
    }
    
    // employmentType: Map Ashby employment type
    if (job.employment_type) {
      jobPostingJson.employmentType = job.employment_type;
    }
    
    // jobLocation: Comprehensive location from Ashby raw address or normalized fields
    const hasLocation = job.location_city || job.location_state || job.location_country;
    const ashbyAddress = sourceRaw?.address?.postalAddress;
    
    if (hasLocation || ashbyAddress) {
      jobPostingJson.jobLocation = {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
        },
      };
      
      if (ashbyAddress) {
        if (ashbyAddress.addressLocality) {
          jobPostingJson.jobLocation.address.addressLocality = ashbyAddress.addressLocality;
        }
        if (ashbyAddress.addressRegion) {
          jobPostingJson.jobLocation.address.addressRegion = ashbyAddress.addressRegion;
        }
        if (ashbyAddress.addressCountry) {
          jobPostingJson.jobLocation.address.addressCountry = ashbyAddress.addressCountry;
        }
      } else {
        if (job.location_city) {
          jobPostingJson.jobLocation.address.addressLocality = job.location_city;
        }
        if (job.location_state) {
          jobPostingJson.jobLocation.address.addressRegion = job.location_state;
        }
        if (job.location_country) {
          jobPostingJson.jobLocation.address.addressCountry = job.location_country;
        }
      }
    }
    
    // Remote job handling
    if (job.remote || sourceRaw?.isRemote === true) {
      jobPostingJson.jobLocationType = 'TELECOMMUTE';
    }
    
    // baseSalary: Only populate if we have actual salary data
    const salaryData = sourceRaw?.compensation?.summaryComponents?.find(c => c.compensationType === 'Salary');
    if (salaryData && (salaryData.minValue || salaryData.maxValue)) {
      jobPostingJson.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: salaryData.currencyCode || 'USD',
        value: {
          '@type': 'QuantitativeValue',
        },
      };
      
      if (salaryData.minValue) {
        jobPostingJson.baseSalary.value.minValue = salaryData.minValue;
      }
      if (salaryData.maxValue) {
        jobPostingJson.baseSalary.value.maxValue = salaryData.maxValue;
      }
      
      if (salaryData.interval) {
        jobPostingJson.baseSalary.value.unitText = salaryData.interval === '1 YEAR' ? 'YEAR' : salaryData.interval;
      }
    } else if (job.salary_min || job.salary_max) {
      // Fallback to normalized salary if available
      jobPostingJson.baseSalary = {
        '@type': 'MonetaryAmount',
        currency: job.salary_currency || 'USD',
        value: {
          '@type': 'QuantitativeValue',
        },
      };
      
      if (job.salary_min) {
        jobPostingJson.baseSalary.value.minValue = job.salary_min;
      }
      if (job.salary_max) {
        jobPostingJson.baseSalary.value.maxValue = job.salary_max;
      }
      
      if (job.salary_period) {
        jobPostingJson.baseSalary.value.unitText = job.salary_period;
      }
    }
    
    // directApply: Only if we have a verified apply URL
    if (job.apply_url || sourceRaw?.applyUrl) {
      jobPostingJson.directApply = true;
    }
    
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
  ${JSON.stringify(jobPostingJson)}
  </script>
  
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header role="banner">
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <a href="/" class="logo">USA Jobs</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse Jobs</a>
      </div>
    </nav>
  </header>

  <main id="app" role="main">
    <!-- Content will be loaded dynamically -->
  </main>

  <footer role="contentinfo">
    <p>&copy; 2026 USA Jobs. Discover accounting and finance opportunities.</p>
  </footer>

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
    // Map slug back to category ID
    const categoriesResult = await config.db.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active"'
    ).all();
    
    const categories = categoriesResult.results || [];
    let categoryId = null;
    
    for (const cat of categories) {
      if (normalizeCategorySlug(cat.category_id) === categorySlug) {
        categoryId = cat.category_id;
        break;
      }
    }
    
    if (!categoryId) {
      return new Response('Category not found', { status: 404 });
    }
    
    // Fetch jobs in this category
    const jobsResult = await config.db.prepare(
      'SELECT * FROM offers WHERE status = "active" AND category_id = ? ORDER BY created_at DESC LIMIT 50'
    ).bind(categoryId).all();
    
    const jobs = jobsResult.results || [];
    const jobCount = jobs.length;
    
    if (jobCount === 0) {
      return new Response('Category not found', { status: 404 });
    }
    
    const categoryName = categoryId; // Use category ID as display name
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
  <header role="banner">
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <a href="/" class="logo">USA Jobs</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse Jobs</a>
      </div>
    </nav>
  </header>

  <main id="app" role="main">
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
  } catch (error) {
    console.error('serveCategoryPage error:', error);
    return new Response('Error loading category page', { status: 500 });
  }
};
