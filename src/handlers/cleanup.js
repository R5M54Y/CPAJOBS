/**
 * src/handlers/cleanup.js - Automatic expired job cleanup
 * 
 * Scheduled job that checks stored apply_url values for HTTP 404
 * and removes expired jobs from the database.
 */

/**
 * Check if a single job's apply_url is expired (returns 404)
 * Reuses the same verification logic as /apply endpoint
 * 
 * @param {string} applyUrl - The URL to check
 * @returns {Promise<{expired: boolean, statusCode: number}>}
 */
export async function checkJobExpiration(applyUrl) {
  try {
    let checkResponse;
    
    // Try HEAD first (lightweight)
    try {
      checkResponse = await fetch(applyUrl, {
        method: 'HEAD',
        redirect: 'follow',
      });
    } catch (headError) {
      // HEAD failed, fallback to GET
      console.log(`[CLEANUP] HEAD failed for ${applyUrl}, trying GET:`, headError.message);
      try {
        checkResponse = await fetch(applyUrl, {
          method: 'GET',
          redirect: 'follow',
        });
      } catch (getError) {
        // Network error - DO NOT classify as expired
        console.log(`[CLEANUP] Network error for ${applyUrl}:`, getError.message);
        return { expired: false, statusCode: null, error: 'network_error' };
      }
    }
    
    // 404 = expired job (ONLY case where expired: true)
    if (checkResponse.status === 404) {
      return { expired: true, statusCode: 404 };
    }
    
    // 405 Method Not Allowed - try GET
    if (checkResponse.status === 405) {
      try {
        checkResponse = await fetch(applyUrl, {
          method: 'GET',
          redirect: 'follow',
        });
        
        if (checkResponse.status === 404) {
          return { expired: true, statusCode: 404 };
        }
      } catch (getError) {
        return { expired: false, statusCode: null, error: 'network_error' };
      }
    }
    
    // All other status codes = NOT expired
    // Including: 200, 3xx, 401, 403, 429, 5xx
    return { expired: false, statusCode: checkResponse.status };
    
  } catch (error) {
    // Any uncaught error = DO NOT classify as expired
    console.error(`[CLEANUP] Error checking ${applyUrl}:`, error.message);
    return { expired: false, statusCode: null, error: error.message };
  }
}

/**
 * Clean up expired jobs in batches
 * 
 * @param {Object} config - Worker configuration with db binding
 * @param {number} batchSize - Number of jobs to process per invocation
 * @returns {Promise<Object>} Cleanup statistics
 */
export async function cleanupExpiredJobs(config, batchSize = 50) {
  const startTime = Date.now();
  const stats = {
    checked: 0,
    expired: 0,
    deleted: 0,
    preserved: 0,
    errors: 0,
    duration_ms: 0,
  };
  
  try {
    console.log(`[CLEANUP] Starting cleanup check (batch size: ${batchSize})`);
    
    // Fetch batch of active jobs ordered by ID for deterministic pagination
    const jobs = await config.db.prepare(
      'SELECT id, title, apply_url FROM offers WHERE status = ? ORDER BY id ASC LIMIT ?'
    ).bind('active', batchSize).all();
    
    if (!jobs.results || jobs.results.length === 0) {
      console.log('[CLEANUP] No jobs to check');
      stats.duration_ms = Date.now() - startTime;
      return stats;
    }
    
    console.log(`[CLEANUP] Checking ${jobs.results.length} jobs`);
    
    // Check each job
    for (const job of jobs.results) {
      stats.checked++;
      
      if (!job.apply_url) {
        console.log(`[CLEANUP] Job ${job.id} has no apply_url, skipping`);
        stats.preserved++;
        continue;
      }
      
      console.log(`[CLEANUP] Checking job ${job.id}: ${job.title}`);
      
      const result = await checkJobExpiration(job.apply_url);
      
      if (result.expired) {
        // External 404 confirmed - delete job
        console.log(`[CLEANUP] Job ${job.id} expired (${result.statusCode}), deleting`);
        stats.expired++;
        
        try {
          await config.db.prepare(
            'DELETE FROM offers WHERE id = ?'
          ).bind(job.id).run();
          
          stats.deleted++;
          console.log(`[CLEANUP] ✅ Deleted expired job: ${job.id} - ${job.title}`);
        } catch (deleteError) {
          // Job may have been deleted concurrently
          console.error(`[CLEANUP] Failed to delete job ${job.id}:`, deleteError.message);
          stats.errors++;
        }
      } else {
        // Job still valid or inconclusive
        console.log(`[CLEANUP] Job ${job.id} preserved (status: ${result.statusCode || 'error'})`);
        stats.preserved++;
      }
    }
    
    stats.duration_ms = Date.now() - startTime;
    
    console.log('[CLEANUP] Batch complete:');
    console.log(`  Checked: ${stats.checked}`);
    console.log(`  Expired: ${stats.expired}`);
    console.log(`  Deleted: ${stats.deleted}`);
    console.log(`  Preserved: ${stats.preserved}`);
    console.log(`  Errors: ${stats.errors}`);
    console.log(`  Duration: ${stats.duration_ms}ms`);
    
    return stats;
    
  } catch (error) {
    console.error('[CLEANUP] Fatal error:', error.message);
    console.error('[CLEANUP] Stack:', error.stack);
    stats.duration_ms = Date.now() - startTime;
    stats.errors++;
    return stats;
  }
}
