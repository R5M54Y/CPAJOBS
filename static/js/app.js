// app.js - USA JOBS Frontend MVP

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
    // Path-based routing with popstate support
    window.addEventListener('popstate', () => this.handleRoute());
    // Legacy hash support for backwards compatibility
    window.addEventListener('hashchange', () => this.handleRoute());
    // Initial route on load
    this.handleRoute();
  }

  async handleRoute() {
    const pathname = window.location.pathname;
    const hash = window.location.hash.slice(1);
    
    // Path-based routing takes priority
    if (pathname.startsWith('/jobs/') && pathname.length > 6) {
      const pathSegment = pathname.slice(6);
      const jobId = this.extractJobIdFromPath(pathSegment);
      
      if (jobId) {
        this.state.currentView = 'offer-detail';
        this.state.routeParams = { id: jobId };
        await this.loadOfferDetail();
        this.render();
        return;
      } else {
        this.state.currentView = 'offer-detail';
        this.state.routeParams = {};
        this.state.error = 'Job not found';
        this.state.selectedOffer = null;
        this.render();
        return;
      }
    }
    
    if (pathname === '/jobs' || pathname === '/jobs/') {
      this.state.currentView = 'landing';
      this.state.routeParams = {};
      await this.loadLanding();
      this.render();
      return;
    }
    
    // Legacy hash routing support
    if (hash) {
      const [routeName, queryString] = hash.split('?');
      this.state.routeParams = {};
      
      if (queryString) {
        const params = new URLSearchParams(queryString);
        params.forEach((value, key) => {
          this.state.routeParams[key] = value;
        });
      }
      
      if (routeName === 'offer-detail' && this.state.routeParams.id) {
        this.state.currentView = 'offer-detail';
        await this.loadOfferDetail();
        if (this.state.selectedOffer) {
          const prettyUrl = this.generateJobPermalink(this.state.selectedOffer);
          history.replaceState(null, '', prettyUrl);
        }
        this.render();
        return;
      }
      
      switch (routeName) {
        case 'landing':
          await this.loadLanding();
          break;
        case 'categories':
          await this.loadCategories();
          break;
        case 'admin':
          this.loadAdmin();
          break;
        default:
          await this.loadLanding();
      }
      this.render();
      return;
    }
    
    this.state.currentView = 'landing';
    this.state.routeParams = {};
    await this.loadLanding();
    this.render();
  }

  extractJobIdFromPath(pathSegment) {
    const ashbyMatch = pathSegment.match(/(ashby-[a-f0-9-]+)$/i);
    if (ashbyMatch) {
      return ashbyMatch[1];
    }
    
    const parts = pathSegment.split('-');
    if (parts.length >= 2) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const candidate = parts.slice(i).join('-');
        if (candidate.includes('-') && candidate.length > 10) {
          return candidate;
        }
      }
    }
    
    return null;
  }

  generateJobPermalink(job) {
    if (!job || !job.id) return '/';
    const slug = this.normalizeSlug(job.title || 'job');
    return `/jobs/${slug}-${job.id}`;
  }

  normalizeSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async loadLanding() {
    try {
      this.setLoading(true);
      this.state.error = null;

      const response = await this.apiCall('/offers', { status: 'active', limit: 6 });
      if (response.ok) {
        const data = await response.json();
        this.state.offers = data.offers || [];
      }

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

    try {
      const response = await this.apiCall(`/offers/${offerId}`);
      if (response.ok) {
        const data = await response.json();
        this.state.selectedOffer = data;
      } else {
        throw new Error('Offer not found');
      }
    } catch (error) {
      this.state.error = 'Failed to load offer details';
      this.state.selectedOffer = null;
      console.error('Offer detail error:', error);
    } finally {
      this.setLoading(false);
      this.render();
    }
  }

  loadAdmin() {
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
    if (path.startsWith('/')) {
      history.pushState(null, '', path);
      this.handleRoute();
    } else {
      window.location.hash = path;
    }
  }

  attachEventListeners() {
    // Placeholder for event listeners
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
    
    // Update SEO metadata after render
    this.updateSeoMetadata();
  }

  updateSeoMetadata() {
    const canonicalHostname = 'https://usajobs.usajobs.workers.dev';
    let title = 'USA Jobs';
    let description = 'Find accounting and finance job opportunities. Browse high-paying CPA positions from top employers.';
    let canonicalUrl = `${canonicalHostname}/`;
    let ogTitle = 'USA Jobs | Accounting & Finance Opportunities';
    let ogDescription = description;
    let ogType = 'website';
    let twitterTitle = ogTitle;
    let twitterDescription = description;
    let jobPostingJson = null;

    if (this.state.currentView === 'offer-detail') {
      if (this.state.selectedOffer) {
        const job = this.state.selectedOffer;
        title = `${job.title} | USA Jobs`;
        description = this.generateMetaDescription(job);
        const permalink = this.generateJobPermalink(job);
        canonicalUrl = `${canonicalHostname}${permalink}`;
        ogTitle = job.title;
        ogDescription = description;
        twitterTitle = job.title;
        twitterDescription = description;
        jobPostingJson = this.generateJobPostingJson(job, canonicalUrl);
      } else if (this.state.error) {
        title = 'Job Not Found | USA Jobs';
        description = 'The job you are looking for could not be found.';
        canonicalUrl = `${canonicalHostname}/jobs/`;
      }
    } else if (this.state.currentView === 'landing') {
      if (window.location.pathname.startsWith('/jobs')) {
        title = 'Jobs | USA Jobs';
        description = 'Browse available accounting and finance job opportunities. Find your next career move.';
        canonicalUrl = `${canonicalHostname}/jobs/`;
        ogTitle = 'Available Jobs | USA Jobs';
      } else {
        title = 'USA Jobs | Accounting & Finance Jobs';
        description = 'Find accounting and finance job opportunities. Browse high-paying CPA positions from top employers.';
        canonicalUrl = `${canonicalHostname}/`;
        ogTitle = 'USA Jobs | Accounting & Finance Opportunities';
      }
    }

    document.title = title;
    this.updateMetaTag('description', description);
    this.updateCanonicalLink(canonicalUrl);
    this.updateMetaTag('og:title', ogTitle, 'property');
    this.updateMetaTag('og:description', ogDescription, 'property');
    this.updateMetaTag('og:type', ogType, 'property');
    this.updateMetaTag('og:url', canonicalUrl, 'property');
    this.updateMetaTag('og:site_name', 'USA Jobs', 'property');
    this.updateMetaTag('twitter:card', 'summary', 'name');
    this.updateMetaTag('twitter:title', twitterTitle, 'name');
    this.updateMetaTag('twitter:description', twitterDescription, 'name');
    this.updateJobPostingJsonLd(jobPostingJson);
  }

  generateMetaDescription(job) {
    let parts = [];
    
    if (job.company) {
      parts.push(job.company);
    }
    
    if (job.location_city || job.location_state || job.location_country) {
      const location = [job.location_city, job.location_state, job.location_country]
        .filter(Boolean)
        .join(', ');
      if (location) parts.push(location);
    }
    
    if (job.employment_type) {
      parts.push(job.employment_type);
    }
    
    let desc = job.title;
    if (parts.length > 0) {
      desc += ' - ' + parts.join(' | ');
    }
    
    if (job.description) {
      const excerpt = job.description
        .replace(/<[^>]*>/g, '')
        .substring(0, 100)
        .trim();
      if (excerpt) {
        desc += '. ' + excerpt + (excerpt.length === 100 ? '...' : '');
      }
    }
    
    desc = desc.replace(/\s+/g, ' ').trim();
    if (desc.length > 160) {
      desc = desc.substring(0, 157) + '...';
    }
    
    return desc;
  }

  generateJobPostingJson(job, canonicalUrl) {
    const posting = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      url: canonicalUrl
    };

    if (job.description) {
      const plainText = job.description.replace(/<[^>]*>/g, '').trim();
      if (plainText) {
        posting.description = plainText.substring(0, 1000);
      }
    }

    if (job.created_at) {
      posting.datePosted = job.created_at;
    }

    if (job.company) {
      posting.hiringOrganization = {
        '@type': 'Organization',
        name: job.company
      };
      if (job.company_domain) {
        posting.hiringOrganization.url = 'https://' + (job.company_domain.startsWith('http') ? job.company_domain.replace('https://', '').replace('http://', '') : job.company_domain);
      }
    }

    if (job.location_city || job.location_state || job.location_country) {
      posting.jobLocation = {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress'
        }
      };
      if (job.location_city) posting.jobLocation.address.addressLocality = job.location_city;
      if (job.location_state) posting.jobLocation.address.addressRegion = job.location_state;
      if (job.location_country) posting.jobLocation.address.addressCountry = job.location_country;
    }

    if (job.employment_type) {
      posting.employmentType = job.employment_type;
    }

    if (job.salary_min || job.salary_max) {
      posting.baseSalary = {
        '@type': 'PriceSpecification',
        priceCurrency: job.salary_currency || 'USD',
        price: job.salary_min || job.salary_max
      };
      if (job.salary_max && job.salary_min !== job.salary_max) {
        posting.baseSalary.maxPrice = job.salary_max;
      }
      if (job.salary_period) {
        posting.baseSalary.validThrough = job.salary_period;
      }
    }

    return posting;
  }

  updateMetaTag(name, content, type = 'name') {
    if (!content) return;

    const attribute = type === 'property' ? 'property' : 'name';
    const selector = `meta[${attribute}="${name}"]`;
    let tag = document.querySelector(selector);

    if (tag) {
      tag.setAttribute('content', content);
    } else {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      tag.setAttribute('content', content);
      document.head.appendChild(tag);
    }
  }

  updateCanonicalLink(url) {
    let link = document.querySelector('link[rel="canonical"]');
    
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  }

  updateJobPostingJsonLd(jobPostingJson) {
    const existing = document.querySelector('script[data-seo="jobposting"]');
    if (existing) {
      existing.remove();
    }

    if (jobPostingJson) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'jobposting');
      script.textContent = JSON.stringify(jobPostingJson);
      document.head.appendChild(script);
    }
  }

  renderLanding() {
    if (this.state.loading) {
      return `
        <section class="hero">
          <h1>Find Your Next Opportunity</h1>
          <p>Discover high-paying accounting and finance jobs</p>
          <p class="loading-message">Loading opportunities...</p>
        </section>
      `;
    }

    if (this.state.error) {
      return `
        <section class="hero">
          <h1>Find Your Next Opportunity</h1>
          <p class="error-message">⚠️ Error: ${this.state.error}</p>
          <button onclick="location.reload()" class="apply-btn">Try Again</button>
        </section>
      `;
    }

    if (!this.state.offers || this.state.offers.length === 0) {
      return `
        <section class="hero">
          <h1>Find Your Next Opportunity</h1>
          <p>Discover high-paying accounting and finance jobs</p>
        </section>
        <section class="offer-list">
          <h2>Available Opportunities</h2>
          <div class="no-results">
            <p>No opportunities available at this time.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Please check back soon for new listings.</p>
          </div>
        </section>
      `;
    }

    return `
      <section class="hero">
        <h1>Find Your Next Opportunity</h1>
        <p>Discover high-paying accounting and finance jobs</p>
        <a href="/jobs/" class="cta-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse ${this.state.offers.length} Jobs</a>
      </section>

      <section class="offer-list">
        <h2>Featured Opportunities</h2>
        <div class="offer-grid">
          ${this.state.offers.slice(0, 6).map(offer => this.renderOfferCard(offer)).join('')}
        </div>
      </section>
    `;
  }

  renderCategories() {
    const filteredOffers = this.state.selectedCategory
      ? this.state.offers.filter(offer => offer.category?.slug === this.state.selectedCategory)
      : this.state.offers;

    const resultCount = filteredOffers.length;
    const categoryName = this.state.selectedCategory 
      ? this.state.categories.find(c => c.slug === this.state.selectedCategory)?.name || 'Category'
      : 'All';

    return `
      <div class="categories-container">
        <h2>${categoryName} Jobs ${resultCount > 0 ? `(${resultCount})` : ''}</h2>
        <div class="category-filters">
          <button class="category-filter ${!this.state.selectedCategory ? 'active' : ''}" onclick="app.setSelectedCategory(null)">
            All Jobs
          </button>
          ${this.state.categories.map(cat => `
            <button class="category-filter ${this.state.selectedCategory === cat.slug ? 'active' : ''}" onclick="app.setSelectedCategory('${cat.slug}')">
              ${cat.name}
            </button>
          `).join('')}
        </div>

        ${resultCount > 0 ? `
        <div class="offer-grid">
          ${filteredOffers.map(offer => this.renderOfferCard(offer)).join('')}
        </div>
        ` : `
        <div class="no-results">
          <p>No jobs available in this category.</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Try selecting a different category.</p>
        </div>
        `}
      </div>
    `;
  }

  renderOfferDetail() {
    if (!this.state.selectedOffer) {
      return `
        <div class="offer-detail">
          <a href="/jobs/" class="back-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">← Back to Jobs</a>
          <div class="offer-detail-card">
            <div class="error-message">
              <p style="margin: 0;">⚠️ Job not found or unavailable</p>
            </div>
            <a href="/jobs/" class="apply-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse All Jobs</a>
          </div>
        </div>
      `;
    }

    const o = this.state.selectedOffer;
    const hasCompany = o.company || o.company_domain;
    const hasLocation = o.location || o.location_city || o.location_country;
    const hasSalary = o.salary_min || o.salary_max || o.salary_display;
    const applyUrl = o.apply_url || o.url;
    
    const location = o.location || [o.location_city, o.location_state, o.location_country].filter(Boolean).join(', ') || 'Not specified';

    return `
      <div class="offer-detail">
        <a href="/jobs/" class="back-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">← Back to Jobs</a>
        <div class="offer-detail-card">
          <h1>${o.title}</h1>
          
          <div class="job-header-meta">
            ${hasCompany ? `
            <div class="meta-item">
              <strong>Company</strong>
              <span>${o.company}${o.company_domain ? ` · ${o.company_domain}` : ''}</span>
            </div>` : ''}
            ${hasLocation ? `
            <div class="meta-item">
              <strong>Location</strong>
              <span>${location}</span>
            </div>` : ''}
            ${o.remote !== undefined && o.remote !== null ? `
            <div class="meta-item">
              <strong>Work Mode</strong>
              <span>${o.remote ? '✓ Remote' : 'On-site'}</span>
            </div>` : ''}
            ${o.employment_type ? `
            <div class="meta-item">
              <strong>Employment Type</strong>
              <span>${o.employment_type}</span>
            </div>` : ''}
            ${o.category_id ? `
            <div class="meta-item">
              <strong>Category</strong>
              <span>${o.category_id.replace('cat-', '').charAt(0).toUpperCase() + o.category_id.replace('cat-', '').slice(1)}</span>
            </div>` : ''}
            ${o.date_posted ? `
            <div class="meta-item">
              <strong>Posted</strong>
              <span>${new Date(o.date_posted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>` : ''}
          </div>

          ${hasSalary ? `
          <div class="salary-section">
            <h3>Compensation</h3>
            <div class="salary-display">
              ${o.salary_display || (o.salary_min || o.salary_max) ? `${o.salary_display || `${o.salary_currency || 'USD'} ${o.salary_min ? o.salary_min.toLocaleString() : ''}${o.salary_min && o.salary_max ? ' - ' : ''}${o.salary_max ? o.salary_max.toLocaleString() : ''} ${o.salary_period || 'per year'}`}` : 'Not specified'}
            </div>
          </div>` : ''}

          ${applyUrl ? `
          <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn" onclick="app.handleOfferClick('${o.id}')">Apply for this Position</a>
          ` : `
          <button disabled class="apply-btn" style="opacity: 0.5; cursor: not-allowed;">Application Link Not Available</button>
          `}

          ${o.description_html || o.description ? `
          <div class="description-section">
            <h3>Job Description</h3>
            <div class="description-content">
              ${o.description_html ? o.description_html : `<p>${o.description}</p>`}
            </div>
          </div>` : ''}

          ${o.responsibilities ? `
          <div class="job-details">
            <h3>Responsibilities</h3>
            <div class="detail-content">${o.responsibilities}</div>
          </div>` : ''}

          ${o.qualifications ? `
          <div class="job-details">
            <h3>Requirements</h3>
            <div class="detail-content">${o.qualifications}</div>
          </div>` : ''}

          ${o.preferred_qualifications ? `
          <div class="job-details">
            <h3>Preferred Qualifications</h3>
            <div class="detail-content">${o.preferred_qualifications}</div>
          </div>` : ''}

          ${o.education ? `
          <div class="job-details">
            <h3>Education</h3>
            <div class="detail-content">${o.education}</div>
          </div>` : ''}

          ${o.experience ? `
          <div class="job-details">
            <h3>Experience Required</h3>
            <div class="detail-content">${o.experience}</div>
          </div>` : ''}

          ${o.skills && o.skills.length > 0 ? `
          <div class="skills-section">
            <h3>Required Skills</h3>
            <div class="skills-list">
              ${o.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
            </div>
          </div>` : ''}

          ${o.benefits ? `
          <div class="job-details">
            <h3>Benefits</h3>
            <div class="detail-content">${Array.isArray(o.benefits) ? o.benefits.map(b => `<div>• ${b}</div>`).join('') : o.benefits}</div>
          </div>` : ''}

          ${applyUrl ? `
          <a href="${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn" onclick="app.handleOfferClick('${o.id}')">Apply for this Position</a>
          ` : ''}
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
    const permalink = this.generateJobPermalink(offer);
    const location = offer.location || [offer.location_city, offer.location_state, offer.location_country].filter(Boolean).join(', ') || 'Location not specified';
    const hasDescription = offer.description && offer.description.trim().length > 0;
    
    return `
      <div class="offer-card">
        <a href="${permalink}" class="offer-card-link" onclick="event.preventDefault(); app.navigate('${permalink}')">
          <h3>${offer.title}</h3>
          <div class="offer-meta">
            <span class="category">${offer.category?.name || offer.category_id?.replace('cat-', '').toUpperCase() || 'General'}</span>
            ${offer.employment_type ? `<span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; background: #f0f0f0; font-size: 0.8rem;">${offer.employment_type}</span>` : ''}
          </div>
          ${hasDescription ? `<p>${offer.description.substring(0, 120)}...</p>` : ''}
          <div class="offer-footer">
            <span style="font-size: 0.8rem; color: #666;">${location}</span>
            ${offer.remote ? '<span style="font-size: 0.8rem; color: #059669;">✓ Remote</span>' : ''}
          </div>
        </a>
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
}
