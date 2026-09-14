/**
 * src/core/routing.js - Request routing logic
 * Determines which handler should process each request
 */

export const ROUTES = {
  // API endpoints
  HEALTH: '/health',
  MANUAL_SYNC: '/api/manual-sync', // TEMPORARY for MVP verification
  LOGO_TEST: '/api/admin/logo-test', // TEMPORARY for logo testing
  LOGO_BACKFILL: '/api/admin/logo-backfill', // TEMPORARY for logo backfill
  OFFERS: '/api/offers',
  OFFERS_DETAIL: /^\/api\/offers\/[\w-]+$/,
  CATEGORIES: '/api/categories',
  TRACK_CLICK: '/api/track/click',
  APPLY: '/api/apply',
  
  // SEO endpoints
  SITEMAP: '/sitemap.xml',
  SITEMAP_PAGES: '/sitemap-pages.xml',
  SITEMAP_JOBS: '/sitemap-jobs.xml',
  ROBOTS: '/robots.txt',
  
  // Job detail pages (SEO)
  JOBS_CATEGORY: /^\/jobs\/category\/.+/,
  JOBS_DETAIL: /^\/jobs\/[\w-]+-[\w-]+$/,
  JOBS_INDEX: /^\/jobs\/?$/,
  
  // Static assets
  STATIC: /^\/(css|js|assets)\//,
};

export const routeRequest = (pathname) => {
  // Health check
  if (pathname === ROUTES.HEALTH) {
    return { type: 'health' };
  }
  
  // TEMPORARY: Manual sync trigger
  if (pathname === ROUTES.MANUAL_SYNC) {
    return { type: 'api_manual_sync' };
  }
  
  // TEMPORARY: Logo extraction test
  if (pathname === ROUTES.LOGO_TEST) {
    return { type: 'api_logo_test' };
  }
  
  // TEMPORARY: Logo backfill
  if (pathname === ROUTES.LOGO_BACKFILL) {
    return { type: 'api_logo_backfill' };
  }
  
  // API: Offers list
  if (pathname.startsWith('/api/offers')) {
    if (ROUTES.OFFERS_DETAIL.test(pathname)) {
      // API: Offer detail /api/offers/{id}
      const offerId = pathname.slice(12); // '/api/offers/'.length = 12
      return { type: 'api_offer_detail', offerId };
    }
    // API: Offers list /api/offers or /api/offers?query
    return { type: 'api_offers', pathname };
  }
  
  // API: Categories
  if (pathname === '/api/categories') {
    return { type: 'api_categories' };
  }
  
  // API: Track click
  if (pathname === '/api/track/click') {
    return { type: 'api_track_click', pathname };
  }
  
  // API: Apply verification
  if (pathname === '/api/apply') {
    return { type: 'api_apply', pathname };
  }
  
  // SEO: Sitemap index
  if (pathname === ROUTES.SITEMAP) {
    return { type: 'seo_sitemap_index' };
  }
  
  // SEO: Pages sitemap
  if (pathname === ROUTES.SITEMAP_PAGES) {
    return { type: 'seo_sitemap_pages' };
  }
  
  // SEO: Jobs sitemap
  if (pathname === ROUTES.SITEMAP_JOBS) {
    return { type: 'seo_sitemap_jobs' };
  }
  
  // SEO: Robots
  if (pathname === ROUTES.ROBOTS) {
    return { type: 'seo_robots' };
  }
  
  // SEO: Job category landing page
  if (ROUTES.JOBS_CATEGORY.test(pathname)) {
    const categorySlug = pathname.slice(15); // '/jobs/category/' is 15 chars
    return { type: 'page_category', categorySlug };
  }
  
  // SEO: Job detail page
  if (ROUTES.JOBS_DETAIL.test(pathname)) {
    return { type: 'page_job_detail', pathname };
  }
  
  // SEO: Jobs index
  if (ROUTES.JOBS_INDEX.test(pathname)) {
    return { type: 'page_jobs_index' };
  }
  
  // Static assets
  if (ROUTES.STATIC.test(pathname)) {
    return { type: 'static_asset', pathname };
  }
  
  // Default: homepage
  if (pathname === '/' || pathname === '/index.html') {
    return { type: 'page_homepage' };
  }
  
  // 404
  return { type: 'not_found', pathname };
};
