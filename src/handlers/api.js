/**
 * src/handlers/api.js - API request handlers
 */

export const getOffers = async (request, config) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const categoryId = url.searchParams.get('category_id');
    const q = url.searchParams.get('q')?.trim() || null;
    const offset = (page - 1) * limit;

    // If search keyword provided, perform search + discovery
    if (q) {
      return await searchOffers(request, config, { q, status, categoryId, limit, page, offset });
    }

    // Build dynamic query based on filters
    let countQuery = 'SELECT COUNT(*) as count FROM offers WHERE status = ?';
    let selectQuery = 'SELECT * FROM offers WHERE status = ?';
    let bindings = [status];

    if (categoryId) {
      countQuery += ' AND category_id = ?';
      selectQuery += ' AND category_id = ?';
      bindings.push(categoryId);
    }

    selectQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    // Get total count
    const countResult = await config.db.prepare(countQuery)
      .bind(...bindings).first();

    const totalCount = countResult?.count || 0;

    // Get paginated results
    const result = await config.db.prepare(selectQuery)
      .bind(...bindings, limit, offset).all();

    return new Response(JSON.stringify({
      offers: result.results || [],
      pagination: {
        page,
        limit,
        total: totalCount,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * Search offers by keyword (D1) + discover from Ashby
 * @param {Object} request
 * @param {Object} config
 * @param {Object} params - { q, status, categoryId, limit, page, offset }
 */
async function searchOffers(request, config, params) {
  const { q, status, categoryId, limit, page, offset } = params;

  try {
    // Step 1: Perform Ashby discovery (non-blocking - failures don't break search)
    try {
      await discoverAshbyJobs(config, q);
    } catch (ashbyError) {
      // Log Ashby failure but continue with D1 search
      console.error(`Ashby discovery failed for q="${q}":`, ashbyError.message);
      // Do NOT fail the request - D1 search continues normally
    }

    // Step 2: Search D1 by title with keyword
    let countQuery = `SELECT COUNT(*) as count FROM offers 
                      WHERE status = ? 
                      AND LOWER(title) LIKE ?`;
    let selectQuery = `SELECT * FROM offers 
                       WHERE status = ? 
                       AND LOWER(title) LIKE ?`;
    let bindings = [status, `%${q.toLowerCase()}%`];

    if (categoryId) {
      countQuery += ' AND category_id = ?';
      selectQuery += ' AND category_id = ?';
      bindings.push(categoryId);
    }

    selectQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    // Get total count
    const countResult = await config.db.prepare(countQuery)
      .bind(...bindings).first();

    const totalCount = countResult?.count || 0;

    // Get paginated results
    const result = await config.db.prepare(selectQuery)
      .bind(...bindings, limit, offset).all();

    return new Response(JSON.stringify({
      offers: result.results || [],
      pagination: {
        page,
        limit,
        total: totalCount,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Search error:', error);
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Discover jobs from all Ashby boards by title search
 * Uses existing Ashby boards from registry + reuses existing normalization logic
 */
async function discoverAshbyJobs(config, q) {
  if (!q || q.length < 2) {
    return; // Skip discovery for very short keywords
  }

  const ASHBY_API_BASE = 'https://api.ashbyhq.com/posting-api/job-board';
  const DISCOVERY_TIMEOUT_MS = 5000; // 5 second timeout per board
  const MAX_BOARDS = 5; // Limit concurrent board searches

  try {
    // Fetch active boards from registry
    const boardsResult = await config.db.prepare(`
      SELECT board_name, source_id FROM ashby_boards
      WHERE status = 'active'
      LIMIT ?
    `).bind(MAX_BOARDS).all();

    const boards = boardsResult.results || [];

    if (boards.length === 0) {
      console.log('No active Ashby boards configured for discovery');
      return;
    }

    // Ensure Ashby source exists
    const sourceId = 'ashby';
    const existingSource = await config.db.prepare(
      'SELECT id FROM offer_sources WHERE id = ?'
    ).bind(sourceId).first();

    if (!existingSource) {
      await config.db.prepare(`
        INSERT INTO offer_sources (id, name, type, status, created_at, updated_at)
        VALUES (?, ?, 'api', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(sourceId, 'Ashby Public Jobs').run();
    }

    // Search each board with timeout
    const promises = boards.map(board =>
      Promise.race([
        searchAshbyBoard(config, board, q, sourceId),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Board search timeout')), DISCOVERY_TIMEOUT_MS)
        ),
      ]).catch(err => {
        console.warn(`Ashby board ${board.board_name} search failed:`, err.message);
        return { discovered: 0, inserted: 0, skipped: 0, errors: [err.message] };
      })
    );

    const results = await Promise.all(promises);
    const totalDiscovered = results.reduce((sum, r) => sum + (r.discovered || 0), 0);
    const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);

    console.log(
      `Ashby discovery for q="${q}": ${totalDiscovered} discovered, ${totalInserted} inserted`
    );
  } catch (err) {
    console.error('Ashby discovery orchestration failed:', err.message);
    throw err; // Re-throw for caller to handle gracefully
  }
}

/**
 * Search single Ashby board by job title
 */
async function searchAshbyBoard(config, board, q, sourceId) {
  const ASHBY_API_BASE = 'https://api.ashbyhq.com/posting-api/job-board';
  const stats = { discovered: 0, inserted: 0, skipped: 0, errors: [] };

  try {
    const url = `${ASHBY_API_BASE}/${board.board_name}?includeCompensation=true`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CPA-JOBS-MVP/1.0 (Search Discovery)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ashby API ${response.status}: ${response.statusText}`);
    }

    const apiData = await response.json();

    if (!apiData.jobs || !Array.isArray(apiData.jobs)) {
      throw new Error('Invalid Ashby response: missing jobs array');
    }

    // Filter jobs by title match
    const matchingJobs = apiData.jobs.filter(job =>
      job.title && job.title.toLowerCase().includes(q.toLowerCase())
    );

    stats.discovered = matchingJobs.length;

    // Process each matching job with deduplication
    for (const job of matchingJobs) {
      try {
        const result = await upsertAshbyJob(config, job, board.board_name, sourceId);
        if (result === 'imported') {
          stats.inserted++;
        } else {
          stats.skipped++;
        }
      } catch (err) {
        stats.errors.push(`Job ${job.id}: ${err.message}`);
        stats.skipped++;
      }
    }
  } catch (err) {
    stats.errors.push(err.message);
    throw err;
  }

  return stats;
}

/**
 * Upsert Ashby job with deduplication
 * Reuses existing normalization logic from ashby.js
 * @returns {'imported' | 'skipped'}
 */
async function upsertAshbyJob(config, job, jobBoardName, sourceId) {
  if (!job.id || !job.title) {
    throw new Error('Missing required: id or title');
  }

  const externalId = String(job.id);

  // Check if job already exists
  const existing = await config.db.prepare(
    'SELECT id FROM offers WHERE external_id = ? AND source_id = ?'
  ).bind(externalId, sourceId).first();

  if (existing) {
    return 'skipped'; // Job already in D1, do not duplicate
  }

  // Extract and normalize job data (matching existing ashby.js logic)
  const title = job.title ? job.title.trim().substring(0, 255) : '';
  const description = job.descriptionPlain || job.description || job.descriptionHtml || '';
  const descriptionHtml = job.descriptionHtml || '';

  const primaryLocation = job.address?.postalAddress || {};
  const locationCity = primaryLocation.addressLocality || null;
  const locationState = primaryLocation.addressRegion || null;
  const locationCountry = primaryLocation.addressCountry || 'USA';
  const locationText = [locationCity, locationState, locationCountry]
    .filter(Boolean)
    .join(', ') || null;

  const isRemote = job.isRemote === true;
  const workplaceType = job.workplaceType || null;
  const employmentType = job.employmentType || null;
  const applyUrl = job.applyUrl || null;
  const sourceUrl = job.jobUrl || null;
  const publishedAt = job.publishedAt ? new Date(job.publishedAt).toISOString() : null;

  const compensation = job.compensation;
  const salaryMin = compensation?.value?.min || null;
  const salaryMax = compensation?.value?.max || null;
  const salaryCurrency = compensation?.currency || 'USD';
  const salaryPeriod = compensation?.period || null;

  // Determine category from department
  let categoryId = 'cat-general';
  if (job.department) {
    const dept = job.department.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    categoryId = `cat-${dept}`;

    // Ensure category exists
    const catExists = await config.db.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).bind(categoryId).first();

    if (!catExists) {
      await config.db.prepare(`
        INSERT INTO categories (id, name, slug, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        categoryId,
        job.department.substring(0, 100),
        dept,
        `${job.department} opportunities from Ashby`
      ).run();
    }
  }

  const offerId = `ashby-${externalId}`;
  const sourceRaw = JSON.stringify({
    id: job.id,
    title: job.title,
    department: job.department,
    jobBoardName: jobBoardName,
  });

  // Insert new job
  await config.db.prepare(`
    INSERT INTO offers (
      id, external_id, title, description, description_html,
      url, apply_url, payout, payout_type,
      category_id, source_id,
      location, location_city, location_state, location_country, remote,
      workplace_type, employment_type,
      salary_min, salary_max, salary_currency, salary_period,
      date_posted, source_raw,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    offerId, externalId, title, description, descriptionHtml,
    sourceUrl || applyUrl, applyUrl, 0.0, 'none',
    categoryId, sourceId,
    locationText, locationCity, locationState, locationCountry, isRemote,
    workplaceType, employmentType,
    salaryMin, salaryMax, salaryCurrency, salaryPeriod,
    publishedAt, sourceRaw
  ).run();

  return 'imported';
}

export const getOfferDetail = async (config, offerId) => {
  try {
    const result = await config.db.prepare(
      'SELECT * FROM offers WHERE id = ?'
    ).bind(offerId).first();

    if (!result) {
      return new Response(JSON.stringify({
        error: 'Offer not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const getCategories = async (config) => {
  try {
    const result = await config.db.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active" ORDER BY category_id'
    ).all();

    return new Response(JSON.stringify({
      categories: result.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const trackClick = async (request, config) => {
  try {
    const data = await request.json();

    if (!data.offer_id) {
      return new Response(JSON.stringify({
        error: 'Missing offer_id',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clickId = `click-${Date.now()}`;

    return new Response(JSON.stringify({
      success: true,
      click_id: clickId,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const health = async (config) => {
  try {
    // Check KV
    const kvTest = await config.kv.get('_health_check');
    
    // Check DB
    const dbTest = await config.db.prepare('SELECT 1').first();

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Track click error:', error);
    return new Response(JSON.stringify({
      error: 'Click tracking failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const verifyApplyUrl = async (request, config) => {
  try {
    const url = new URL(request.url);
    const offerId = url.searchParams.get('id');
    const applyUrl = url.searchParams.get('url');

    if (!offerId || !applyUrl) {
      return new Response(JSON.stringify({
        available: false,
        expired: false,
        error: 'Missing id or url parameter',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get job from database to verify it exists
    const jobResult = await config.db.prepare(
      'SELECT id, title, apply_url FROM offers WHERE id = ?'
    ).bind(offerId).first();

    if (!jobResult) {
      return new Response(JSON.stringify({
        available: false,
        expired: false,
        error: 'Job not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify that requested URL matches job's apply_url
    if (jobResult.apply_url !== applyUrl) {
      return new Response(JSON.stringify({
        available: false,
        expired: false,
        error: 'Apply URL mismatch',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if apply_url is accessible
    try {
      let checkResponse;
      
      // Try HEAD first
      try {
        checkResponse = await fetch(applyUrl, {
          method: 'HEAD',
          redirect: 'follow',
        });
      } catch (headError) {
        // HEAD failed, fallback to GET
        console.log('HEAD request failed, falling back to GET:', headError.message);
        checkResponse = await fetch(applyUrl, {
          method: 'GET',
          redirect: 'follow',
        });
      }

      // 404 = expired job (ONLY case where expired: true)
      if (checkResponse.status === 404) {
        // Delete the expired job from database
        try {
          await config.db.prepare(
            'DELETE FROM offers WHERE id = ?'
          ).bind(offerId).run();
          
          console.log(`Deleted expired job from database: ${offerId} (external 404)`);
        } catch (deleteError) {
          // Log but don't fail the response - job may already be deleted (race condition)
          console.error('Failed to delete expired job:', deleteError.message);
        }
        
        return new Response(JSON.stringify({
          available: false,
          expired: true,
          statusCode: 404,
          error: 'Job application page not found',
          jobDeleted: true,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 405 Method Not Allowed for HEAD - try GET
      if (checkResponse.status === 405 && checkResponse.url === applyUrl) {
        try {
          checkResponse = await fetch(applyUrl, {
            method: 'GET',
            redirect: 'follow',
          });
          
          if (checkResponse.status === 404) {
            // Delete the expired job from database
            try {
              await config.db.prepare(
                'DELETE FROM offers WHERE id = ?'
              ).bind(offerId).run();
              
              console.log(`Deleted expired job from database: ${offerId} (external 404 via GET)`);
            } catch (deleteError) {
              console.error('Failed to delete expired job:', deleteError.message);
            }
            
            return new Response(JSON.stringify({
              available: false,
              expired: true,
              statusCode: 404,
              error: 'Job application page not found',
              jobDeleted: true,
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } catch (getError) {
          // GET also failed, network issue - DO NOT DELETE
          return new Response(JSON.stringify({
            available: false,
            expired: false,
            error: 'Could not verify URL availability',
            note: 'Network error during verification',
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      // 200-299 = success
      if (checkResponse.status >= 200 && checkResponse.status < 300) {
        return new Response(JSON.stringify({
          available: true,
          expired: false,
          statusCode: checkResponse.status,
          redirectUrl: checkResponse.url || applyUrl,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3xx = redirect already followed, check final status
      if (checkResponse.status >= 300 && checkResponse.status < 400) {
        return new Response(JSON.stringify({
          available: true,
          expired: false,
          statusCode: checkResponse.status,
          redirectUrl: checkResponse.url || applyUrl,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 401/403 = don't classify as expired, these are often bot protection
      if (checkResponse.status === 401 || checkResponse.status === 403) {
        return new Response(JSON.stringify({
          available: true,
          expired: false,
          statusCode: checkResponse.status,
          redirectUrl: applyUrl,
          note: 'Authentication/permission required but URL appears valid',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 429 = rate limiting, don't classify as expired
      if (checkResponse.status === 429) {
        return new Response(JSON.stringify({
          available: true,
          expired: false,
          statusCode: checkResponse.status,
          redirectUrl: applyUrl,
          note: 'Rate limited but URL appears valid',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Other 5xx = temporary failure, don't classify as expired
      if (checkResponse.status >= 500) {
        return new Response(JSON.stringify({
          available: false,
          expired: false,
          statusCode: checkResponse.status,
          error: 'Server error at application page',
          note: 'Temporary server error, not expired',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Other status codes
      return new Response(JSON.stringify({
        available: true,
        expired: false,
        statusCode: checkResponse.status,
        redirectUrl: applyUrl,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      // Network error, DNS failure, timeout - don't classify as expired
      console.error('Network error during apply URL check:', fetchError.message);
      return new Response(JSON.stringify({
        available: false,
        expired: false,
        error: 'Could not verify URL availability',
        note: 'Network error during verification',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Apply verification error:', error);
    return new Response(JSON.stringify({
      available: false,
      expired: false,
      error: 'Verification failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
