// CPA JOBS KV Store Configuration for Cloudflare KV
// Phase 1: Zero-cost secrets and cache storage

// KV Namespaces - configured in Wrangler TOML
// Each namespace maps to a KV namespace for zero-cost caching

// User session cache
const SESSION_NS = 'cpajobs-sessions';

// Offer cache
const OFFER_NS = 'cpajobs-offers';

// Click tracking cache
const CLICK_NS = 'cpajobs-clicks';

// Conversion tracking cache
const CONVERSION_NS = 'cpajobs-conversions';

// Configuration cache (API keys, feature flags)
const CONFIG_NS = 'cpajobs-config';

// Export namespace names for Wrangler configuration
module.exports = {
  names: {
    SESSION: SESSION_NS,
    OFFER: OFFER_NS,
    CLICK: CLICK_NS,
    CONVERSION: CONVERSION_NS,
    CONFIG: CONFIG_NS,
  },
  // Default TTL for cached items (in seconds)
  // Sessions: 24 hours
  // Offers: 1 hour
  // Click/conversion: 7 days
  // Config: 30 days
  ttl: {
    session: 86400,
    offer: 3600,
    click: 604800,
    config: 2592000,
  },
  // Key naming conventions
  key: {
    session: (sessionId) => `session:${sessionId}`,
    offer: (offerId) => `offer:${offerId}`,
    click: (offerId, timestamp) => `click:${offerId}:${timestamp}`,
    config: (key) => `config:${key}`,
  },
};

// Initialize KV connection
// In production: new kvNamespace(KV_NAMESPACE)
// In development: returns mock implementation for testing
function initKV(namespace) {
  // Will be overridden by Cloudflare Workers binding
  return {
    get: async (key) => null,
    set: async (key, value, ttl) => true,
    delete: async (key) => true,
    list: async (prefix) => [],
  };
}

module.exports.initKV = initKV;