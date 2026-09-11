#!/usr/bin/env node

/* Standalone test runner for logo extraction
   Run with: node test-logo-extraction.js
*/

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Inline minimal logo extraction for standalone testing
async function extractLogoFromPage(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CPA-JOBS-MVP/1.0 (Logo Test)',
        'Accept': 'text/html'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { logoUrl: null, source: null, error: `HTTP ${response.status}` };
    }

    const html = await response.text();

    // Try JSON-LD
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item['@type'] === 'Organization' && item.logo) {
            const logoUrl = typeof item.logo === 'string' ? item.logo : item.logo.url;
            if (logoUrl && logoUrl.startsWith('http')) {
              return { logoUrl, source: 'jsonld_org', error: null };
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Try og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (ogMatch && ogMatch[1] && ogMatch[1].startsWith('http')) {
      return { logoUrl: ogMatch[1], source: 'og_image', error: null };
    }

    // Try img with logo indicator
    const imgRegex = /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']+)["']/gi;
    let imgMatch;

    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const alt = imgMatch[1].toLowerCase();
      const src = imgMatch[2];

      if ((alt.includes('logo') || alt.includes('brand')) && src.startsWith('http')) {
        return { logoUrl: src, source: 'img_tag', error: null };
      }
    }

    return { logoUrl: null, source: null, error: 'No logo found' };

  } catch (err) {
    if (err.name === 'AbortError') {
      return { logoUrl: null, source: null, error: 'Timeout (8s)' };
    }
    return { logoUrl: null, source: null, error: err.message };
  }
}

// Test data: Real Ashby companies
const testCases = [
  {
    company: 'OpenAI',
    applyUrl: 'https://jobs.ashbyhq.com/openai/8fb1615c-34bf-47c4-a1d1-b7b2f836bbd3/application'
  },
  {
    company: 'Ramp',
    applyUrl: 'https://jobs.ashbyhq.com/ramp/abc123/application'
  },
  {
    company: 'Replit',
    applyUrl: 'https://jobs.ashbyhq.com/replit/def456/application'
  },
  {
    company: 'Linear',
    applyUrl: 'https://jobs.ashbyhq.com/linear/ghi789/application'
  },
  {
    company: 'Notion',
    applyUrl: 'https://jobs.ashbyhq.com/notion/jkl012/application'
  }
];

async function runTests() {
  console.log('========================================');
  console.log('COMPANY LOGO EXTRACTION TEST');
  console.log('========================================\n');

  let successful = 0;
  const results = [];

  for (const testCase of testCases) {
    console.log(`Testing ${testCase.company}...`);
    
    const start = Date.now();
    const result = await extractLogoFromPage(testCase.applyUrl);
    const duration = Date.now() - start;

    const status = result.logoUrl ? '✅' : '❌';
    console.log(`${status} ${testCase.company}`);

    if (result.logoUrl) {
      console.log(`   Logo URL: ${result.logoUrl}`);
      console.log(`   Source: ${result.source}`);
      successful++;
    } else {
      console.log(`   Error: ${result.error}`);
    }

    console.log(`   Time: ${duration}ms\n`);

    results.push({
      company: testCase.company,
      success: !!result.logoUrl,
      logoUrl: result.logoUrl,
      source: result.source,
      error: result.error,
      duration
    });
  }

  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total: ${testCases.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${testCases.length - successful}`);
  console.log(`Success rate: ${((successful / testCases.length) * 100).toFixed(1)}%`);
  console.log(`Average time: ${(results.reduce((sum, r) => sum + r.duration, 0) / results.length).toFixed(0)}ms`);

  console.log('\n========================================');
  console.log('RESULTS TABLE');
  console.log('========================================\n');

  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} | ${result.company.padEnd(12)} | ${result.source || 'N/A'.padEnd(12)} | ${result.duration}ms`);
    if (result.logoUrl) {
      console.log(`      URL: ${result.logoUrl}`);
    }
  }
}

runTests().catch(console.error);
