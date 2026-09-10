/**
 * src/main.js - Entry point for CPA JOBS
 * Modular architecture with proper routing
 */

import { importAshbyJobs } from './importers/ashby.js';
import { getConfig, validateConfig } from './core/config.js';
import { routeRequest } from './core/routing.js';
import { getOffers, getOfferDetail, getCategories, trackClick, health } from './handlers/api.js';
import { generateSitemap, serveRobotsTxt } from './handlers/seo.js';
import { serveStatic } from './handlers/static.js';
import { serveJobDetail, serveCategoryPage } from './handlers/pages.js';

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
    console.log('[CRON] Import job started at', new Date().toISOString());
    
    try {
      const config = getConfig(env);
      const jobBoardName = config.ashbyJobBoardName;
      
      if (!jobBoardName) {
        throw new Error('ASHBY_JOB_BOARD_NAME not configured');
      }
      
      const stats = await importAshbyJobs(config, jobBoardName);
      console.log('[CRON] Import completed:', JSON.stringify(stats));
      
      if (stats.errors && stats.errors.length > 0) {
        console.error('[CRON] Import had errors:', stats.errors);
      }
      
      return stats;
    } catch (error) {
      console.error('[CRON] FATAL ERROR:', error.message);
      console.error('[CRON] Stack:', error.stack);
      throw error;
    }
  },
};
