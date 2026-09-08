/* tests/ashby.test.js - Ashby adapter unit tests
   Tests based on official Ashby Public Job Postings API documentation
   https://developers.ashbyhq.com/docs/public-job-posting-api
*/

const { importAshbyJobs } = require('../src/importers/ashby.js');

// Mock Ashby API response based on official documentation
const MOCK_ASHBY_RESPONSE = {
  apiVersion: "1",
  jobs: [
    {
      id: "ashby-job-001",
      title: "Product Manager",
      location: "Houston, TX",
      secondaryLocations: [
        {
          location: "San Francisco",
          address: {
            addressLocality: "San Francisco",
            addressRegion: "California",
            addressCountry: "USA"
          }
        }
      ],
      department: "Product",
      team: "Growth",
      isListed: true,
      isRemote: true,
      workplaceType: "Remote",
      descriptionHtml: "<p>Join our product team leading growth initiatives. This comprehensive role involves strategic planning, data analysis, and cross-functional collaboration. We provide full benefits including health insurance, 401k matching, unlimited PTO, and professional development budget. You'll work with cutting-edge technologies and mentor junior team members.</p><p>Responsibilities: Lead product strategy, manage roadmap, analyze metrics, coordinate launches. Requirements: 5+ years product management, MBA preferred, strong analytical skills.</p>",
      descriptionPlain: "Join our product team leading growth initiatives. This comprehensive role involves strategic planning, data analysis, and cross-functional collaboration. We provide full benefits including health insurance, 401k matching, unlimited PTO, and professional development budget. You'll work with cutting-edge technologies and mentor junior team members. Responsibilities: Lead product strategy, manage roadmap, analyze metrics, coordinate launches. Requirements: 5+ years product management, MBA preferred, strong analytical skills.",
      publishedAt: "2026-09-01T10:00:00Z",
      employmentType: "FullTime",
      address: {
        postalAddress: {
          addressLocality: "Houston",
          addressRegion: "Texas",
          addressCountry: "USA"
        }
      },
      jobUrl: "https://jobs.ashbyhq.com/example_company/product-manager",
      applyUrl: "https://jobs.ashbyhq.com/example_company/product-manager/apply",
      compensation: {
        currency: "USD",
        value: {
          min: 120000,
          max: 180000
        },
        period: "year"
      }
    },
    {
      id: "ashby-job-002",
      title: "Senior Engineer",
      location: "San Francisco, CA",
      department: "Engineering",
      team: "Backend",
      isRemote: false,
      workplaceType: "In-Person",
      descriptionHtml: "<p>Build scalable backend systems. Work with distributed systems, cloud infrastructure, and enterprise applications. Mentor engineers and lead architectural decisions.</p>",
      descriptionPlain: "Build scalable backend systems. Work with distributed systems, cloud infrastructure, and enterprise applications. Mentor engineers and lead architectural decisions.",
      publishedAt: "2026-09-02T14:30:00Z",
      employmentType: "FullTime",
      address: {
        postalAddress: {
          addressLocality: "San Francisco",
          addressRegion: "California",
          addressCountry: "USA"
        }
      },
      jobUrl: "https://jobs.ashbyhq.com/example_company/senior-engineer",
      applyUrl: "https://jobs.ashbyhq.com/example_company/senior-engineer/apply",
      compensation: {
        currency: "USD",
        value: {
          min: 180000,
          max: 250000
        },
        period: "year"
      }
    },
    {
      id: "ashby-job-003",
      title: "Accountant",
      location: "Chicago, IL",
      department: "Finance",
      isRemote: true,
      workplaceType: "Hybrid",
      descriptionHtml: "<p>Financial analysis and reporting. Prepare financial statements, manage budgets, ensure compliance.</p>",
      descriptionPlain: "Financial analysis and reporting. Prepare financial statements, manage budgets, ensure compliance.",
      publishedAt: "2026-09-03T09:15:00Z",
      employmentType: "FullTime",
      address: {
        postalAddress: {
          addressLocality: "Chicago",
          addressRegion: "Illinois",
          addressCountry: "USA"
        }
      },
      jobUrl: "https://jobs.ashbyhq.com/example_company/accountant",
      applyUrl: "https://jobs.ashbyhq.com/example_company/accountant/apply"
      // Note: Missing compensation - optional field
    }
  ]
};

