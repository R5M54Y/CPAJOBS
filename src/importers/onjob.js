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

  // Use OnJob URL as unique identifier for deduplication
  const offerUrl = job.url;

  // Check if this OnJob offer already exists
  const existing = await env.DB.prepare(
    'SELECT id, status FROM offers WHERE url = ? AND source_id = ?'
  ).bind(offerUrl, ONJOB_SOURCE_ID).first();

  // Extract and normalize fields from OnJob feed
  const title = job.title.trim().substring(0, 255);
  const description = job.description || job.summary || '';
  const category = extractCategory(job);
  const location = job.location || job.city || null;
  
  // OnJob jobs are NOT CPA offers - set payout to 0
  const payout = 0.0;
  const payoutType = 'none';

  if (existing) {
    // Update existing offer if status needs changing or content changed
    if (existing.status !== 'active') {
      await env.DB.prepare(`
        UPDATE offers 
        SET status = 'active', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(existing.id).run();
      return 'updated';
    }
    return 'skipped';
  }

  // Ensure category exists
  const categoryId = await ensureCategory(env, category);

  // Generate unique offer ID
  const offerId = `onjob-${Date.now()}-${randomString(8)}`;

  // Insert new offer
  await env.DB.prepare(`
    INSERT INTO offers (
      id, title, description, url, payout, payout_type,
      category_id, source_id, location, status, 
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    offerId,
    title,
    description,
    offerUrl,
    payout,
    payoutType,
    categoryId,
    ONJOB_SOURCE_ID,
    location
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
