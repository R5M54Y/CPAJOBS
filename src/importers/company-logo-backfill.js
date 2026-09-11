/* Backfill existing jobs with company logos from apply URLs
   
   One-time operation to extract logos for all existing jobs that have:
   - apply_url IS NOT NULL
   - company_logo IS NULL
   
   Usage: Execute via manual endpoint or cron job
*/

import { extractCompanyLogo } from './company-logo.js';

const BACKFILL_BATCH_SIZE = 10; // Process 10 jobs at a time
const BACKFILL_CONCURRENCY = 3; // 3 concurrent logo fetches

/**
 * Backfill company logos for existing job offers
 * @param {Object} config - Configuration with DB binding
 * @returns {Promise<Object>} Backfill statistics
 */
export async function backfillCompanyLogos(config) {
  const stats = {
    total: 0,
    processed: 0,
    extracted: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // Get count of jobs needing backfill
    const countResult = await config.db.prepare(`
      SELECT COUNT(*) as total FROM offers
      WHERE apply_url IS NOT NULL AND company_logo IS NULL
    `).first();

    stats.total = countResult?.total || 0;

    if (stats.total === 0) {
      console.log('No jobs to backfill');
      return stats;
    }

    console.log(`Starting backfill for ${stats.total} jobs...`);

    // Process in batches to avoid memory issues
    let offset = 0;

    while (offset < stats.total) {
      const { results: batch } = await config.db.prepare(`
        SELECT id, apply_url, company_logo FROM offers
        WHERE apply_url IS NOT NULL AND company_logo IS NULL
        LIMIT ? OFFSET ?
      `).bind(BACKFILL_BATCH_SIZE, offset).all();

      if (!batch || batch.length === 0) {
        break;
      }

      // Process batch with controlled concurrency
      await processBatchWithConcurrency(config, batch, stats, BACKFILL_CONCURRENCY);

      offset += batch.length;
      console.log(`Progress: ${Math.min(offset, stats.total)}/${stats.total}`);
    }

  } catch (err) {
    stats.errors.push(`Backfill failed: ${err.message}`);
    console.error('Backfill error:', err);
  }

  return stats;
}

/**
 * Process batch with controlled concurrency
 */
async function processBatchWithConcurrency(config, batch, stats, concurrency) {
  const queue = [...batch];
  const active = [];

  while (queue.length > 0 || active.length > 0) {
    // Fill up to concurrency limit
    while (active.length < concurrency && queue.length > 0) {
      const job = queue.shift();
      const promise = processJobLogoExtraction(config, job, stats);
      active.push(promise);
    }

    // Wait for at least one to finish
    if (active.length > 0) {
      await Promise.race(active);
      active.splice(0, 1);
    }
  }

  // Wait for remaining
  await Promise.all(active);
}

/**
 * Extract and save logo for a single job
 */
async function processJobLogoExtraction(config, job, stats) {
  stats.processed++;

  try {
    if (!job.apply_url) {
      stats.skipped++;
      return;
    }

    // Extract logo from apply URL
    const logoResult = await extractCompanyLogo(job.apply_url);

    if (!logoResult.logoUrl) {
      stats.failed++;
      return;
    }

    // Update job with extracted logo
    await config.db.prepare(`
      UPDATE offers
      SET company_logo = ?, company_logo_source = ?, company_logo_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(logoResult.logoUrl, logoResult.source, job.id).run();

    stats.extracted++;

  } catch (err) {
    stats.errors.push(`Job ${job.id}: ${err.message}`);
    stats.failed++;
  }
}

/**
 * Report backfill results
 */
export function formatBackfillReport(stats) {
  return `
=== COMPANY LOGO BACKFILL REPORT ===
Total jobs to backfill: ${stats.total}
Processed: ${stats.processed}
Successfully extracted: ${stats.extracted}
Failed: ${stats.failed}
Skipped: ${stats.skipped}
Success rate: ${stats.processed > 0 ? ((stats.extracted / stats.processed) * 100).toFixed(1) : 0}%
Errors: ${stats.errors.length}
${stats.errors.length > 0 ? '\nFirst error: ' + stats.errors[0] : ''}
`;
}