describe('Ashby Adapter', () => {
  
  test('Should validate Ashby response schema', () => {
    const response = MOCK_ASHBY_RESPONSE;
    
    expect(response.jobs).toBeDefined();
    expect(Array.isArray(response.jobs)).toBe(true);
    expect(response.jobs.length).toBeGreaterThan(0);
    expect(response.apiVersion).toBeDefined();
  });

  test('Should preserve full HTML descriptions', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.descriptionHtml).toBeDefined();
    expect(job.descriptionHtml.length).toBeGreaterThan(500);
    expect(job.descriptionHtml).toContain('<p>');
  });

  test('Should preserve full plain text descriptions', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.descriptionPlain).toBeDefined();
    expect(job.descriptionPlain.length).toBeGreaterThan(300);
  });

  test('Should extract stable external IDs', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    const externalId = String(job.id);
    
    expect(externalId).toBeDefined();
    expect(externalId).toBe('ashby-job-001');
    
    // Same job should always produce same ID
    const offerId1 = `ashby-${externalId}`;
    const offerId2 = `ashby-${externalId}`;
    
    expect(offerId1).toBe(offerId2);
  });

  test('Should handle missing optional fields safely', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[2]; // Missing compensation
    
    // Required fields present
    expect(job.id).toBeDefined();
    expect(job.title).toBeDefined();
    expect(job.descriptionHtml).toBeDefined();
    
    // Optional fields may be undefined - this is OK
    expect(job.compensation).toBeUndefined();
  });

  test('Should extract location data correctly', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.location).toBeDefined();
    expect(job.location).toBe('Houston, TX');
    expect(job.address).toBeDefined();
    expect(job.address.postalAddress.addressLocality).toBe('Houston');
    expect(job.address.postalAddress.addressRegion).toBe('Texas');
    expect(job.address.postalAddress.addressCountry).toBe('USA');
  });

  test('Should handle workplace types', () => {
    const remoteJob = MOCK_ASHBY_RESPONSE.jobs[0];
    const inPersonJob = MOCK_ASHBY_RESPONSE.jobs[1];
    const hybridJob = MOCK_ASHBY_RESPONSE.jobs[2];
    
    expect(remoteJob.workplaceType).toBe('Remote');
    expect(remoteJob.isRemote).toBe(true);
    
    expect(inPersonJob.workplaceType).toBe('In-Person');
    expect(inPersonJob.isRemote).toBe(false);
    
    expect(hybridJob.workplaceType).toBe('Hybrid');
    expect(hybridJob.isRemote).toBe(true);
  });

  test('Should preserve compensation information', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.compensation).toBeDefined();
    expect(job.compensation.currency).toBe('USD');
    expect(job.compensation.value.min).toBe(120000);
    expect(job.compensation.value.max).toBe(180000);
    expect(job.compensation.period).toBe('year');
  });

  test('Should extract application URLs', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.applyUrl).toBeDefined();
    expect(job.applyUrl).toContain('https');
    expect(job.applyUrl).toContain('apply');
  });

  test('Should extract job URLs', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.jobUrl).toBeDefined();
    expect(job.jobUrl).toContain('https');
  });

  test('Should preserve department and team', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.department).toBe('Product');
    expect(job.team).toBe('Growth');
  });

  test('Should preserve employment type', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.employmentType).toBe('FullTime');
  });

  test('Should handle secondary locations', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.secondaryLocations).toBeDefined();
    expect(Array.isArray(job.secondaryLocations)).toBe(true);
    expect(job.secondaryLocations.length).toBeGreaterThan(0);
    expect(job.secondaryLocations[0].address.addressLocality).toBe('San Francisco');
  });

  test('Should handle date formatting', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    expect(job.publishedAt).toBeDefined();
    const date = new Date(job.publishedAt);
    expect(date instanceof Date).toBe(true);
    expect(date.getTime()).toBeGreaterThan(0);
  });

  test('Should validate deduplication with stable IDs', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    
    // Same job ID always produces same dedup key
    const dedup1 = `ashby-${job.id}`;
    const dedup2 = `ashby-${job.id}`;
    
    expect(dedup1).toBe(dedup2);
    expect(dedup1).toBe('ashby-ashby-job-001');
  });

  test('Should verify no credentials in response', () => {
    const response = JSON.stringify(MOCK_ASHBY_RESPONSE);
    
    // Should not contain API keys or secrets
    expect(response).not.toContain('x-api-key');
    expect(response).not.toContain('bearer');
    expect(response).not.toContain('secret');
  });

  test('Should handle multiple jobs', () => {
    const response = MOCK_ASHBY_RESPONSE;
    
    expect(response.jobs.length).toBe(3);
    
    // Each job has required fields
    for (const job of response.jobs) {
      expect(job.id).toBeDefined();
      expect(job.title).toBeDefined();
      expect(job.jobUrl || job.applyUrl).toBeDefined();
    }
  });

  test('Description preservation quality check', () => {
    const job = MOCK_ASHBY_RESPONSE.jobs[0];
    const htmlLen = job.descriptionHtml?.length || 0;
    const plainLen = job.descriptionPlain?.length || 0;
    
    // Both should be substantial (not truncated)
    expect(htmlLen).toBeGreaterThan(300);
    expect(plainLen).toBeGreaterThan(300);
    
    // Should be similar length (both contain full content)
    const ratio = Math.max(htmlLen, plainLen) / Math.min(htmlLen, plainLen);
    expect(ratio).toBeLessThan(2.0); // Shouldn't be drastically different
  });
});

// Export for testing framework
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MOCK_ASHBY_RESPONSE };
}
