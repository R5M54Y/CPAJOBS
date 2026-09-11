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
    console.error('Track click error:', error);
    return new Response(JSON.stringify({
      error: 'Click tracking failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const verifyApplyUrl = async (request, config) => {
  try {
    const url = new URL(request.url);
    const offerId = url.searchParams.get('id');
    const applyUrl = url.searchParams.get('url');

    if (!offerId || !applyUrl) {
      return new Response(JSON.stringify({
        error: 'Missing id or url parameter',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get job from database to verify it exists
    const jobResult = await config.db.prepare(
      'SELECT id, title, apply_url FROM offers WHERE id = ?'
    ).bind(offerId).first();

    if (!jobResult) {
      return new Response(JSON.stringify({
        error: 'Job not found',
        available: false,
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify that requested URL matches job's apply_url
    if (jobResult.apply_url !== applyUrl) {
      return new Response(JSON.stringify({
        error: 'Apply URL mismatch',
        available: false,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if apply_url is accessible
    try {
      const checkResponse = await fetch(applyUrl, {
        method: 'HEAD',
        redirect: 'follow',
      });

      // 404 = expired job
      if (checkResponse.status === 404) {
        return new Response(JSON.stringify({
          error: 'Job application page not found',
          available: false,
          statusCode: 404,
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 200-299 = success
      if (checkResponse.status >= 200 && checkResponse.status < 300) {
        return new Response(JSON.stringify({
          available: true,
          statusCode: checkResponse.status,
          redirectUrl: checkResponse.url || applyUrl,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 3xx = redirect (follow and report final URL)
      if (checkResponse.status >= 300 && checkResponse.status < 400) {
        return new Response(JSON.stringify({
          available: true,
          statusCode: checkResponse.status,
          redirectUrl: checkResponse.url || applyUrl,
          redirect: true,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 401/403 = don't classify as expired, these are often bot protection
      if (checkResponse.status === 401 || checkResponse.status === 403) {
        return new Response(JSON.stringify({
          available: true,
          statusCode: checkResponse.status,
          redirectUrl: applyUrl,
          note: 'Authentication/permission required but URL appears valid',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 429 = rate limiting, don't classify as expired
      if (checkResponse.status === 429) {
        return new Response(JSON.stringify({
          available: true,
          statusCode: checkResponse.status,
          redirectUrl: applyUrl,
          note: 'Rate limited but URL appears valid',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Other 5xx = temporary failure, don't classify as expired
      if (checkResponse.status >= 500) {
        return new Response(JSON.stringify({
          available: true,
          statusCode: checkResponse.status,
          redirectUrl: applyUrl,
          note: 'Server error but URL may be temporarily unavailable',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Other status codes
      return new Response(JSON.stringify({
        available: true,
        statusCode: checkResponse.status,
        redirectUrl: applyUrl,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      // Network error, DNS failure, timeout - don't classify as expired
      return new Response(JSON.stringify({
        available: true,
        redirectUrl: applyUrl,
        error: 'Could not verify URL availability',
        note: 'Network error but allowing redirect to proceed',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Apply verification error:', error);
    return new Response(JSON.stringify({
      error: 'Verification failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
