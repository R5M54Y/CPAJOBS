/* src/importers/company-logo.js - Company Logo Extraction from Apply URLs
   
   Extracts company logo URLs from actual job application pages.
   
   Priority hierarchy:
   1. JSON-LD Organization.logo
   2. Open Graph og:image
   3. <img> elements with logo/branding indicators
   4. Favicon (last resort)
   
   Design principles:
   - Fail gracefully: job import never blocked by logo extraction failure
   - Performance: bounded fetch timeout, response size limits
   - Caching: avoid refetching same company domain
   - Safety: validate URLs, reject tracking pixels
*/

const LOGO_FETCH_TIMEOUT = 8000; // 8 seconds max per page
const MAX_RESPONSE_SIZE = 500 * 1024; // 500KB limit for HTML pages
const MIN_LOGO_SIZE = 100; // Minimum expected logo dimension (width/height in URL params)

// In-memory cache for logo URLs by domain (per-request lifecycle)
const domainLogoCache = new Map();

/**
 * Extract company logo URL from apply page
 * @param {string} applyUrl - Job application URL
 * @returns {Promise<{logoUrl: string|null, source: string|null}>}
 */
export async function extractCompanyLogo(applyUrl) {
  if (!applyUrl) {
    return { logoUrl: null, source: null };
  }

  try {
    // Extract domain for caching
    const domain = new URL(applyUrl).hostname;
    
    // Check cache first
    if (domainLogoCache.has(domain)) {
      return domainLogoCache.get(domain);
    }

    // Fetch the apply page
    const html = await fetchApplyPage(applyUrl);
    if (!html) {
      return { logoUrl: null, source: null };
    }

    // Try extraction methods in priority order
    let result = extractFromJsonLd(html, applyUrl) ||
                 extractFromOpenGraph(html, applyUrl) ||
                 extractFromImageTags(html, applyUrl) ||
                 extractFromFavicon(html, applyUrl);

    // Validate and cache result
    if (result && result.logoUrl) {
      result.logoUrl = validateLogoUrl(result.logoUrl);
    }

    if (!result || !result.logoUrl) {
      result = { logoUrl: null, source: null };
    }

    // Cache result for this domain
    domainLogoCache.set(domain, result);

    return result;

  } catch (err) {
    console.error(`Logo extraction failed for ${applyUrl}:`, err.message);
    return { logoUrl: null, source: null };
  }
}

/**
 * Fetch apply page HTML with safety limits
 */
async function fetchApplyPage(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CPA-JOBS-MVP/1.0 (Logo Extraction)',
        'Accept': 'text/html'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return null;
    }

    // Read with size limit
    const reader = response.body.getReader();
    const chunks = [];
    let totalSize = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalSize += value.length;
      if (totalSize > MAX_RESPONSE_SIZE) {
        reader.cancel();
        break;
      }

      chunks.push(value);
    }

    const decoder = new TextDecoder('utf-8');
    return decoder.decode(concatenateUint8Arrays(chunks));

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`Fetch timeout for ${url}`);
    }
    return null;
  }
}

/**
 * Extract logo from JSON-LD structured data (highest priority)
 */
