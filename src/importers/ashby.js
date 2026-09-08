/* src/importers/ashby.js - Ashby Public Job Postings API Importer
   Official API: https://developers.ashbyhq.com/docs/public-job-posting-api
   
   Ashby Public Job Postings API provides complete job data including:
   - Full HTML and plain text descriptions (NOT truncated)
   - Structured location data with compensation
   - Complete job board coverage per organization
   
   Key design decisions:
   - Use stable Ashby-provided job IDs for deduplication
   - Preserve full descriptions without truncation
   - Handle optional compensation safely
   - Support configurable job board identifiers
*/

const ASHBY_API_BASE = 'https://api.ashbyhq.com/posting-api/job-board';
const ASHBY_SOURCE_ID = 'ashby';
const ASHBY_SOURCE_NAME = 'Ashby Public Jobs';

/**
 * Import jobs from Ashby Public Job Postings API
 * @param {Object} env - Cloudflare environment with DB binding
 * @param {string} jobBoardName - Ashby job board identifier (e.g., "company-name")
 * @returns {Object} Import statistics
 */
export async function importAshbyJobs(env, jobBoardName) {
  if (!jobBoardName) {
    throw new Error('Job board name required for Ashby import');
  }

  const stats = {
    fetched: 0,
    imported: 0,
    updated: 0,
    skipped: 0,
    deactivated: 0,
    errors: []
  };

  try {
    // Ensure Ashby source exists in database
    await ensureAshbySource(env);

    // Fetch jobs from Ashby public API
    // Note: Ashby public API does not require authentication
    const response = await fetchAshbyJobs(jobBoardName);

    if (!response.ok) {
      throw new Error(`Ashby API error: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();

    if (!apiData.jobs || !Array.isArray(apiData.jobs)) {
      throw new Error('Invalid Ashby response: missing jobs array');
    }

    stats.fetched = apiData.jobs.length;

    // Track active Ashby job IDs from this import
    const activeAshbyIds = new Set();

    // Process each job
    for (const job of apiData.jobs) {
      try {
        const result = await processJob(env, job, jobBoardName);
        activeAshbyIds.add(job.id);

        if (result === 'imported') {
          stats.imported++;
        } else if (result === 'updated') {
          stats.updated++;
        } else if (result === 'skipped') {
          stats.skipped++;
        }
      } catch (err) {
        stats.errors.push(`Job ${job.id}: ${err.message}`);
        stats.skipped++;
      }
    }

    // Deactivate Ashby offers no longer in API response
    const deactivated = await deactivateRemovedJobs(env, activeAshbyIds, jobBoardName);
    stats.deactivated = deactivated;

    // Log import event
    await logImportEvent(env, jobBoardName, stats);

  } catch (err) {
    stats.errors.push(`Import failed: ${err.message}`);
  }

  return stats;
}

/**
 * Fetch jobs from Ashby public API
 * @param {string} jobBoardName - Ashby job board identifier
 */
async function fetchAshbyJobs(jobBoardName) {
  const url = `${ASHBY_API_BASE}/${jobBoardName}?includeCompensation=true`;

  return fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'CPA-JOBS-MVP/1.0 (Ashby Integration)',
      'Accept': 'application/json'
    }
  });
}

/**
 * Ensure Ashby source record exists
 */
async function ensureAshbySource(env) {
  const existing = await env.DB.prepare(
    'SELECT id FROM offer_sources WHERE id = ?'
  ).bind(ASHBY_SOURCE_ID).first();

  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO offer_sources (id, name, type, status, created_at, updated_at)
      VALUES (?, ?, 'api', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(ASHBY_SOURCE_ID, ASHBY_SOURCE_NAME).run();
  }
}

/**
 * Process single Ashby job
 * @returns {'imported' | 'updated' | 'skipped'}
 */
async function processJob(env, job, jobBoardName) {
  // Validate required fields
  if (!job.id || !job.title) {
    throw new Error('Missing required: id or title');
  }

  // Use Ashby ID as external_id for stable deduplication
  const externalId = String(job.id);

  // Check if job already exists
  const existing = await env.DB.prepare(
    'SELECT id, status FROM offers WHERE external_id = ? AND source_id = ?'
  ).bind(externalId, ASHBY_SOURCE_ID).first();

  // Extract all available fields from Ashby response
  const title = job.title ? job.title.trim().substring(0, 255) : '';

  // CRITICAL: Preserve full descriptions (Ashby provides complete text)
  const descriptionHtml = job.descriptionHtml || '';
  const description = job.descriptionPlain || job.description || descriptionHtml;

  // Location handling - Ashby provides both primary and secondary locations
  const primaryLocation = job.address?.postalAddress || {};
  const locationCity = primaryLocation.addressLocality || null;
  const locationState = primaryLocation.addressRegion || null;
  const locationCountry = primaryLocation.addressCountry || 'USA';
  const locationText = formatLocation(job.location, primaryLocation);

  // Job details
  const department = job.department || null;
  const team = job.team || null;
  const isRemote = job.isRemote === true;
  const workplaceType = job.workplaceType || null;
  const employmentType = job.employmentType || null;

  // Dates
  const publishedAt = job.publishedAt ? new Date(job.publishedAt).toISOString() : null;

  // URLs - preserve application URL (critical for job applications)
  const applyUrl = job.applyUrl || null;
  const sourceUrl = job.jobUrl || null;

  // Compensation (optional)
  const compensation = job.compensation;
  const salaryMin = compensation?.value?.min || null;
  const salaryMax = compensation?.value?.max || null;
  const salaryCurrency = compensation?.currency || 'USD';
  const salaryPeriod = compensation?.period || null;
  const salaryDisplay = formatCompensation(compensation);

  // Secondary locations
  const secondaryLocations = job.secondaryLocations && Array.isArray(job.secondaryLocations)
    ? JSON.stringify(job.secondaryLocations)
    : null;

  // Preserve raw response for audit trail
  const sourceRaw = JSON.stringify({
    id: job.id,
    title: job.title,
    department: job.department,
    team: job.team,
    isRemote: job.isRemote,
    workplaceType: job.workplaceType,
    employmentType: job.employmentType,
    location: job.location,
    address: job.address,
    publishedAt: job.publishedAt,
    jobUrl: job.jobUrl,
    applyUrl: job.applyUrl,
    compensation: job.compensation,
    secondaryLocations: job.secondaryLocations,
    jobBoardName: jobBoardName
  });

  // Ashby jobs are NOT CPA offers (payout = 0)
  const payout = 0.0;
  const payoutType = 'none';

  if (existing) {
    // Update existing offer - SAFE UPDATE with null preservation
    const updates = [];
    const bindings = [];

    // Always update core fields
    updates.push('title = ?', 'updated_at = CURRENT_TIMESTAMP', 'status = ?');
    bindings.push(title, 'active');

    // Update descriptions (CRITICAL: preserve full Ashby descriptions)
    if (descriptionHtml) {
      updates.push('description_html = ?');
      bindings.push(descriptionHtml);
    }
    if (description) {
      updates.push('description = ?');
      bindings.push(description);
    }

    // Location updates
    if (locationText) {
      updates.push('location = ?');
      bindings.push(locationText);
    }
    if (locationCity) {
      updates.push('location_city = ?');
      bindings.push(locationCity);
    }
    if (locationState) {
      updates.push('location_state = ?');
      bindings.push(locationState);
    }
    if (locationCountry) {
      updates.push('location_country = ?');
      bindings.push(locationCountry);
    }

    // Job details
    if (department) {
      updates.push('category_id = ?');
      const categoryId = await ensureCategory(env, department);
      bindings.push(categoryId);
    }
    if (team) {
      updates.push('team = ?');
      bindings.push(team);
    }

    updates.push('remote = ?');
    bindings.push(isRemote);

    if (workplaceType) {
      updates.push('workplace_type = ?');
      bindings.push(workplaceType);
    }
    if (employmentType) {
      updates.push('employment_type = ?');
      bindings.push(employmentType);
    }

    // Compensation
    if (salaryMin !== null || salaryMax !== null) {
      updates.push('salary_min = ?', 'salary_max = ?', 'salary_currency = ?');
      bindings.push(salaryMin, salaryMax, salaryCurrency);
      if (salaryPeriod) {
        updates.push('salary_period = ?');
        bindings.push(salaryPeriod);
      }
    }
    if (salaryDisplay) {
      updates.push('salary_display = ?');
      bindings.push(salaryDisplay);
    }

    // URLs
    if (applyUrl) {
      updates.push('apply_url = ?');
      bindings.push(applyUrl);
    }
    if (sourceUrl) {
      updates.push('url = ?');
      bindings.push(sourceUrl);
    }

    if (publishedAt) {
      updates.push('date_posted = ?');
      bindings.push(publishedAt);
    }

    if (secondaryLocations) {
      updates.push('secondary_locations = ?');
      bindings.push(secondaryLocations);
    }

    if (sourceRaw) {
      updates.push('source_raw = ?');
      bindings.push(sourceRaw);
    }

    // Execute update
    bindings.push(existing.id);
    await env.DB.prepare(`
      UPDATE offers
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();

    return 'updated';
  }

  // Insert new offer
  const categoryId = await ensureCategory(env, department || 'General');
  const offerId = `ashby-${externalId}`;

  await env.DB.prepare(`
    INSERT INTO offers (
      id, external_id, title, description, description_html,
      url, apply_url, payout, payout_type,
      category_id, source_id,
      location, location_city, location_state, location_country, remote,
      workplace_type, employment_type,
      salary_min, salary_max, salary_currency, salary_period, salary_display,
      date_posted,
      source_raw,
      secondary_locations,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    offerId, externalId, title, description, descriptionHtml,
    sourceUrl || applyUrl, applyUrl, payout, payoutType,
    categoryId, ASHBY_SOURCE_ID,
    locationText, locationCity, locationState, locationCountry, isRemote,
    workplaceType, employmentType,
    salaryMin, salaryMax, salaryCurrency, salaryPeriod, salaryDisplay,
    publishedAt,
    sourceRaw,
    secondaryLocations
  ).run();

  return 'imported';
}

/**
 * Ensure category exists
 */
async function ensureCategory(env, categoryName) {
  const slug = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
    `${categoryName} opportunities from Ashby`
  ).run();

  return categoryId;
}

/**
 * Deactivate Ashby offers no longer in API response
 */
async function deactivateRemovedJobs(env, activeIds, jobBoardName) {
  const activeOffers = await env.DB.prepare(`
    SELECT external_id FROM offers
    WHERE source_id = ? AND status = 'active'
  `).bind(ASHBY_SOURCE_ID).all();

  let deactivated = 0;

  for (const offer of activeOffers.results || []) {
    if (!activeIds.has(offer.external_id)) {
      await env.DB.prepare(`
        UPDATE offers
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE external_id = ? AND source_id = ?
      `).bind(offer.external_id, ASHBY_SOURCE_ID).run();
      deactivated++;
    }
  }

  return deactivated;
}

/**
 * Log import event
 */
async function logImportEvent(env, jobBoardName, stats) {
  try {
    await env.DB.prepare(`
      INSERT INTO system_events (event_type, event_data, created_at)
      VALUES ('ashby_import', ?, CURRENT_TIMESTAMP)
    `).bind(JSON.stringify({
      jobBoardName,
      ...stats
    })).run();
  } catch (err) {
    console.error('Failed to log import event:', err);
  }
}

/**
 * Helper: Format location from Ashby data
 */
function formatLocation(locationString, postalAddress) {
  const parts = [];

  if (locationString) {
    parts.push(locationString);
  }

  if (postalAddress) {
    if (postalAddress.addressLocality) {
      parts.push(postalAddress.addressLocality);
    }
    if (postalAddress.addressRegion && !parts.some(p => p.includes(postalAddress.addressRegion))) {
      parts.push(postalAddress.addressRegion);
    }
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Helper: Format compensation display
 */
function formatCompensation(compensation) {
  if (!compensation || !compensation.value) {
    return null;
  }

  const { min, max, currency, period } = compensation.value;

  if (!min && !max) {
    return null;
  }

  const formatAmount = (amount) => {
    if (amount >= 1000) {
      return `${currency || 'USD'}${(amount / 1000).toFixed(0)}k`;
    }
    return `${currency || 'USD'}${amount}`;
  };

  let display = '';
  if (min && max) {
    display = `${formatAmount(min)} - ${formatAmount(max)}`;
  } else if (min) {
    display = `From ${formatAmount(min)}`;
  } else if (max) {
    display = `Up to ${formatAmount(max)}`;
  }

  if (display && period) {
    display += `/${period}`;
  }

  return display || null;
}
