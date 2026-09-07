/* src/routes/index.js - API Routes for CPA JOBS MVP
   Phase 0: Foundation - Basic route handlers */

// Offer listing route
exports.listOffers = async (params = {}) => {
  const { category, status, page = 1, limit = 20 } = params;
  
  // Phase 0: Return empty list - full implementation in later phases
  return {
    offers: [],
    pagination: {
      page,
      limit,
      total: 0,
      total_pages: 0
    }
  };
};

// Offer detail route
exports.getOffer = async (id) => {
  // Phase 0: Return mock offer - full implementation in later phases
  return {
    id,
    title: 'Sample Offer',
    description: 'This is a sample offer for testing',
    url: 'https://example.com/offer',
    payout: 10.00,
    payout_type: 'cpa',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

// Category listing route
exports.listCategories = async () => {
  // Phase 0: Return empty list - full implementation in later phases
  return {
    categories: []
  };
};

// Click tracking route
exports.trackClick = async (clickData) => {
  // Phase 0: Record click - basic implementation
  return {
    success: true,
    click_id: crypto ? crypto.randomUUID() : 'mock-click-id',
    message: 'Click tracked successfully'
  };
};

// Conversion tracking route
exports.trackConversion = async (conversionData) => {
  // Phase 0: Record conversion - basic implementation
  return {
    success: true,
    conversion_id: crypto ? crypto.randomUUID() : 'mock-conversion-id',
    message: 'Conversion tracked successfully'
  };
};
