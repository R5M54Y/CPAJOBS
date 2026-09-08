/* src/importers/onjob.js - OnJob.io Feed Importer
   Minimal importer for OnJob.io free job feed
   Feed: https://onjob.io/feeds/jobs.json
   Terms: Free to crawl/republish, link back to OnJob.io URL
*/

const ONJOB_FEED_URL = 'https://onjob.io/feeds/jobs.json';
const ONJOB_SOURCE_ID = 'onjob-io';
const ONJOB_SOURCE_NAME = 'OnJob.io';

/**
 * Import jobs from OnJob.io feed into CPA JOBS offers table
 * @param {Object} env - Cloudflare environment with DB binding
 * @returns {Object} Import result statistics
 */
export async function importOnJobFeed(env) {
  const stats = {
    fetched: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    deactivated: 0,
    errors: []
  };

  try {
    // Ensure OnJob source exists in offer_sources table
    await ensureOnJobSource(env);

    // Fetch OnJob feed (page 1 only for MVP)
    const response = await fetch(ONJOB_FEED_URL, {
      headers: {
        'User-Agent': 'CPA-JOBS-MVP/1.0 (Job Board Integration)'
      }
    });

    if (!response.ok) {
      throw new Error(`OnJob feed returned ${response.status}: ${response.statusText}`);
    }

    const feedData = await response.json();
    
    if (!feedData.jobs || !Array.isArray(feedData.jobs)) {
      throw new Error('Invalid feed format: missing jobs array');
    }

    stats.fetched = feedData.jobs.length;

    // Track active OnJob job URLs for deactivation logic
    const activeOnJobUrls = new Set();

    // Process each job from the feed
    for (const job of feedData.jobs) {
      try {
        const result = await processJob(env, job);
        activeOnJobUrls.add(job.url);
        
        if (result === 'imported') {
          stats.imported++;
        } else if (result === 'updated') {
          stats.updated++;
        } else if (result === 'skipped') {
          stats.skipped++;
        }
      } catch (err) {
        stats.errors.push(`Job ${job.url}: ${err.message}`);
        stats.skipped++;
      }
    }

    // Deactivate OnJob offers that are no longer in the feed
    const deactivated = await deactivateRemovedJobs(env, activeOnJobUrls);
    stats.deactivated = deactivated;

    // Log import event to system_events table
    await logImportEvent(env, stats);

  } catch (err) {
    stats.errors.push(`Feed error: ${err.message}`);
  }

  return stats;
}

/**
 * Ensure OnJob source record exists in offer_sources table
 */
async function ensureOnJobSource(env) {
  const existing = await env.DB.prepare(
    'SELECT id FROM offer_sources WHERE id = ?'
  ).bind(ONJOB_SOURCE_ID).first();

  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO offer_sources (id, name, type, status, created_at, updated_at)
      VALUES (?, ?, 'feed', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(ONJOB_SOURCE_ID, ONJOB_SOURCE_NAME).run();
  }
}

/**
 * Process a single job from OnJob feed
 * @returns {'imported' | 'updated' | 'skipped'}
 */
