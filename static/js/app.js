app.js - CPA JOBS Frontend MVP

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
      trackingData: null
    };
    this.baseUrl = '/';
    this.init();
  }

  init() {
    // Check URL hash for navigation
    window.addEventListener('hashchange', () => this.handleRoute());
    // Initial route on load
    this.handleRoute();
  }

  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'landing';
    this.state.currentView = hash;

    switch (hash) {
      case 'landing':
        await this.loadLanding();
        break;
      case 'categories':
        await this.loadCategories();
        break;
      case 'offer-detail':
        this.loadOfferDetail();
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

  loadOfferDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const offerId = urlParams.get('id');

    if (!offerId) {
      this.state.error = 'Offer ID not found';
      this.navigate('landing');
      return;
    }

    this.setLoading(true);
    this.state.error = null;

    // Load specific offer
    this.apiCall(`/offers/${offerId}`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Offer not found');
        }
      })
      .then(data => {
        this.state.selectedOffer = data;
        this.setLoading(false);
      })
      .catch(error => {
        this.state.error = 'Failed to load offer details';
        console.error('Offer detail error:', error);
        this.setLoading(false);
      });
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
      // Old signature: apiCall(endpoint, method, body)
      method = params;
      queryParams = null;
    } else if (typeof params === 'object' && params !== null && body === null) {
      // New signature: apiCall(endpoint, {params})
      queryParams = params;
      method = 'GET';
    } else if (typeof params === 'object' && typeof body === 'object') {
      // New signature: apiCall(endpoint, params, body)
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
      headers: {
        'Content-Type': 'application/json'
      }
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
    return `
      <section class="hero">
        <h1>Find Your Next CPA Opportunity</h1>
        <p>Discover high-paying CPA programs and start earning today</p>
        ${this.state.loading ? '<p>Loading...</p>' : ''}
        ${this.state.error ? `<p class="error">${this.state.error}</p>` : ''}
      </section>

      <section class="offer-list">
        <h2>Featured Opportunities</h2>
        ${this.state.offers.map(offer => this.renderOfferCard(offer)).join('')}
      </section>

      <section class="offer-list">
        <h2>Browse Categories</h2>
        <div class="category-grid">
          ${this.state.categories.map(cat => `
            <div class="category-card" onclick="app.navigate('categories')">
              <h3>${cat.name}</h3>
              <p>${cat.description}</p>
            </div>
          </button>
        </div>
      </section>
    `;
  }

  renderCategories() {
    const filteredOffers = this.state.selectedCategory
      ? this.state.offers.filter(offer => offer.category?.slug === this.state.selectedCategory)
      : this.state.offers;

    return `
      <div class="categories-container">
        <h2>Categories</h2>
        <div class="category-filters">
          <button class="category-filter ${!this.state.selectedCategory ? 'active' : ''}" onclick="app.setSelectedCategory(null)">
            All
          </button>
          ${this.state.categories.map(cat => `
            <button class="category-filter ${this.state.selectedCategory === cat.slug ? 'active' : ''}" onclick="app.setSelectedCategory('${cat.slug}')">
              ${cat.name}
            </button>
          </button>
        </div>

        <div class="offer-grid">
          ${filteredOffers.map(offer => this.renderOfferCard(offer)).join('')}
        </div>
      </div>
    `;
  }

  renderOfferDetail() {
    if (!this.state.selectedOffer) {
      return `<p>Offer not found or loading...</p>`;
    }

    const offer = this.state.selectedOffer;

    return `
      <div class="offer-detail">
        <button onclick="app.navigate('landing')" class="back-btn">← Back</button>

        <div class="offer-detail-card">
          <h1>${offer.title}</h1>
          <div class="offer-meta">
            <span class="category">${offer.category?.name || 'General'}</span>
            <span class="status">${offer.status}</span>
          </div>

          <div class="offer-description">
            <h3>Description</h3>
            <p>${offer.description}</p>
          </div>

          <div class="offer-info">
            <div class="info-item">
              <strong>Payout:</strong> $${offer.payout} ${offer.payout_type}
            </div>
            <div class="info-item">
              <strong>Expires:</strong> ${offer.expires_at ? new Date(offer.expires_at).toLocaleDateString() : 'No expiration'}
            </div>
            <div class="info-item">
              <strong>Clicks:</strong> ${offer.click_count || 0}
            </div>
            <div class="info-item">
              <strong>Conversions:</strong> ${offer.conversion_count || 0}
            </div>
          </div>

          <div class="offer-requirements">
            <h3>Requirements</h3>
            <ul>
              ${offer.requirements?.map(req => `<li>${req}</li>`).join('') || '<li>No specific requirements</li>'}
            </div>

          <div class="offer-cta">
            <a href="${offer.url}" target="_blank" class="cta-button" onclick="app.handleOfferClick('${offer.id}')">
              Apply Now
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAdmin() {
    return `
      <div class="admin-panel">
        <h2>Admin Dashboard</h2>
        <p>Admin functionality using existing backend endpoints</p>

        <div class="admin-actions">
          <button onclick="app.navigate('landing')" class="admin-btn">Back to Site</button>
          <button onclick="app.loadOffersAdmin()" class="admin-btn">Manage Offers</button>
          <button onclick="app.loadRevenueAdmin()" class="admin-btn">View Revenue</button>
        </div>

        <div id="admin-content">
          <p>Admin interface coming soon...</p>
        </div>
      </div>
    `;
  }

  renderOfferCard(offer) {
    return `
      <div class="offer-card" onclick="app.navigate('offer-detail?id=${offer.id}')">
        <h3>${offer.title}</h3>
        <div class="offer-meta">
          <span class="category">${offer.category?.name || 'General'}</span>
          <span class="status ${offer.status}">${offer.status}</span>
        </div>
        <p class="description">${offer.description}</p>
        <div class="offer-footer">
          <span class="payout">$${offer.payout} ${offer.payout_type}</span>
          <span class="status ${offer.status}">${offer.status}</span>
        </div>
      </div>
    `;
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
      // The backend handles the actual redirect to the CPA destination
      // We just need to track the click and let the backend handle the redirect
      return true;
    } else {
      console.error('Click tracking failed:', result.error);
      // Show error state but continue navigation
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
}