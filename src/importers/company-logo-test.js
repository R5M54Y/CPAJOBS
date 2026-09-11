/* Test company logo extraction with real Ashby data
   
   Tests logo extraction against actual apply URLs from the database
   Reports success/failure for each company
*/

import { extractCompanyLogo, clearLogoCache } from './company-logo.js';

/**
 * Test logo extraction for sample jobs
 * @param {Object} config - Configuration with DB binding
 * @returns {Promise<Array>} Test results for each job
 */
export async function testLogoExtraction(config, limit = 10) {
  const results = [];

  try {
    // Get sample jobs with apply URLs from different companies
    const { results: jobs } = await config.db.prepare(`
      SELECT 
        o.id, 
        o.title,
        o.apply_url,
        ab.company_name
      FROM offers o
      JOIN ashby_boards ab ON o.source_id = 'ashby-' || ab.board_name
      WHERE o.apply_url IS NOT NULL
      GROUP BY ab.board_name
      LIMIT ?
    `).bind(limit).all();

    if (!jobs || jobs.length === 0) {
      console.log('No jobs found for testing');
      return results;
    }

    console.log(`Testing logo extraction for ${jobs.length} companies...\n`);

    for (const job of jobs) {
      const result = {
        company: job.company_name,
        applyUrl: job.apply_url,
        jobTitle: job.title,
        logoUrl: null,
        source: null,
        success: false,
        duration: 0,
        error: null
      };

      try {
        const startTime = Date.now();
        const logoResult = await extractCompanyLogo(job.apply_url);
        const duration = Date.now() - startTime;

        result.duration = duration;
        result.logoUrl = logoResult.logoUrl;
        result.source = logoResult.source;
        result.success = !!logoResult.logoUrl;

      } catch (err) {
        result.error = err.message;
      }

      results.push(result);

      // Print result
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.company}`);
      console.log(`   URL: ${result.applyUrl}`);
      if (result.logoUrl) {
        console.log(`   Logo: ${result.logoUrl}`);
        console.log(`   Source: ${result.source}`);
      } else if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log(`   Time: ${result.duration}ms\n`);
    }

  } catch (err) {
    console.error('Test failed:', err);
  }

  return results;
}

/**
 * Report test results
 */
export function formatTestReport(results) {
  if (results.length === 0) {
    return 'No test results available';
  }

  const successful = results.filter(r => r.success).length;
  const rate = ((successful / results.length) * 100).toFixed(1);
  const avgTime = (results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(0);

  let report = `
=== LOGO EXTRACTION TEST REPORT ===
Total tested: ${results.length}
Successful: ${successful}
Failed: ${results.length - successful}
Success rate: ${rate}%
Average time: ${avgTime}ms

DETAILED RESULTS:
`;

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    report += `\n${status} - ${result.company}`;
    report += `\n  Job: ${result.jobTitle}`;
    report += `\n  Apply URL: ${result.applyUrl}`;
    if (result.logoUrl) {
      report += `\n  Logo: ${result.logoUrl}`;
      report += `\n  Source: ${result.source}`;
    } else if (result.error) {
      report += `\n  Error: ${result.error}`;
    }
    report += `\n  Time: ${result.duration}ms`;
  }

  return report;
}
