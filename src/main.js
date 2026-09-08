/* src/main.js - Entry point for CPA JOBS MVP
   Phase 2: Offer Engine - Add categories, offer CRUD, status management
   All handlers expect D1 and KV bindings injected by Cloudflare
*/

import { importAshbyJobs } from './importers/ashby.js';

// === STATIC FILE EMBEDDING ===
const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CPA JOBS - Find Your Next CPA Opportunity</title>
  <link rel="stylesheet" href="css/style.css">
  <base href="/">
</head>
<body>
  <header>
    <nav class="nav">
      <a href="#landing" class="logo">CPA JOBS</a>
      <div class="nav-links">
        <a href="#landing">Home</a>
        <a href="#categories">Categories</a>
      </div>
    </nav>
  </header>

  <main id="app">
    <!-- Content will be loaded here -->
  </main>

  <footer>
    <p>&copy; 2024 CPA JOBS. Your gateway to CPA opportunities.</p>
  </footer>

  <script src="js/app.js"></script>
</body>
</html>`;

const STYLE_CSS = `/* static/css/style.css - CPA JOBS MVP Styles
   Phase 0: Foundation - Basic styling */

body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  background: #fafafa;
  color: #333;
}

header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 1rem 2rem;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007acc;
  text-decoration: none;
}

.nav-links a {
  margin-left: 1rem;
  color: #333;
  text-decoration: none;
  font-size: 0.9rem;
}

