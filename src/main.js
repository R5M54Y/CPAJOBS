/* src/main.js - Entry point for CPA JOBS MVP
   Phase 1: Cloudflare Backend - Initialize Cloudflare infrastructure */

// Set up basic exports for Cloudflare Workers
// All handlers expect D1 and KV bindings injected by Cloudflare

// Health check endpoint - checks infrastructure status
exports.health = async (event, env) => {
  // Try to connect to D1 database
  let dbStatus = 'disconnected';
  let kvStatus = 'unavailable';

  try {
    // Check D1 connectivity via environment binding
    if (env && env.DB) {
      // Execute simple query to verify D1 is available
      const dbResult = await env.DB.prepare('SELECT 1 as test').all();
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  // Check KV connectivity
  try {
    if (env && env.CPAJOBS_KV) {
      // Test KV read/write
      await env.CPAJOBS_KV.put('health-check', 'ok', 60);
      const value = await env.CPAJOBS_KV.get('health-check');
      kvStatus = value ? 'available' : 'empty';
    }
  } catch (err) {
    kvStatus = 'error: ' + err.message;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      cache: kvStatus,
      phase: '1-cloudflare-backend'
    })
  };
};

// Minimal routes for Phase 1 - API endpoints using D1 and KV
exports.routes = {
  // GET /offers - List all active offers with optional filtering
  'GET /offers': async (event) => {
    const { category, status, page = 1, limit = 20 } = event.query || {};

    try {
      // In Phase 1: use D1 database for offer listing
      let sql = 'SELECT * FROM offers WHERE 1=1';
      const params = [];

      if (category) {
        sql += ' AND category_id = ?';
        params.push(category);
      }

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);

      // Use D1 database if available
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(sql).bind(...params).all();
        return {
          statusCode: 200,
          body: JSON.stringify({
            offers: result.results || [],
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: result.results?.length || 0,
              total_pages: Math.ceil((result.results?.length || 0) / Number(limit))
            }
          })
        };
      }

      // Fallback to mock data if D1 not available (development)
      return {
        statusCode: 200,
        body: JSON.stringify({
          offers: [
            {
              id: 'mock-offer-1',
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
            page: Number(page),
            limit: Number(limit),
            total: 150,
            total_pages: 8
          }
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
  },

  // GET /offers/:id - Get detailed information about a specific offer
  'GET /offers/{id}': async (event) => {
    const offerId = event.params?.id;

    if (!offerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Offer ID is required'
        })
      };
    }

    try {
      // In Phase 1: query D1 database for specific offer
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(
          'SELECT * FROM offers WHERE id = ?'
        ).bind(offerId).all();

        if (result.results?.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Not Found',
              message: 'Offer not found'
            })
          };
        }

        const offer = result.results[0];

        return {
          statusCode: 200,
          body: JSON.stringify({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            url: offer.url,
            payout: offer.payout,
            payout_type: offer.payout_type,
            status: offer.status,
            click_count: offer.click_count || 0,
            conversion_count: offer.conversion_count || 0,
            revenue: offer.revenue || 0,
            created_at: offer.created_at,
            updated_at: offer.updated_at,
            metadata: {}
          })
        };
      }

      // Fallback to mock data if D1 not available
      return {
        statusCode: 200,
        body: JSON.stringify({
          id: offerId,
          title: 'Sample Offer',
          description: 'This is a sample offer for testing',
          url: 'https://example.com/offer',
          payout: 10.00,
          payout_type: 'cpa',
          status: 'active',
          click_count: 100,
          conversion_count: 10,
          revenue: 500.00,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
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
  },

  // POST /track/click - Track a click on an offer
  'POST /track/click': async (event) => {
    try {
      const body = JSON.parse(event.body || '{}');
      const { offer_id, user_id, ip_address, user_agent, referrer } = body || {};

      if (!offer_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'offer_id is required'
          })
        };
      }

      const clickId = `click-${offer_id}-${Date.now()}`;

      // In Phase 1: store click in D1 database and KV cache
      if (event.env && event.env.DB) {
        await event.env.DB.prepare(
          'INSERT INTO clicks (id, offer_id, user_id, ip_address, user_agent, referrer, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          clickId,
          offer_id,
          user_id,
          ip_address,
          user_agent,
          referrer,
          JSON.stringify({})
        ).run();
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
  },

  // POST /track/conversion - Track a conversion from an offer
  'POST /track/conversion': async (event) => {
    try {
      const body = JSON.parse(event.body || '{}');
      const { offer_id, user_id, source, amount } = body || {};

      if (!offer_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'offer_id is required'
          })
        };
      }

      const conversionId = `conversion-${offer_id}-${Date.now()}`;

      // In Phase 1: store conversion in D1 database and KV cache
      if (event.env && event.env.DB) {
        await event.env.DB.prepare(
          'INSERT INTO conversions (id, offer_id, user_id, source, amount, metadata) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          conversionId,
          offer_id,
          user_id,
          source,
          amount || 0,
          JSON.stringify({})
        ).run();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          conversion_id: conversionId,
          message: 'Conversion tracked successfully'
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
};