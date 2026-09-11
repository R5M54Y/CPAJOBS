/* Temporary API endpoint for logo extraction testing and backfill
   
   POST /api/admin/logo-test - Test logo extraction on sample jobs
   POST /api/admin/logo-backfill - Run one-time backfill on existing jobs
   
   IMPORTANT: Remove this endpoint after testing
*/

import { testLogoExtraction, formatTestReport } from '../importers/company-logo-test.js';
import { backfillCompanyLogos, formatBackfillReport } from '../importers/company-logo-backfill.js';

/**
 * Handle logo extraction admin endpoints
 */
export async function handleLogoAdminRequest(request, config) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Test endpoint
  if (pathname === '/api/admin/logo-test' && request.method === 'POST') {
    try {
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);
      const results = await testLogoExtraction(config, limit);
      const report = formatTestReport(results);
      
      return new Response(report, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    } catch (err) {
      return new Response(`Test error: ${err.message}`, { status: 500 });
    }
  }

  // Backfill endpoint
  if (pathname === '/api/admin/logo-backfill' && request.method === 'POST') {
    try {
      const stats = await backfillCompanyLogos(config);
      const report = formatBackfillReport(stats);
      
      return new Response(report, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    } catch (err) {
      return new Response(`Backfill error: ${err.message}`, { status: 500 });
    }
  }

  return null;
}