.hero {
  max-width: 1200px;
  margin: 3rem auto;
  padding: 2rem;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.hero p {
  color: #666;
  margin-bottom: 2rem;
}

.offer-list {
  max-width: 1200px;
  margin: 2rem auto;
}

.offer-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.offer-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.offer-card p {
  color: #666;
  font-size: 0.9rem;
  margin: 0.2rem 0;
}

footer {
  background: #fff;
  border-top: 1px solid #e0e0e0;
  padding: 1rem 2rem;
  text-align: center;
  font-size: 0.8rem;
  color: #888;
}
`;

const APP_JS = `// app.js - CPA JOBS Frontend MVP

class CPAJobsApp {
  constructor() {
    this.state = {
      currentView: 'landing',
      categories: [],
      offers: [],
      selectedCategory: null,
      loading: false,
      error: null,
      selectedOffer: null,
      trackingData: null,
      routeParams: {}
    };
    this.baseUrl = '';
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';
    
    // Parse route name and query params from hash
    // e.g., 'offer-detail?id=ashby-abc123' → route='offer-detail', params={id: 'ashby-abc123'}
    const [routeName, queryString] = hash.split('?');
    this.state.currentView = routeName;
    
    // Store query params in state for route handlers to use
    this.state.routeParams = {};
    if (queryString) {
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        this.state.routeParams[key] = value;
      });
    }

    switch (routeName) {
      case 'landing':
        await this.loadLanding();
        break;
      case 'categories':
        await this.loadCategories();
        break;
      case 'offer-detail':
        await this.loadOfferDetail();
        break;
      case 'admin':
        this.loadAdmin();
        break;
      default:
        await this.loadLanding();
    }

    this.render();
  }

  async loadLanding() {
    try {
      this.setLoading(true);
      this.state.error = null;

      // Load featured offers
      const response = await this.apiCall('/offers', { status: 'active', limit: 6 });
      if (response.ok) {
        const data = await response.json();
        this.state.offers = data.offers || [];
      }

      // Load categories for navigation
      const categoriesResponse = await this.apiCall('/categories');
      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json();
        this.state.categories = data.categories || [];
      }

    } catch (error) {
      this.state.error = 'Failed to load landing page data';
      console.error('Landing load error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  async loadCategories() {
    try {
      this.setLoading(true);
      this.state.error = null;

      const response = await this.apiCall('/categories');
      if (response.ok) {
        const data = await response.json();
        this.state.categories = data.categories || [];
      }

      // Also load offers for category page
      const offersResponse = await this.apiCall('/offers', { status: 'active', limit: 20 });
      if (offersResponse.ok) {
        const data = await offersResponse.json();
        this.state.offers = data.offers || [];
      }

    } catch (error) {
      this.state.error = 'Failed to load categories';
      console.error('Categories load error:', error);
    } finally {
      this.setLoading(false);
    }
  }

  async loadOfferDetail() {
    const offerId = this.state.routeParams?.id;

    if (!offerId) {
      this.state.error = 'Offer ID not found';
      this.navigate('landing');
      return;
    }

    this.setLoading(true);
    this.state.error = null;

    // Load specific offer
    try {
      const response = await this.apiCall(\`/offers/\${offerId}\`);
      if (response.ok) {
        const data = await response.json();
        this.state.selectedOffer = data;
      } else {
        throw new Error('Offer not found');
      }
    } catch (error) {
      this.state.error = 'Failed to load offer details';
      console.error('Offer detail error:', error);
    } finally {
      this.setLoading(false);
      this.render();
    }
  }

  loadAdmin() {
    // Admin view uses existing backend endpoints
    this.state.currentView = 'admin';
    this.render();
  }

  async trackClick(offerId, userData = {}) {
    try {
      const payload = {
        offer_id: offerId,
        ip_address: userData.ip || 'unknown',
        user_agent: userData.userAgent || '',
        referrer: userData.referrer || '',
        metadata: userData.metadata || {}
      };

      const response = await this.apiCall('/track/click', 'POST', payload);
      const data = await response.json();

      return {
        success: response.ok,
        clickId: data.click_id,
        message: data.message,
        error: !response.ok ? data.error : null
      };

    } catch (error) {
      console.error('Click tracking error:', error);
      return {
        success: false,
        error: 'Failed to track click'
      };
    }
  }

  async apiCall(endpoint, params = null, body = null) {
    // Handle both old signature (method as string) and new signature (params as object)
    let method = 'GET';
    let queryParams = null;

    if (typeof params === 'string') {
      method = params;
      queryParams = null;
    } else if (params !== null && typeof params === 'object' && body === null) {
      queryParams = params;
      method = 'GET';
    } else if (params !== null && body !== null) {
      queryParams = params;
      method = 'POST';
    }

    let url = this.baseUrl + endpoint;

    // Build query string if params provided
    if (queryParams && method === 'GET') {
      const searchParams = new URLSearchParams();
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== null && queryParams[key] !== undefined) {
          searchParams.append(key, queryParams[key]);
        }
      });
      if (searchParams.toString()) {
        url += '?' + searchParams.toString();
      }
    }

    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  setLoading(isLoading) {
    this.state.loading = isLoading;
    this.render();
  }

  navigate(path) {
    window.location.hash = path;
  }

  attachEventListeners() {
    // Placeholder for event listeners - events handled via inline onclick in templates
  }

  render() {
    const app = document.getElementById('app');
    if (!app) return;

    let html = '';

    switch (this.state.currentView) {
      case 'landing':
        html = this.renderLanding();
        break;
      case 'categories':
        html = this.renderCategories();
        break;
      case 'offer-detail':
        html = this.renderOfferDetail();
        break;
      case 'admin':
        html = this.renderAdmin();
        break;
      default:
        html = this.renderLanding();
    }

    app.innerHTML = html;
    this.attachEventListeners();
  }

  renderLanding() {
    if (this.state.loading) {
      return \`
        <section class="hero">
          <h1>Find Your Next CPA Opportunity</h1>
          <p>Discover high-paying CPA programs and start earning today</p>
          <p>Loading opportunities...</p>
        </section>
      \`;
    }

    if (this.state.error) {
      return \`
        <section class="hero">
          <h1>Find Your Next CPA Opportunity</h1>
          <p class="error">Error: \${this.state.error}</p>
        </section>
      \`;
    }

    if (!this.state.offers || this.state.offers.length === 0) {
      return \`
        <section class="hero">
          <h1>Find Your Next CPA Opportunity</h1>
          <p>Discover high-paying CPA programs and start earning today</p>
        </section>
        <section class="offer-list">
          <h2>Available Opportunities</h2>
          <p class="no-results">No opportunities available at this time. Please check back soon.</p>
        </section>
      \`;
    }

    return \`
      <section class="hero">
        <h1>Find Your Next CPA Opportunity</h1>
        <p>Discover high-paying CPA programs and start earning today</p>
      </section>

      <section class="offer-list">
        <h2>Available Opportunities</h2>
        \${this.state.offers.map(offer => this.renderOfferCard(offer)).join('')}
      </section>
    \`;
  }

  renderCategories() {
    const filteredOffers = this.state.selectedCategory
      ? this.state.offers.filter(offer => offer.category?.slug === this.state.selectedCategory)
      : this.state.offers;

    return \`
      <div class="categories-container">
        <h2>Categories</h2>
        <div class="offer-grid">
          \${filteredOffers.map(offer => this.renderOfferCard(offer)).join('')}
        </div>
      </div>
    \`;
  }

  renderOfferDetail() {
    if (!this.state.selectedOffer) {
      return \`<p>Offer not found or loading...</p>\`;
    }

    const o = this.state.selectedOffer;
    return \`
      <div class="offer-detail">
        <button onclick="app.navigate('landing')" class="back-btn">← Back</button>

        <div class="offer-detail-card">
          <h1>\${o.title}</h1>
          <p><strong>Company:</strong> \${o.company || 'N/A'}</p>
          <p><strong>Location:</strong> \${o.location_city || ''} \${o.location_state || ''} \${o.location_country || ''}</p>
          <p><strong>Status:</strong> \${o.status}</p>
          <p>\${o.description || ''}</p>
          <a href="\${o.apply_url || o.url}" target="_blank" class="btn">Apply Now</a>
        </div>
      </div>
    \`;
  }

  renderAdmin() {
    return \`
      <div class="admin-panel">
        <h2>Admin Dashboard</h2>
        <p>Admin interface</p>
      </div>
    \`;
  }

  renderOfferCard(offer) {
    return \`
      <div class="offer-card" onclick="app.navigate('offer-detail?id=\${offer.id}')">
        <h3>\${offer.title}</h3>
        <div class="offer-meta">
          <span class="category">\${offer.category?.name || 'General'}</span>
          <span class="status \${offer.status}">\${offer.status}</span>
        </div>
        <p class="description">\${offer.description}</p>
        <div class="offer-footer">
          <span class="payout">\$\${offer.payout} \${offer.payout_type}</span>
          <span class="status \${offer.status}">\${offer.status}</span>
        </div>
      </div>
    \`;
  }

  setSelectedCategory(category) {
    this.state.selectedCategory = category;
    this.render();
  }

  async handleOfferClick(offerId) {
    const clickData = {
      offer_id: offerId,
      ip_address: 'unknown',
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      metadata: {
        source: 'frontend_mvp',
        timestamp: new Date().toISOString()
      }
    };

    const result = await this.trackClick(offerId, clickData);

    if (result.success) {
      console.log('Click tracked successfully:', result);
      return true;
    } else {
      console.error('Click tracking failed:', result.error);
      this.state.error = result.error || 'Tracking failed';
      this.render();
      return false;
    }
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new CPAJobsApp();
  });
} else {
  window.app = new CPAJobsApp();
}`;

// === ENDPOINTS ===

// Health check endpoint - checks infrastructure status
const health = async (event, env) => {
  // Try to connect to D1 database
  let dbStatus = 'disconnected';
  let kvStatus = 'unavailable';

  try {
    const result = await env.DB.prepare('SELECT 1').first();
    if (result) dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'failed';
  }

  try {
    const value = await env.CPAJOBS_KV.get('health_check');
    kvStatus = 'available';
  } catch (error) {
    kvStatus = 'unavailable';
  }

  return new Response(JSON.stringify({
    status: 'ok',
    db: dbStatus,
    kv: kvStatus,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

// Serve static files
const serveStatic = async (path) => {
  const files = {
    '/': { content: INDEX_HTML, type: 'text/html' },
    '/index.html': { content: INDEX_HTML, type: 'text/html' },
    '/css/style.css': { content: STYLE_CSS, type: 'text/css' },
    '/js/app.js': { content: APP_JS, type: 'application/javascript' }
  };

  const file = files[path];
  if (file) {
    return new Response(file.content, {
      headers: { 'Content-Type': file.type }
    });
  }

  return new Response('Not found', { status: 404 });
};

// GET /offers - List offers
const getOffers = async (request, env) => {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

    const result = await env.DB.prepare(
      'SELECT * FROM offers WHERE status = ? LIMIT ?'
    ).bind(status, limit).all();

    return new Response(JSON.stringify({
      success: true,
      offers: result.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET /offers/:id - Get specific offer
const getOfferDetail = async (request, env, offerId) => {
  try {
    const query = 'SELECT * FROM offers WHERE id = ?';
    const stmt = env.DB.prepare(query).bind(offerId);
    const result = await stmt.first();

    if (!result) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offer not found'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('getOfferDetail error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// GET /categories - List categories
const getCategories = async (env) => {
  try {
    const result = await env.DB.prepare(
      'SELECT DISTINCT category FROM offers WHERE status = "active" ORDER BY category'
    ).all();

    const categories = (result.results || []).map(row => ({
      name: row.category || 'General',
      slug: (row.category || 'general').toLowerCase().replace(/\s+/g, '-')
    }));

    return new Response(JSON.stringify({
      success: true,
      categories
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// POST /track/click - Track offer clicks
const trackClick = async (request, env) => {
  try {
    const data = await request.json();
    
    if (!data.offer_id) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing offer_id'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Track the click (could store in D1 or KV for analytics)
    const clickId = `click-${Date.now()}`;
    
    return new Response(JSON.stringify({
      success: true,
      click_id: clickId,
      message: 'Click tracked'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

// Scheduled job - Import jobs daily from Ashby
const importJobs = async (event, env) => {
  console.log('[CRON] Import job started at', new Date().toISOString());
  console.log('[CRON] Event:', JSON.stringify(event));
  console.log('[CRON] Env keys:', Object.keys(env));
  
  try {
    const jobBoardName = env.ASHBY_JOB_BOARD_NAME;
    console.log('[CRON] ASHBY_JOB_BOARD_NAME:', jobBoardName || 'UNDEFINED');
    
    if (!jobBoardName) {
      const error = 'ASHBY_JOB_BOARD_NAME not configured in env';
      console.error('[CRON] ERROR:', error);
      throw new Error(error);
    }
    
    console.log('[CRON] Calling importAshbyJobs with board:', jobBoardName);
    const stats = await importAshbyJobs(env, jobBoardName);
    console.log('[CRON] Import completed:', JSON.stringify(stats));
    
    if (stats.errors && stats.errors.length > 0) {
      console.error('[CRON] Import had errors:', stats.errors);
    }
    
    return stats;
  } catch (error) {
    console.error('[CRON] FATAL ERROR:', error.message);
    console.error('[CRON] Stack:', error.stack);
    throw error;
  }
};

// Main request handler
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Health check
    if (pathname === '/health') {
      return health(request, env);
    }

    // Offer endpoints
    if (pathname === '/offers' && request.method === 'GET') {
      return getOffers(request, env);
    }

    if (pathname.startsWith('/offers/') && request.method === 'GET') {
      const offerId = pathname.slice(8); // '/offers/' is 8 characters
      return getOfferDetail(request, env, offerId);
    }

    // Category endpoints
    if (pathname === '/categories' && request.method === 'GET') {
      return getCategories(env);
    }

    // Tracking
    if (pathname === '/track/click' && request.method === 'POST') {
      return trackClick(request, env);
    }

    // Static files
    return serveStatic(pathname);
  },

  async scheduled(event, env) {
    await importJobs(event, env);
  }
};
