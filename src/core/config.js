/**
 * src/core/config.js - Configuration management
 * Load deployment-specific configuration from environment or defaults
 */

export const getConfig = (env) => {
  return {
    // Canonical hostname (site-specific)
    canonicalHostname: env.CANONICAL_HOSTNAME || 'usajobs.usajobs.workers.dev',
    
    // Ashby job board identifier (site-specific)
    ashbyJobBoardName: env.ASHBY_JOB_BOARD_NAME || '',
    
    // Environment
    environment: env.ENVIRONMENT || 'production',
    
    // Database and KV bindings injected by Wrangler
    db: env.DB,
    kv: env.CPAJOBS_KV,
  };
};

export const validateConfig = (config) => {
  const errors = [];
  
  if (!config.db) {
    errors.push('D1 database binding (DB) is required');
  }
  
  if (!config.kv) {
    errors.push('KV namespace binding (CPAJOBS_KV) is required');
  }
  
  return errors;
};
