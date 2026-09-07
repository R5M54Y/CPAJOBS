// CPA JOBS API Routes for Cloudflare Workers
// Phase 1: Core API implementation with D1 database

// Database connection - will be initialized in main.js
// In Cloudflare Workers: exported as `wrangler` binding
// In development: mock implementation

// Helper functions for database operations
async function getDB() {
  // This will be replaced with actual D1 connection in Workers
  // For now, return mock for development
  return {
    query: async (sql, params = []) => ({
      rows: [],
      exec: async () => true,
    })
  };
}

// Route handlers

// GET /offers - List all offers with optional filtering
async function listOffers(params = {}) {
  // Validate parameters
  const { category, status, page = 1, limit = 20 } = params;

  // Build SQL query
  let sql = 'SELECT * FROM offers WHERE 1=1';
  const paramsArray = [];

  if (category) {
    sql += ' AND category_id = $1';
    paramsArray.push(category);
  }

  if (status) {
    sql += ' AND status = $2';
    paramsArray.push(status);
  }

  sql += ' ORDER BY created_at DESC';
  sql += ' LIMIT $3 OFFSET $4';
  paramsArray.push(limit, (page - 1) * limit);

  // Execute query
  const db = await getDB();
  const result = await db.query(sql, paramsArray);

  // Return mock data since D1 not yet connected
  return {
    offers: [
      {
        id: 'mock-offer-id-1',
        title: 'Sample Offer 1',
        description: 'This is a sample offer for testing',
        url: 'https://example.com/offer1',
        payout: 10.00,
        payout_type: 'cpa',
        status: status || 'active',
        category_id: category || null,
        click_count: 100,
        conversion_count: 10,
        revenue: 500.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      total_pages: 8
    }
  };
}

// GET /offers/:id - Get detailed information about a specific offer
async function getOffer(id) {
  // Validate ID
  if (!id || typeof id !== 'string') {
    return {
      error: 'Bad Request',
      message: 'Offer ID is required'
    };
  }

  // Build SQL query
  const sql = 'SELECT * FROM offers WHERE id = $1';
  const paramsArray = [id];

  // Execute query
  const db = await getDB();
  const result = await db.query(sql, paramsArray);

  // Return mock data since D1 not yet connected
  return {
    id: 'mock-offer-id',
    title: 'Sample Offer',
    description: 'This is a sample offer for testing',
    url: 'https://example.com/offer',
    payout: 10.00,
    payout_type: 'cpa',
    requirements: ['req1', 'req2'],
    status: 'active',
    click_count: 100,
    conversion_count: 10,
    revenue: 500.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {}
  };
}

// POST /track/click - Track a click on an offer
async function trackClick(clickData, env) {
  // Validate required fields
  if (!clickData || !clickData.offer_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Bad Request',
        message: 'offer_id is required'
      })
    };
  }

  const ipAddress = clickData.ip_address || 'unknown';
  const userAgent = clickData.user_agent || '';
  const timestamp = Date.now();
  const idempotencyKey = `${clickData.offer_id}-${ipAddress}-${Math.floor(timestamp / 300)}`;
  const clickId = `click-${idempotencyKey}-${timestamp}`;

  try {
    // Check idempotency: Query clicks table for same offer_id + ip_address + timestamp ± 5 min
    if (event && event.env && event.env.DB) {
      const existingClick = await event.env.DB.prepare(
        'SELECT id FROM clicks WHERE offer_id = ? AND ip_address = ? AND timestamp >= datetime(CURRENT_TIMESTAMP, \"-5 minute\")'
      ).bind(clickData.offer_id, ipAddress).all();

      if (existingClick.results?.length > 0) {
        // Duplicate click within 5 minutes - return existing click_id
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            click_id: existingClick.results[0].id,
            message: 'Click tracked successfully (duplicate ignored)'
          })
        };
      }
    }

    // Insert click into D1 database
    const clickRecordId = `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (event && event.env && event.env.DB) {
      await event.env.DB.prepare(
        `INSERT INTO clicks (id, offer_id, user_id, ip_address, user_agent, referrer, timestamp, metadata)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
      ).bind(
        clickRecordId,
        clickData.offer_id,
        clickData.user_id || null,
        ipAddress,
        userAgent,
        clickData.referrer || null,
        JSON.stringify(clickData.metadata || {})
      ).run();

      // Update offer: Increment click_count
      await event.env.DB.prepare(
        'UPDATE offers SET click_count = click_count + 1 WHERE id = ?'
      ).bind(clickData.offer_id).run();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        click_id: clickId,
        message: 'Click tracked successfully'
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: err.message
      })
    };
  }
}

// POST /track/conversion - Track a conversion from an offer
async function trackConversion(conversionData) {
  // Validate required fields
  if (!conversionData || !conversionData.offer_id) {
    return {
      error: 'Bad Request',
      message: 'offer_id is required'
    };
  }

  // Generate conversion ID (using timestamp-based for uniqueness)
  const timestamp = Date.now();
  const conversionId = `conversion-${conversionData.offer_id}-${timestamp}`;

  // In production: insert into conversions table
  // In development: return success
  return {
    success: true,
    conversion_id: `conversion-${conversionData.offer_id}-${timestamp}`,
    message: 'Conversion tracked successfully'
  };
}

// Export route handlers
module.exports = {
  listOffers,
  getOffer,
  trackClick,
  trackConversion
};