/**
 * src/handlers/api.js - API request handlers
 */

export const getOffers = async (request, config) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await config.db.prepare(
      'SELECT COUNT(*) as count FROM offers WHERE status = ?'
    ).bind(status).first();

    const totalCount = countResult?.count || 0;

    // Get paginated results
    const result = await config.db.prepare(
      'SELECT * FROM offers WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(status, limit, offset).all();

    return new Response(JSON.stringify({
      offers: result.results || [],
      pagination: {
        page,
        limit,
        total: totalCount,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const getOfferDetail = async (config, offerId) => {
  try {
    const result = await config.db.prepare(
      'SELECT * FROM offers WHERE id = ?'
    ).bind(offerId).first();

    if (!result) {
      return new Response(JSON.stringify({
        error: 'Offer not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const getCategories = async (config) => {
  try {
    const result = await config.db.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active" ORDER BY category_id'
    ).all();

    return new Response(JSON.stringify({
      categories: result.results || [],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const trackClick = async (request, config) => {
  try {
    const data = await request.json();

    if (!data.offer_id) {
      return new Response(JSON.stringify({
        error: 'Missing offer_id',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clickId = `click-${Date.now()}`;

    return new Response(JSON.stringify({
      success: true,
      click_id: clickId,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const health = async (config) => {
  try {
    // Check KV
    const kvTest = await config.kv.get('_health_check');
    
    // Check DB
    const dbTest = await config.db.prepare('SELECT 1').first();

    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message,
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
