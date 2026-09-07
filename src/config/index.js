/* src/config/index.js - Configuration management
   Phase 0: Foundation - Zero-cost configuration */

// Environment configuration
const config = {
  // Cloudflare configuration
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    // Using empty strings by default for zero-cost setup
  },
  // D1 database configuration
  d1: {
    databaseName: process.env.D1_DATABASE_NAME || 'cpajobs-db',
  },
  // Application settings
  app: {
    name: process.env.APP_NAME || 'CPAJOBS',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    // Zero-cost: No AI by default
    aiEnabled: process.env.ENABLE_AI === 'true' ? true : false,
  },
  // KV cache configuration
  kv: {
    namespace: process.env.KV_NAMESPACE || 'cpajobs-cache',
  },
};

// Validate required config
if (!config.cloudflare.accountId) {
  console.warn('CLOUDFLARE_ACCOUNT_ID not set - using development defaults');
}

if (!config.cloudflare.apiToken) {
  console.warn('CLOUDFLARE_API_TOKEN not set - using development defaults');
}

module.exports = config;
console.log('CPA JOBS - Configuration initialized (Phase 0)');
