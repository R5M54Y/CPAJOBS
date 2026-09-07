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
        };
      }
    }

    // POST /track/click - Track a click on an offer (Phase 3: Tracking & Revenue)
    'POST /track/click': async (event) => {
      try {
        const clickData = JSON.parse(event.body || '{}');

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
        const idempotencyKey = `${clickData.offer_id}-${ipAddress}-${Math.floor(timestamp / 300000)}`;
        const clickId = `click-${idempotencyKey}-${timestamp}`;

        try {
          // Check idempotency: Query clicks table for same offer_id + ip_address + timestamp ± 5 min
          if (event.env && event.env.DB) {
            const existingClick = await event.env.DB.prepare(
              'SELECT id FROM clicks WHERE offer_id = ? AND ip_address = ? AND timestamp >= datetime(CURRENT_TIMESTAMP, "-5 minute")'
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

          if (event.env && event.env.DB) {
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
        } catch (dbErr) {
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: 'Internal Server Error',
              message: dbErr.message
            })
          };
        }
      } catch (parseErr) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Invalid JSON in request body'
          })
        };
      }
    },

    // POST /track/conversion - Track a conversion from an offer (Phase 3: Tracking & Revenue)
    'POST /track/conversion': async (event) => {
      try {
        const conversionData = JSON.parse(event.body || '{}');

        // Validate required fields
        if (!conversionData || !conversionData.offer_id) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'offer_id is required'
            })
          };
        }

        const timestamp = Date.now();
        const conversionId = `conversion-${conversionData.offer_id}-${timestamp}`;

        try {
          // Check idempotency: Query conversions table for same offer_id + source + timestamp ± 10 min
          if (event.env && event.env.DB) {
            const existingConversion = await event.env.DB.prepare(
              'SELECT id FROM conversions WHERE offer_id = ? AND source = ? AND timestamp >= datetime(CURRENT_TIMESTAMP, "-10 minute")'
            ).bind(conversionData.offer_id, conversionData.source || 'direct').all();

            if (existingConversion.results?.length > 0) {
              // Duplicate conversion within 10 minutes - return existing conversion_id
              return {
                statusCode: 200,
                body: JSON.stringify({
                  success: true,
                  conversion_id: existingConversion.results[0].id,
                  message: 'Conversion tracked successfully (duplicate ignored)'
                })
              };
            }
          }

          // Insert conversion into D1 database
          const conversionRecordId = `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          if (event.env && event.env.DB) {
            await event.env.DB.prepare(
              `INSERT INTO conversions (id, offer_id, user_id, source, amount, metadata, timestamp, status)
               VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')`
            ).bind(
              conversionRecordId,
              conversionData.offer_id,
              conversionData.user_id || null,
              conversionData.source || 'direct',
              conversionData.amount || 0,
              JSON.stringify(conversionData.metadata || {})
            ).run();

            // Update offer: Increment conversion_count and add to revenue
            await event.env.DB.prepare(
              `UPDATE offers SET
                 conversion_count = conversion_count + 1,
                 revenue = revenue + ?,
                 updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).bind(
              conversionData.amount || 0,
              conversionData.offer_id
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
        } catch (dbErr) {
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: 'Internal Server Error',
              message: dbErr.message
            })
          };
        }
      } catch (parseErr) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Invalid JSON in request body'
          })
        };
      }
    },

    // GET /admin/revenue - Admin revenue dashboard (Phase 3: Tracking & Revenue)
    'GET /admin/revenue': async (event) => {
      try {
        const { period = 'day', offer_id, start_date, end_date } = event.query || {};

        if (!event.env || !event.env.DB) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              revenue: [],
              totals: {
                gross: 0,
                net: 0,
                conversions: 0
              }
            })
          };
        }

        // Build date range query
        let dateCondition = '';
        let dateParams = [];

        if (offer_id) {
          dateCondition = ' AND offer_id = ?';
          dateParams.push(offer_id);
        }

        if (period === 'day') {
          // Daily aggregation - use today's date
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          dateCondition += ' AND period_date = ?';
          dateParams.push(todayStr);
        } else if (period === 'week') {
          // Weekly aggregation
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const weekStartStr = startOfWeek.toISOString().split('T')[0];
          dateCondition += ' AND period_date >= ?';
          dateParams.push(weekStartStr);
        } else if (period === 'month') {
          // Monthly aggregation
          const today = new Date();
          const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          dateCondition += ' AND period_date >= ?';
          dateParams.push(monthStartStr);
        } else {
          // Default: no date filter, use provided dates
          if (start_date) {
            dateCondition += ' AND period_date >= ?';
            dateParams.push(start_date);
          }
          if (end_date) {
            dateCondition += ' AND period_date <= ?';
            dateParams.push(end_date);
          }
        }

        // Get revenue data
        const revenueResult = await event.env.DB.prepare(
          `SELECT c.offer_id, o.title as offer_title, c.source, SUM(c.amount) as amount, COUNT(c.id) as conversion_count, c.period_date
           FROM revenue c
           LEFT JOIN offers o ON c.offer_id = o.id
           WHERE 1=1 ${dateCondition}
           GROUP BY c.offer_id, c.source, c.period_date
           ORDER BY c.period_date DESC, amount DESC`
        ).bind(...dateParams).all();

        // Get totals
        const totalsResult = await event.env.DB.prepare(
          `SELECT
             SUM(amount) as gross,
             SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as net,
             COUNT(*) as conversions
           FROM revenue
           WHERE 1=1 ${dateCondition}
           AND status = 'confirmed'`
        ).bind(...dateParams).all();

        const revenueData = (revenueResult.results || []).map(r => ({
          offer_id: r.offer_id,
          offer_title: r.offer_title || 'Unknown Offer',
          source: r.source || 'unknown',
          amount: r.amount || 0,
          conversion_count: r.conversion_count || 0,
          period_date: r.period_date || new Date().toISOString().split('T')[0]
        }));

        const totals = {
          gross: totalsResult.results?.[0]?.gross || 0,
          net: totalsResult.results?.[0]?.net || 0,
          conversions: totalsResult.results?.[0]?.conversions || 0
        };

        return {
          statusCode: 200,
          body: JSON.stringify({
            revenue: revenueData,
            totals: totals
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

    // POST /track/conversion - Track a conversion from an offer (Phase 3: Tracking & Revenue)
    'POST /track/conversion': async (event) => {
      try {
        const conversionData = JSON.parse(event.body || '{}');

        // Validate required fields
        if (!conversionData || !conversionData.offer_id) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              error: 'Bad Request',
              message: 'offer_id is required'
            })
          };
        }

        const timestamp = Date.now();
        const conversionId = `conversion-${conversionData.offer_id}-${timestamp}`;

        try {
          // Check idempotency: Query conversions table for same offer_id + source + timestamp ± 10 min
          if (event.env && event.env.DB) {
            const existingConversion = await event.env.DB.prepare(
              'SELECT id FROM conversions WHERE offer_id = ? AND source = ? AND timestamp >= datetime(CURRENT_TIMESTAMP, \"-10 minute\")'
            ).bind(conversionData.offer_id, conversionData.source || 'direct').all();

            if (existingConversion.results?.length > 0) {
              // Duplicate conversion within 10 minutes - return existing conversion_id
              return {
                statusCode: 200,
                body: JSON.stringify({
                  success: true,
                  conversion_id: existingConversion.results[0].id,
                  message: 'Conversion tracked successfully (duplicate ignored)'
                })
              };
            }
          }

          // Insert conversion into D1 database
          const conversionRecordId = `conversion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          if (event.env && event.env.DB) {
            await event.env.DB.prepare(
              `INSERT INTO conversions (id, offer_id, user_id, source, amount, metadata, timestamp, status)
               VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'pending')`
            ).bind(
              conversionRecordId,
              conversionData.offer_id,
              conversionData.user_id || null,
              conversionData.source || 'direct',
              conversionData.amount || 0,
              JSON.stringify(conversionData.metadata || {})
            ).run();

            // Update offer: Increment conversion_count and add to revenue
            await event.env.DB.prepare(
              `UPDATE offers SET
                 conversion_count = conversion_count + 1,
                 revenue = revenue + ?,
                 updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`
            ).bind(
              conversionData.amount || 0,
              conversionData.offer_id
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
        } catch (dbErr) {
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: 'Internal Server Error',
              message: dbErr.message
            })
          };
        }
      } catch (parseErr) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Bad Request',
            message: 'Invalid JSON in request body'
          })
        };
      }
    },

    // GET /admin/revenue - Admin revenue dashboard (Phase 3: Tracking & Revenue)
    'GET /admin/revenue': async (event) => {
      try {
        const { period = 'day', offer_id, start_date, end_date } = event.query || {};

        if (!event.env || !event.env.DB) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              revenue: [],
              totals: {
                gross: 0,
                net: 0,
                conversions: 0
              }
            })
          };
        }

        // Build date range query
        let dateCondition = '';
        let dateParams = [];

        if (offer_id) {
          dateCondition = ' AND offer_id = ?';
          dateParams.push(offer_id);
        }

        if (period === 'day') {
          // Daily aggregation - use today's date
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          dateCondition += ' AND period_date = ?';
          dateParams.push(todayStr);
        } else if (period === 'week') {
          // Weekly aggregation
          const today = new Date();
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const weekStartStr = startOfWeek.toISOString().split('T')[0];
          dateCondition += ' AND period_date >= ?';
          dateParams.push(weekStartStr);
        } else if (period === 'month') {
          // Monthly aggregation
          const today = new Date();
          const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          dateCondition += ' AND period_date >= ?';
          dateParams.push(monthStartStr);
        } else {
          // Default: no date filter, use provided dates
          if (start_date) {
            dateCondition += ' AND period_date >= ?';
            dateParams.push(start_date);
          }
          if (end_date) {
            dateCondition += ' AND period_date <= ?';
            dateParams.push(end_date);
          }
        }

        // Get revenue data
        const revenueResult = await event.env.DB.prepare(
          `SELECT c.offer_id, o.title as offer_title, c.source, SUM(c.amount) as amount, COUNT(c.id) as conversion_count, c.period_date
           FROM revenue c
           LEFT JOIN offers o ON c.offer_id = o.id
           WHERE 1=1 ${dateCondition}
           GROUP BY c.offer_id, c.source, c.period_date
           ORDER BY c.period_date DESC, amount DESC`
        ).bind(...dateParams).all();

        // Get totals
        const totalsResult = await event.env.DB.prepare(
          `SELECT
             SUM(amount) as gross,
             SUM(CASE WHEN status = 'confirmed' THEN amount ELSE 0 END) as net,
             COUNT(*) as conversions
           FROM revenue
           WHERE 1=1 ${dateCondition}
           AND status = 'confirmed'`
        ).bind(...dateParams).all();

        const revenueData = (revenueResult.results || []).map(r => ({
          offer_id: r.offer_id,
          offer_title: r.offer_title || 'Unknown Offer',
          source: r.source || 'unknown',
          amount: r.amount || 0,
          conversion_count: r.conversion_count || 0,
          period_date: r.period_date || new Date().toISOString().split('T')[0]
        }));

        const totals = {
          gross: totalsResult.results?.[0]?.gross || 0,
          net: totalsResult.results?.[0]?.net || 0,
          conversions: totalsResult.results?.[0]?.conversions || 0
        };

        return {
          statusCode: 200,
          body: JSON.stringify({
            revenue: revenueData,
            totals: totals
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