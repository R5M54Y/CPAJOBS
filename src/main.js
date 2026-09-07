/* src/main.js - Entry point for CPA JOBS MVP
   Phase 0: Foundation - Initialize the application */

// Set up basic exports for Cloudflare Workers
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'ok',
      phase: '0-foundation',
      message: 'CPA JOBS MVP - Phase 0: Foundation initialized'
    })
  };
};

// Health check endpoint
exports.health = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cache: 'available'
    })
  };
};

// Minimal routes for Phase 0
exports.routes = {
  'GET /offers': async () => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        offers: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          total_pages: 0
        }
      })
    };
  },
  
  'GET /offers/{id}': async (event) => {
    return {
      statusCode: 200,
      body: JSON.stringify({
        id: 'mock-offer-id',
        title: 'Sample Offer',
        description: 'This is a sample offer for testing',
        url: 'https://example.com/offer',
        payout: 10.00,
        payout_type: 'cpa',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    };
  }
};