function extractFromJsonLd(html, baseUrl) {
  try {
    // Find all JSON-LD script tags
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);

        // Handle single object or array
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // Look for Organization schema
          if (item['@type'] === 'Organization' && item.logo) {
            const logoUrl = typeof item.logo === 'string' ? item.logo : item.logo.url;
            if (logoUrl) {
              return {
                logoUrl: resolveUrl(logoUrl, baseUrl),
                source: 'apply_page_jsonld'
              };
            }
          }

          // Check nested hiringOrganization in JobPosting
          if (item['@type'] === 'JobPosting' && item.hiringOrganization?.logo) {
            const logo = item.hiringOrganization.logo;
            const logoUrl = typeof logo === 'string' ? logo : logo.url;
            if (logoUrl) {
              return {
                logoUrl: resolveUrl(logoUrl, baseUrl),
                source: 'apply_page_jsonld'
              };
            }
          }
        }
      } catch (parseErr) {
        // Invalid JSON-LD, continue to next
        continue;
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Extract logo from Open Graph meta tags
 */
function extractFromOpenGraph(html, baseUrl) {
  try {
    // Look for og:image
    const ogImageRegex = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
    const match = html.match(ogImageRegex);

    if (match && match[1]) {
      const url = match[1];
      // Validate it's not a generic social share image
      if (!isGenericSocialImage(url)) {
        return {
          logoUrl: resolveUrl(url, baseUrl),
          source: 'apply_page_og'
        };
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Extract logo from <img> tags with branding indicators
 */
function extractFromImageTags(html, baseUrl) {
  try {
    // Find img tags in header/nav sections (most likely to contain logo)
    const headerRegex = /<header[\s\S]*?<\/header>/i;
    const navRegex = /<nav[\s\S]*?<\/nav>/i;
    
    const headerMatch = html.match(headerRegex);
    const navMatch = html.match(navRegex);
    
    const searchAreas = [
      headerMatch ? headerMatch[0] : '',
      navMatch ? navMatch[0] : '',
      html.substring(0, 10000) // First 10KB as fallback
    ].join('\n');

    // Find img tags with logo/brand indicators
    const imgRegex = /<img[^>]*>/gi;
    const imgs = searchAreas.match(imgRegex) || [];

    for (const imgTag of imgs) {
      // Check for logo indicators in alt, class, id
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
      const classMatch = imgTag.match(/class=["']([^"']*)["']/i);
      const idMatch = imgTag.match(/id=["']([^"']*)["']/i);
      
      const alt = altMatch ? altMatch[1].toLowerCase() : '';
      const className = classMatch ? classMatch[1].toLowerCase() : '';
      const id = idMatch ? idMatch[1].toLowerCase() : '';

      const combined = `${alt} ${className} ${id}`;

      // Strong logo indicators
      if (combined.includes('logo') || 
          combined.includes('brand') ||
          (combined.includes('company') && combined.includes('image'))) {
        
        // Extract src
        const srcMatch = imgTag.match(/src=["']([^"']*)["']/i);
        if (srcMatch && srcMatch[1]) {
          const url = srcMatch[1];
          // Skip tracking pixels and tiny images
          if (!isTrackingPixel(url)) {
            return {
              logoUrl: resolveUrl(url, baseUrl),
              source: 'apply_page_img'
            };
          }
        }
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Extract favicon as last resort
 */
function extractFromFavicon(html, baseUrl) {
  try {
    // Look for high-res favicon links
    const faviconRegex = /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/gi;
    let match;
    const favicons = [];

    while ((match = faviconRegex.exec(html)) !== null) {
      favicons.push(match[1]);
    }

    // Prefer larger icons
    for (const favicon of favicons) {
      if (favicon.includes('192') || favicon.includes('180') || favicon.includes('apple')) {
        return {
          logoUrl: resolveUrl(favicon, baseUrl),
          source: 'apply_page_favicon'
        };
      }
    }

    // Fallback to any favicon
    if (favicons.length > 0) {
      return {
        logoUrl: resolveUrl(favicons[0], baseUrl),
        source: 'apply_page_favicon'
      };
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url, baseUrl) {
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const base = new URL(baseUrl);
    
    if (url.startsWith('//')) {
      return `${base.protocol}${url}`;
    }
    
    if (url.startsWith('/')) {
      return `${base.protocol}//${base.host}${url}`;
    }
    
    // Relative path
    return new URL(url, baseUrl).href;
  } catch (err) {
    return url;
  }
}

/**
 * Validate logo URL and reject obvious tracking pixels
 */
function validateLogoUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    
    // Must be http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Reject tracking/analytics domains
    const hostname = parsed.hostname.toLowerCase();
    const trackingDomains = [
      'google-analytics.com',
      'googletagmanager.com',
      'facebook.com',
      'doubleclick.net',
      'ads.linkedin.com',
      'pixel',
      'track',
      'analytics'
    ];

    if (trackingDomains.some(domain => hostname.includes(domain))) {
      return null;
    }

    // Reject data URLs (not practical for storage)
    if (url.startsWith('data:')) {
      return null;
    }

    return url;
  } catch (err) {
    return null;
  }
}

/**
 * Check if URL is likely a tracking pixel
 */
function isTrackingPixel(url) {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('1x1') ||
         lowerUrl.includes('pixel') ||
         lowerUrl.includes('track') ||
         lowerUrl.includes('analytics') ||
         lowerUrl.includes('beacon') ||
         lowerUrl.match(/\b(1|2|3|4|5)x(1|2|3|4|5)\b/);
}

/**
 * Check if image is generic social share preview
 */
function isGenericSocialImage(url) {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('og-image') ||
         lowerUrl.includes('social-share') ||
         lowerUrl.includes('twitter-card') ||
         lowerUrl.includes('share-preview');
}

/**
 * Concatenate Uint8Array chunks
 */
function concatenateUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Clear domain cache (useful for testing)
 */
export function clearLogoCache() {
  domainLogoCache.clear();
}
