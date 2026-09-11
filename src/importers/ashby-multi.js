/* src/importers/ashby-multi.js - Ashby Multi-Board Aggregation
   Phase 1: Multi-board support for Ashby public job posting API
   
   Key features:
   - Load active boards from ashby_boards registry
   - Bounded concurrency (5 concurrent fetches)
   - Per-board error isolation
   - Health tracking per board
   - Deduplication by (external_id, source_id)
*/

import { importAshbyJobs } from './ashby.js';

const MAX_CONCURRENT_BOARDS = 5;
const BOARD_TIMEOUT_MS = 30000; // 30 seconds per board
const MAX_FAILURES_BEFORE_INACTIVE = 5;

/**
 * Import jobs from all active Ashby boards
 * @param {Object} config - Configuration with DB binding
 * @returns {Object} Aggregated import statistics
 */
export async function importAllAshbyBoards(config) {
  const startTime = Date.now();
  
  const aggregatedStats = {
    boards_attempted: 0,
    boards_succeeded: 0,
    boards_failed: 0,
    total_fetched: 0,
    total_imported: 0,
    total_updated: 0,
    total_skipped: 0,
    total_deactivated: 0,
    board_results: [],
    errors: [],
    duration_ms: 0
  };

  try {
    // Load active boards from registry
    const boardsResult = await config.db.prepare(`
      SELECT board_name, company_name, source_id, failure_count
      FROM ashby_boards
      WHERE status = 'active'
      ORDER BY board_name
    `).all();

    const boards = boardsResult.results || [];
    
    if (boards.length === 0) {
      aggregatedStats.errors.push('No active Ashby boards found in registry');
      return aggregatedStats;
    }

    console.log(`[ASHBY MULTI] Starting import for ${boards.length} boards`);

    // Process boards with bounded concurrency
    for (let i = 0; i < boards.length; i += MAX_CONCURRENT_BOARDS) {
      const batch = boards.slice(i, i + MAX_CONCURRENT_BOARDS);
      const batchResults = await Promise.allSettled(
        batch.map(board => importSingleBoard(config, board))
      );

      // Process batch results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const board = batch[j];
        aggregatedStats.boards_attempted++;

        if (result.status === 'fulfilled') {
          const boardStats = result.value;
          aggregatedStats.boards_succeeded++;
          aggregatedStats.total_fetched += boardStats.fetched;
          aggregatedStats.total_imported += boardStats.imported;
          aggregatedStats.total_updated += boardStats.updated;
          aggregatedStats.total_skipped += boardStats.skipped;
          aggregatedStats.total_deactivated += boardStats.deactivated;
          
          aggregatedStats.board_results.push({
            board: board.board_name,
            company: board.company_name,
            status: 'success',
            ...boardStats
          });

          // Update board health: success
          await updateBoardHealth(config, board.board_name, true, boardStats.fetched, null);
        } else {
          aggregatedStats.boards_failed++;
          const error = result.reason?.message || 'Unknown error';
          aggregatedStats.errors.push(`${board.board_name}: ${error}`);
          
          aggregatedStats.board_results.push({
            board: board.board_name,
            company: board.company_name,
            status: 'failed',
            error: error
          });

          // Update board health: failure
          await updateBoardHealth(config, board.board_name, false, 0, error);
        }
      }
    }

  } catch (err) {
    aggregatedStats.errors.push(`Multi-board import failed: ${err.message}`);
  }

  aggregatedStats.duration_ms = Date.now() - startTime;
  
  // Log aggregated results
  await logAggregatedImport(config, aggregatedStats);

  return aggregatedStats;
}

/**
 * Import jobs from a single board with timeout
 */
async function importSingleBoard(config, board) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BOARD_TIMEOUT_MS);

  try {
    console.log(`[ASHBY MULTI] Fetching board: ${board.board_name} (${board.company_name})`);
    
    // Pass board-specific source_id to single-board importer
    const stats = await importAshbyJobs(config, board.board_name, board.source_id);
    
    clearTimeout(timeoutId);
    return stats;
  } catch (err) {
    clearTimeout(timeoutId);
    
    if (err.name === 'AbortError') {
      throw new Error(`Timeout after ${BOARD_TIMEOUT_MS}ms`);
    }
    throw err;
  }
}

/**
 * Update board health tracking
 */
async function updateBoardHealth(config, boardName, success, jobCount, error) {
  try {
    if (success) {
      // Success: reset failure count, update timestamps
      await config.db.prepare(`
        UPDATE ashby_boards
        SET 
          last_checked = CURRENT_TIMESTAMP,
          last_success_at = CURRENT_TIMESTAMP,
          job_count = ?,
          failure_count = 0,
          last_error = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE board_name = ?
      `).bind(jobCount, boardName).run();
    } else {
      // Failure: increment failure count, record error
      await config.db.prepare(`
        UPDATE ashby_boards
        SET 
          last_checked = CURRENT_TIMESTAMP,
          failure_count = failure_count + 1,
          last_error = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE board_name = ?
      `).bind(error, boardName).run();

      // Check if board should be marked inactive
      const board = await config.db.prepare(`
        SELECT failure_count FROM ashby_boards WHERE board_name = ?
      `).bind(boardName).first();

      if (board && board.failure_count >= MAX_FAILURES_BEFORE_INACTIVE) {
        await config.db.prepare(`
          UPDATE ashby_boards
          SET status = 'unhealthy', updated_at = CURRENT_TIMESTAMP
          WHERE board_name = ?
        `).bind(boardName).run();
        
        console.warn(`[ASHBY MULTI] Board ${boardName} marked unhealthy after ${board.failure_count} failures`);
      }
    }
  } catch (err) {
    console.error(`Failed to update board health for ${boardName}:`, err);
  }
}

/**
 * Log aggregated import event
 */
async function logAggregatedImport(config, stats) {
  try {
    await config.db.prepare(`
      INSERT INTO system_events (event_type, event_data, created_at)
      VALUES ('ashby_multi_import', ?, CURRENT_TIMESTAMP)
    `).bind(JSON.stringify({
      boards_attempted: stats.boards_attempted,
      boards_succeeded: stats.boards_succeeded,
      boards_failed: stats.boards_failed,
      total_jobs: stats.total_fetched,
      imported: stats.total_imported,
      updated: stats.total_updated,
      deactivated: stats.total_deactivated,
      duration_ms: stats.duration_ms,
      error_count: stats.errors.length
    })).run();
  } catch (err) {
    console.error('Failed to log aggregated import:', err);
  }
}

/**
 * Backward compatibility: import single board by name
 * Used when ASHBY_JOB_BOARD_NAME is set
 */
export async function importAshbyJobsByName(config, boardName) {
  console.log(`[ASHBY SINGLE] Importing single board: ${boardName}`);
  return await importAshbyJobs(config, boardName);
}
