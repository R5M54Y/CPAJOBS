/**
 * src/core/routing.js - Request routing logic
 * Determines which handler should process each request
 */

export const ROUTES = {
  // API endpoints
  HEALTH: '/health',
  OFFERS: '/offers',
  OFFERS_DETAIL: /^\/offers\/[\w-]+$/,
  CATEGORIES: '/categories',
  TRACK_CLICK: '/track/click',
  
  // SEO endpoints
  SITEMAP: '/sitemap.xml',
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
  
  // API: Offers list
  if (pathname === ROUTES.OFFERS && pathname.includes('=')) {
    return { type: 'api_offers', pathname };
  }
  if (pathname === ROUTES.OFFERS) {
    return { type: 'api_offers', pathname };
  }
  
  // API: Offer detail
  if (ROUTES.OFFERS_DETAIL.test(pathname)) {
    const offerId = pathname.slice(8);
    return { type: 'api_offer_detail', offerId };
  }
  
  // API: Categories
  if (pathname === ROUTES.CATEGORIES) {
    return { type: 'api_categories' };
  }
  
  // API: Track click
  if (pathname === ROUTES.TRACK_CLICK) {
    return { type: 'api_track_click', pathname };
  }
  
  // SEO: Sitemap
  if (pathname === ROUTES.SITEMAP) {
    return { type: 'seo_sitemap' };
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
