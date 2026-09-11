/**
 * src/main.js - Entry point for CPA JOBS
 * Modular architecture with proper routing
 */

import { importAllAshbyBoards, importAshbyJobsByName } from './importers/ashby-multi.js';
import { getConfig, validateConfig } from './core/config.js';
import { routeRequest } from './core/routing.js';
import { getOffers, getOfferDetail, getCategories, trackClick, health, verifyApplyUrl } from './handlers/api.js';
import { generateSitemap, serveRobotsTxt } from './handlers/seo.js';
import { serveStatic } from './handlers/static.js';
import { serveJobDetail, serveCategoryPage } from './handlers/pages.js';
import { handleLogoAdminRequest } from './handlers/admin-logo.js';

/**
 * Main fetch handler
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const config = getConfig(env);
    
    // Validate configuration
    const configErrors = validateConfig(config);
    if (configErrors.length > 0) {
      return new Response(JSON.stringify({
        error: 'Configuration error',
        details: configErrors,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const canonicalHostname = config.canonicalHostname;
    
    // Canonical hostname redirect
    if (url.hostname !== canonicalHostname && url.hostname.endsWith('.workers.dev')) {
      const canonicalUrl = `https://${canonicalHostname}${url.pathname}${url.search}`;
      return new Response(null, {
        status: 301,
        headers: { 'Location': canonicalUrl },
      });
    }
    
    const pathname = url.pathname;
    const route = routeRequest(pathname);
    
    // Route to appropriate handler
    switch (route.type) {
      case 'health':
        return health(config);
        
      // TEMPORARY: Manual sync trigger for MVP verification
      case 'api_manual_sync':
        if (request.method === 'POST') {
          console.log('[MANUAL SYNC] Starting multi-board import...');
          const stats = await importAllAshbyBoards(config);
          return new Response(JSON.stringify(stats, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response('Method not allowed', { status: 405 });
      
      // TEMPORARY: Logo extraction admin endpoints
      case 'api_logo_test':
      case 'api_logo_backfill':
        return handleLogoAdminRequest(request, config);
        
      case 'api_offers':
        return getOffers(request, config);
        
      case 'api_offer_detail':
        return getOfferDetail(config, route.offerId);
        
      case 'api_categories':
        return getCategories(config);
        
      case 'api_track_click':
        if (request.method === 'POST') {
          return trackClick(request, config);
        }
        return new Response('Method not allowed', { status: 405 });
        
      case 'api_apply':
        if (request.method === 'GET') {
          return verifyApplyUrl(request, config);
        }
        return new Response('Method not allowed', { status: 405 });
        
      case 'seo_sitemap':
        return generateSitemap(config, canonicalHostname);
        
      case 'seo_robots':
        return serveRobotsTxt(canonicalHostname);
        
      case 'page_category':
        return serveCategoryPage(route.categorySlug, config, canonicalHostname);
        
      case 'page_job_detail':
        return serveJobDetail(route.pathname, config, canonicalHostname);
        
      case 'static_asset':
      case 'page_homepage':
      case 'page_jobs_index':
        return serveStatic(pathname === '/jobs' || pathname === '/jobs/' ? '/' : pathname, config);
        
      default:
        return serveStatic('/', config);
    }
  },
  
  /**
   * Scheduled job handler - daily job import
   */
  async scheduled(event, env) {
    console.log('[CRON] Multi-board import job started at', new Date().toISOString());
    
    try {
      const config = getConfig(env);
      const jobBoardName = config.ashbyJobBoardName;
      
      // Multi-board mode: use registry
      if (!jobBoardName) {
        console.log('[CRON] ASHBY_JOB_BOARD_NAME not set, using multi-board registry');
        const stats = await importAllAshbyBoards(config);
        
        console.log('[CRON] Multi-board import completed');
        console.log('[CRON] Boards attempted:', stats.boards_attempted);
        console.log('[CRON] Boards succeeded:', stats.boards_succeeded);
        console.log('[CRON] Boards failed:', stats.boards_failed);
        console.log('[CRON] Total jobs fetched:', stats.total_fetched);
        console.log('[CRON] Total imported:', stats.total_imported);
        console.log('[CRON] Total updated:', stats.total_updated);
        console.log('[CRON] Duration:', stats.duration_ms, 'ms');
        
        if (stats.errors.length > 0) {
          console.error('[CRON] Errors:', stats.errors);
        }
        return;
      }
      
      // Backward compatibility: single-board mode
      console.log('[CRON] Using single-board mode for:', jobBoardName);
      const stats = await importAshbyJobsByName(config, jobBoardName);
      
      console.log('[CRON] Single-board import completed:', stats);
      console.log('[CRON] Fetched:', stats.fetched);
      console.log('[CRON] Imported:', stats.imported);
      console.log('[CRON] Updated:', stats.updated);
      console.log('[CRON] Deactivated:', stats.deactivated);
      
    } catch (error) {
      console.error('[CRON] Import failed:', error.message);
      console.error('[CRON] Stack:', error.stack);
    }
  },
};
