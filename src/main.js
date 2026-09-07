/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

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
      phase: '2-offer-engine'
    })
  };
};

// Minimal routes for Phase 2 - API endpoints using D1 and KV
exports.routes = {
  // GET /offers - List all active offers with optional filtering by category and status
  'GET /offers': async (event) => {
    const { category, status, page = 1, limit = 20 } = event.query || {};

    try {
      // Build SQL query with optional filtering
      let sql = 'SELECT o.*, c.name as category_name, c.slug as category_slug FROM offers o LEFT JOIN categories c ON o.category_id = c.id WHERE 1=1';
      const params = [];

      if (category) {
        sql += ' AND c.slug = ?';
        params.push(category);
      }

      if (status) {
        sql += ' AND o.status = ?';
        params.push(status);
      }

      sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);

      // Use D1 database if available
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(sql).bind(...params).all();
        const offers = (result.results || []).map(offer => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          url: offer.url,
          payout: offer.payout,
          payout_type: offer.payout_type,
          status: offer.status,
          expires_at: offer.expires_at,
          click_count: offer.click_count || 0,
          conversion_count: offer.conversion_count || 0,
          revenue: offer.revenue || 0,
          category: offer.category_id ? {
            id: offer.category_id,
            name: offer.category_name,
            slug: offer.category_slug
          } : null,
          source_id: offer.source_id,
          requirements: offer.requirements ? JSON.parse(offer.requirements) : []
        }));

        // Get total count without LIMIT/OFFSET
        const countResult = await event.env.DB.prepare('SELECT COUNT(*) as cnt FROM offers o LEFT JOIN categories c ON o.category_id = c.id WHERE 1=1').bind(...params.slice(0, 2)).all();
        const total = countResult.results?.[0]?.cnt || 0;
        const total_pages = Math.ceil(total / Number(limit));

        return {
          statusCode: 200,
          body: JSON.stringify({
            offers,
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total,
              total_pages
            }
          })
        };
      }

      // Fallback to mock data if D1 not available (development)
      return {
        statusCode: 200,
        body: JSON.stringify({
          offers: [],
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            total_pages: 0
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
      // Query D1 database for specific offer with category join
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(`
          SELECT o.*, c.name as category_name, c.slug as category_slug, c.description as category_description
          FROM offers o
          LEFT JOIN categories c ON o.category_id = c.id
          WHERE o.id = ?
        `).bind(offerId).all();

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
            requirements: offer.requirements ? JSON.parse(offer.requirements) : [],
            status: offer.status,
            expires_at: offer.expires_at,
            click_count: offer.click_count || 0,
            conversion_count: offer.conversion_count || 0,
            revenue: offer.revenue || 0,
            created_at: offer.created_at,
            updated_at: offer.updated_at,
            category: offer.category_id ? {
              id: offer.category_id,
              name: offer.category_name,
              slug: offer.category_slug,
              description: offer.category_description
            } : null,
            source_id: offer.source_id
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

  // GET /categories - List all active categories (Phase 2 new endpoint)
  'GET /categories': async (event) => {
    try {
      // Use D1 database if available
      if (event.env && event.env.DB) {
        const result = await event.env.DB.prepare(
          'SELECT * FROM categories WHERE status = ? ORDER BY name ASC'
        ).bind('active').all();

        const categories = (result.results || []).map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description
        }));

        return {
          statusCode: 200,
          body: JSON.stringify({
            categories
          })
        };
      }

      // Fallback to mock data if D1 not available
      return {
        statusCode: 200,
        body: JSON.stringify({
          categories: [
            {
              id: 'cat-1',
              name: 'Software Development',
              slug: 'software-development',
              description: 'Software development jobs and contracts'
            },
            {
              id: 'cat-2',
              name: 'Data Science',
              slug: 'data-science',
              description: 'Data science and analytics positions'
            }
          ]
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

  // POST /admin/offers - Create a new offer (Phase 2 new endpoint)
  'POST /admin/offers': async (event) => {
    try {
      const body = JSON.parse(event.body || '{}');
      const {
        title, description, url, payout, payout_type,
        category_id, source_id, requirements, status = 'draft'
      } = body || {};

      // Validate required fields
      if (!title || !url || !payout || !category_id || !source_id) {
        const missing = [];
        if (!title) missing.push('title');
        if (!url) missing.push('url');
        if (!payout) missing.push('payout');
        if (!category_id) missing.push('category_id');
        if (!source_id) missing.push('source_id');

        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required fields',
            details: missing
          })
        };
      }

      // Validate payout is a valid number
      const payoutNum = Number(payout);
      if (!Number.isFinite(payoutNum) || payoutNum < 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'payout must be a valid positive number'
          })
        };
      }

      // Generate UUID for offer ID
      const offerId = `offer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set expires_at if status is active and no expires_at provided
      let expiresAt = null;
      if (status === 'active') {
        // Set default expiration 30 days from now
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Insert offer into D1 database
      if (event.env && event.env.DB) {
        await event.env.DB.prepare(`
          INSERT INTO offers (id, title, description, url, payout, payout_type, category_id, source_id, requirements, status, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
          offerId,
          title,
          description || '',
          url,
          payoutNum,
          payout_type || 'cpa',
          category_id,
          source_id,
          requirements ? JSON.stringify(requirements) : JSON.stringify([]),
          status,
          expiresAt
        ).run();
      }

      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: offerId,
          message: 'Offer created successfully',
          status: status,
          expires_at: expiresAt
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

  // PUT /admin/offers/:id - Update an existing offer (Phase 2 new endpoint)
  'PUT /admin/offers/{id}': async (event) => {
    try {
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

      const body = JSON.parse(event.body || '{}');
      const {
        title, description, url, payout, payout_type,
        category_id, source_id, requirements, status
      } = body || {};

      // Check if offer exists
      if (event.env && event.env.DB) {
        const existing = await event.env.DB.prepare(
          'SELECT id FROM offers WHERE id = ?'
        ).bind(offerId).all();

        if (existing.results?.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({
              error: 'Not Found',
              message: 'Offer not found'
            })
          };
        }
      }

      // Build update query dynamically based on provided fields
      const updateFields = [];
      const updateParams = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateParams.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateParams.push(description);
      }
      if (url !== undefined) {
        updateFields.push('url = ?');
        updateParams.push(url);
      }
      if (payout !== undefined) {
        const payoutNum = Number(payout);
        if (!Number.isFinite(payoutNum) || payoutNum < 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'payout must be a valid positive number'
            })
          };
        }
        updateFields.push('payout = ?');
        updateParams.push(payoutNum);
      }
      if (payout_type !== undefined) {
        updateFields.push('payout_type = ?');
        updateParams.push(payout_type);
      }
      if (category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateParams.push(category_id);
      }
      if (source_id !== undefined) {
        updateFields.push('source_id = ?');
        updateParams.push(source_id);
      }
      if (requirements !== undefined) {
        updateFields.push('requirements = ?');
        updateParams.push(requirements ? JSON.stringify(requirements) : JSON.stringify([]));
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateParams.push(status);

        // Set expires_at if status is active
        if (status === 'active') {
          updateFields.push('expires_at = ?');
          updateParams.push(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
        } else {
          updateFields.push('expires_at = ?');
          updateParams.push(null);
        }
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateParams.push(offerId);

      const sql = `UPDATE offers SET ${updateFields.join(', ')} WHERE id = ?`;

      if (event.env && event.env.DB) {
        await event.env.DB.prepare(sql).bind(...updateParams).run();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Offer updated successfully',
          id: offerId
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

  // POST /admin/offers/:id/expire - Manually expire an offer (Phase 2 automation)
  'POST /admin/offers/{id}/expire': async (event) => {
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
      if (event.env && event.env.DB) {
        await event.env.DB.prepare(
          'UPDATE offers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind('expired', offerId).run();
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Offer expired successfully',
          id: offerId
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