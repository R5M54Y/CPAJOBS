/**
 * src/core/seo.js - SEO helpers for metadata generation
 */

export const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const normalizeSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const normalizeCategorySlug = (categoryId) => {
  if (!categoryId) return '';
  return categoryId
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateJobPermalink = (job, baseUrl = '') => {
  if (!job || !job.id) return null;
  const slug = normalizeSlug(job.title || 'job');
  return `${baseUrl}/jobs/${slug}-${job.id}`;
};

export const generateSeoMeta = (options = {}) => {
  const {
    title = 'USA Jobs',
    description = 'Find accounting and finance job opportunities',
    url = 'https://usajobs.usajobs.workers.dev/',
    image = null,
  } = options;

  return {
    title: escapeHtml(title),
    description: escapeHtml(description),
    canonical: url,
    og: {
      title: escapeHtml(title),
      description: escapeHtml(description),
      url,
      type: 'website',
      siteName: 'USA Jobs',
    },
    twitter: {
      card: 'summary_large_image',
      title: escapeHtml(title),
      description: escapeHtml(description),
    },
  };
};

export const generateJobPostingSchema = (job, baseUrl = '') => {
  if (!job || !job.id) return null;

  const jobUrl = generateJobPermalink(job, baseUrl);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    url: jobUrl,
    datePosted: job.created_at,
    validThrough: job.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company || 'USA Jobs',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'US',
      },
    },
  };
};