async function processJob(env, job) {
  // Validate required fields
  if (!job.url || !job.title) {
    throw new Error('Missing required fields: url or title');
  }

  // Use OnJob external ID for stable deduplication
  const externalId = job.id;
  const offerUrl = job.url;

  // Check if this OnJob offer already exists by external_id or URL
  const existing = await env.DB.prepare(
    'SELECT id, status FROM offers WHERE (external_id = ? OR url = ?) AND source_id = ?'
  ).bind(externalId, offerUrl, ONJOB_SOURCE_ID).first();

  // Extract and normalize ALL available fields from OnJob feed
  const title = job.title.trim().substring(0, 255);
  const description = job.description || job.summary || '';
  const descriptionHtml = job.descriptionHtml || description;
  const category = extractCategory(job);
  const location = job.location || job.city || null;
  
  // Company information
  const company = job.company || null;
  const companyDomain = job.companyDomain || null;
  const companyLogo = job.jsonLd?.hiringOrganization?.logo || null;
  
  // Location details
  const locationCity = job.city || null;
  const locationState = job.state || null;
  const locationCountry = job.country || null;
  const locationCountryCode = job.countryCode || null;
  const remote = job.remote || false;
  
  // Employment details
  const employmentType = job.employmentType || null;
  const experience = job.experience || null;
  const skills = job.skills ? JSON.stringify(job.skills) : null;
  
  // Salary information
  const salaryMin = job.salaryMin ? parseFloat(job.salaryMin) : null;
  const salaryMax = job.salaryMax ? parseFloat(job.salaryMax) : null;
  const salaryCurrency = job.currency || null;
  const salaryPeriod = 'month'; // OnJob salaries are monthly
  const salaryDisplay = job.salary || null;
  
  // Application and dates
  const applyUrl = job.applyUrl || offerUrl;
  const datePosted = job.datePosted || null;
  const validThrough = job.jsonLd?.validThrough || null;
  
  // Preserve raw source data for debugging
  const sourceRaw = job.jsonLd ? JSON.stringify(job.jsonLd) : null;
  
  // OnJob jobs are NOT CPA offers - set payout to 0
  const payout = 0.0;
  const payoutType = 'none';

  if (existing) {
    // Update existing offer with latest data
    await env.DB.prepare(`
      UPDATE offers 
      SET 
        title = ?, description = ?, description_html = ?,
        company = ?, company_domain = ?, company_logo = ?,
        location = ?, location_city = ?, location_state = ?, 
        location_country = ?, location_country_code = ?, remote = ?,
        employment_type = ?, experience = ?, skills = ?,
        salary_min = ?, salary_max = ?, salary_currency = ?, 
        salary_period = ?, salary_display = ?,
        apply_url = ?, date_posted = ?, valid_through = ?,
        source_raw = ?, status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title, description, descriptionHtml,
      company, companyDomain, companyLogo,
      location, locationCity, locationState, 
      locationCountry, locationCountryCode, remote,
      employmentType, experience, skills,
      salaryMin, salaryMax, salaryCurrency,
      salaryPeriod, salaryDisplay,
      applyUrl, datePosted, validThrough,
      sourceRaw, existing.id
    ).run();
    return 'updated';
  }

  // Ensure category exists
  const categoryId = await ensureCategory(env, category);

  // Generate unique offer ID with external_id for tracking
  const offerId = `onjob-${externalId.split('-')[0]}`;

  // Insert new offer with complete data
  await env.DB.prepare(`
    INSERT INTO offers (
      id, external_id, title, description, description_html, 
      url, apply_url, payout, payout_type,
      company, company_domain, company_logo,
      category_id, source_id, 
      location, location_city, location_state, location_country, location_country_code, remote,
      employment_type, experience, skills,
      salary_min, salary_max, salary_currency, salary_period, salary_display,
      date_posted, valid_through, source_raw,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    offerId, externalId, title, description, descriptionHtml,
    offerUrl, applyUrl, payout, payoutType,
    company, companyDomain, companyLogo,
    categoryId, ONJOB_SOURCE_ID,
    location, locationCity, locationState, locationCountry, locationCountryCode, remote,
    employmentType, experience, skills,
    salaryMin, salaryMax, salaryCurrency, salaryPeriod, salaryDisplay,
    datePosted, validThrough, sourceRaw
  ).run();

  return 'imported';
}

/**
 * Extract category from OnJob job data
 */
function extractCategory(job) {
  // Try multiple fields that might contain category info
  if (job.category) return job.category;
  if (job.jobFunction) return job.jobFunction;
  if (job.industry) return job.industry;
  
  // Default category for uncategorized OnJob jobs
  return 'General';
}

/**
 * Ensure category exists, create if needed
 * @returns {string} category ID
 */
async function ensureCategory(env, categoryName) {
  const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const categoryId = `cat-${slug}`;

  const existing = await env.DB.prepare(
    'SELECT id FROM categories WHERE id = ? OR slug = ?'
  ).bind(categoryId, slug).first();

  if (existing) {
    return existing.id;
  }

  // Create new category
  await env.DB.prepare(`
    INSERT INTO categories (id, name, slug, description, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    categoryId,
    categoryName.substring(0, 100),
    slug,
    `${categoryName} opportunities from OnJob.io`
  ).run();

  return categoryId;
}

/**
 * Deactivate OnJob offers that are no longer in the feed
 */
async function deactivateRemovedJobs(env, activeUrls) {
  // Get all active OnJob offers
  const activeOffers = await env.DB.prepare(`
    SELECT url FROM offers 
    WHERE source_id = ? AND status = 'active'
  `).bind(ONJOB_SOURCE_ID).all();

  let deactivated = 0;

  for (const offer of activeOffers.results || []) {
    if (!activeUrls.has(offer.url)) {
      // Job no longer in feed, mark as expired
      await env.DB.prepare(`
        UPDATE offers 
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE url = ? AND source_id = ?
      `).bind(offer.url, ONJOB_SOURCE_ID).run();
      deactivated++;
    }
  }

  return deactivated;
}

/**
 * Log import event to system_events table
 */
async function logImportEvent(env, stats) {
  try {
    await env.DB.prepare(`
      INSERT INTO system_events (event_type, event_data, created_at)
      VALUES ('onjob_import', ?, CURRENT_TIMESTAMP)
    `).bind(JSON.stringify(stats)).run();
  } catch (err) {
    // Silently fail if system_events table doesn't exist or insert fails
    console.error('Failed to log import event:', err);
  }
}

/**
 * Generate random string for ID uniqueness
 */
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
