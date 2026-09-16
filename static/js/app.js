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
      routeParams: {},
      paginationTotal: 0,
      currentPage: 1,
      pageSize: 20,
      searchQuery: null,
      relatedJobs: [],
      relatedJobsLoading: false
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
      
      // If jobId found, render job detail
      if (jobId) {
        this.state.currentView = 'offer-detail';
        this.state.routeParams = { id: jobId };
        await this.loadOfferDetail();
        this.render();
        return;
      }
      
      // If no jobId, check if it's a category slug
      const categoryId = await this.getCategoryIdBySlug(pathSegment);
      if (categoryId) {
        this.state.currentView = 'categories';
        this.state.selectedCategory = categoryId;
        this.state.currentPage = 1;
        this.state.routeParams = { category: pathSegment };
        await this.loadCategories();
        this.render();
        return;
      }
      
      // Neither job nor category found
      this.state.currentView = 'offer-detail';
      this.state.routeParams = {};
      this.state.error = 'Job not found';
      this.state.selectedOffer = null;
      this.render();
      return;
    }
    
    if (pathname === '/jobs' || pathname === '/jobs/') {
      this.state.currentView = 'categories';
      this.state.selectedCategory = null;
      this.state.currentPage = 1;
      
      // Parse query parameters from URL
      const searchParams = new URLSearchParams(window.location.search);
      this.state.routeParams = {};
      searchParams.forEach((value, key) => {
        this.state.routeParams[key] = value;
      });
      
      // Extract search query if present
      this.state.searchQuery = searchParams.get('q') || null;
      
      await this.loadCategories();
      this.render();
      return;
    }

    // Privacy Policy route
    if (pathname === '/privacy' || pathname === '/privacy/') {
      this.state.currentView = 'privacy';
      this.state.routeParams = {};
      this.render();
      return;
    }

    // Default to landing if no route matched
    this.state.currentView = 'landing';
    this.state.routeParams = {};
    await this.loadLanding();
    this.render();
    return;
    
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

  async getCategoryIdBySlug(slug) {
    // Try to find category by slug from current offers
    for (const offer of this.state.offers) {
      if (offer.category && offer.category.slug === slug) {
        return offer.category_id;
      }
    }
    
    // If not found in current offers, load all categories and search
    try {
      const response = await this.apiCall('/api/categories');
      if (response.ok) {
        const data = await response.json();
        const categories = data.categories || [];
        
        for (const cat of categories) {
          // Backend returns category_id (e.g., "cat-engineering")
          // Derive slug from category_id (remove "cat-" prefix)
          const catSlug = cat.category_id ? cat.category_id.replace(/^cat-/, '') : null;
          if (catSlug === slug) {
            return cat.category_id;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
    
    return null;
  }

  generateJobPermalink(job) {
    if (!job || !job.id) return '/';
    const slug = this.normalizeSlug(job.title || 'job');
    return `/jobs/${slug}-${job.id}`;
  }

  generateCategoryUrl(categoryId, categorySlug) {
    // Use slug if available, otherwise derive from categoryId
    const slug = categorySlug || this.getCategorySlugFromId(categoryId);
    return slug ? `/jobs/${slug}` : '/jobs/';
  }

  getCategorySlugFromId(categoryId) {
    if (!categoryId) return null;
    // Remove 'cat-' prefix to get slug (cat-engineering → engineering)
    return categoryId.replace(/^cat-/, '');
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

      const response = await this.apiCall('/api/offers', { status: 'active', limit: 6 });
      if (response.ok) {
        const data = await response.json();
        this.state.offers = data.offers || [];
        this.state.paginationTotal = data.pagination?.total || 0;
      }

      const categoriesResponse = await this.apiCall('/api/categories');
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

      const response = await this.apiCall('/api/categories');
      if (response.ok) {
        const data = await response.json();
        this.state.categories = data.categories || [];
      }

      const page = parseInt(this.state.routeParams.page) || 1;
      const limit = 20;
      const params = { status: 'active', limit, page };
      
      // Pass category_id to filter if selected
      if (this.state.selectedCategory) {
        params.category_id = this.state.selectedCategory;
      }

      // Pass search query if present in URL
      const urlParams = new URLSearchParams(window.location.search);
      const q = urlParams.get('q');
      if (q) {
        params.q = q;
        this.state.searchQuery = q; // Store in state for display
      } else {
        this.state.searchQuery = null;
      }
      
      const offersResponse = await this.apiCall('/api/offers', params);
      if (offersResponse.ok) {
        const data = await offersResponse.json();
        this.state.offers = data.offers || [];
        this.state.paginationTotal = data.pagination?.total || 0;
        this.state.currentPage = page;
        this.state.pageSize = limit;
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
      const response = await this.apiCall(`/api/offers/${offerId}`);
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
      
      // Load related jobs asynchronously after page renders
      if (this.state.selectedOffer) {
        this.loadRelatedJobs();
      }
    }
  }

  async loadRelatedJobs() {
    if (!this.state.selectedOffer || !this.state.selectedOffer.title) {
      return;
    }

    this.state.relatedJobsLoading = true;
    this.state.relatedJobs = [];

    try {
      // Extract base keyword from title for broader search
      const fullTitle = this.state.selectedOffer.title;
      let keyword = fullTitle;
      
      // Remove common qualifiers to get base role
      // e.g., "Senior Software Engineer, Infrastructure" → "Software Engineer"
      keyword = keyword.replace(/^(Senior|Junior|Lead|Staff|Principal|Associate)\s+/i, '');
      keyword = keyword.replace(/,.*$/, '').trim(); // Remove everything after comma
      
      const limit = 10; // Request 10 to ensure 6 after filtering current job
      const response = await this.apiCall('/api/offers', { q: keyword, limit });
      
      if (response.ok) {
        const data = await response.json();
        const allJobs = data.offers || [];
        
        // Exclude current job by ID
        const currentJobId = this.state.selectedOffer.id;
        const filtered = allJobs.filter(job => job.id !== currentJobId);
        
        this.state.relatedJobs = filtered.slice(0, 6);
      }
    } catch (error) {
      console.error('Related jobs load error:', error);
      this.state.relatedJobs = [];
    } finally {
      this.state.relatedJobsLoading = false;
      this.render();
    }
  }

  loadAdmin() {
    this.state.currentView = 'admin';
    this.render();
  }

  renderPrivacyPolicy() {
    return `
      <div class="page-container">
        <div class="content-wrapper">
          <div class="page-header">
            <h1>Privacy Policy</h1>
            <p class="page-subtitle"><strong>Effective Date:</strong> September 13, 2026</p>
          </div>
          <div class="page-content">
            <section class="content-section">
              <p><strong>USA Jobs</strong> is a job discovery and listing platform that helps users explore employment opportunities from multiple employers. This Privacy Policy explains how we collect, use, and protect information when you visit and use our website.</p>
            </section>
            <section class="content-section">
              <h2>1. Information We Collect</h2>
              <h3>Information You Provide</h3>
              <ul>
                <li><strong>Search queries:</strong> When you search for jobs, we collect the keywords you enter.</li>
                <li><strong>Browse history:</strong> We record which job listings you view and interact with.</li>
                <li><strong>Click events:</strong> When you click "Apply" or navigate to an external job application, we record this action for analytics and tracking purposes.</li>
              </ul>
              <h3>Automatically Collected Information</h3>
              <ul>
                <li><strong>HTTP request data:</strong> IP address, user agent, browser type, operating system, and referrer information.</li>
                <li><strong>Page activity:</strong> URL paths, search parameters, and navigation patterns within our site.</li>
                <li><strong>Timestamps:</strong> When you access pages and perform actions.</li>
              </ul>
            </section>
            <section class="content-section">
              <h2>2. How We Use Information</h2>
              <p>We use collected information for the following purposes:</p>
              <ul>
                <li>To provide and improve the job discovery platform.</li>
                <li>To understand which job listings and categories are most relevant to users.</li>
                <li>To analyze user search behavior and browsing patterns.</li>
                <li>To track job application engagement for analytics and reporting.</li>
                <li>To monitor platform health and prevent misuse.</li>
              </ul>
            </section>
            <section class="content-section">
              <h2>3. Job Listings and External Links</h2>
              <p><strong>USA Jobs operates as a job discovery platform.</strong> When you click a job listing, you are redirected to an external employer website or job application platform. Once you leave USA Jobs, our Privacy Policy no longer applies. The external platform's privacy policy governs their collection and use of your information.</p>
            </section>
            <section class="content-section">
              <h2>4. Click Tracking</h2>
              <p>When you click "Apply" or interact with job listings, we record the job ID, title, your IP address, user agent, referrer, and timestamp. This data is used to measure engagement and improve the user experience.</p>
            </section>
            <section class="content-section">
              <h2>5. Third-Party Services</h2>
              <ul>
                <li><strong>Cloudflare:</strong> We use Cloudflare for content delivery and hosting. See <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener">Cloudflare's Privacy Policy</a>.</li>
                <li><strong>Ashby:</strong> We integrate with Ashby's job posting API to discover and display job listings. See <a href="https://www.ashby.ai/privacy" target="_blank" rel="noopener">Ashby's Privacy Policy</a>.</li>
              </ul>
            </section>
            <section class="content-section">
              <h2>6. Data Retention</h2>
              <p>We retain click and search activity data for up to 12 months. Aggregate anonymized data may be retained indefinitely.</p>
            </section>
            <section class="content-section">
              <h2>7. Data Security</h2>
              <p>We implement reasonable security measures including HTTPS encryption, secure database access controls, and security monitoring. However, no security system is impenetrable.</p>
            </section>
            <section class="content-section">
              <h2>8. Children's Privacy</h2>
              <p>USA Jobs is not directed to children under 13. We do not knowingly collect information from children under 13.</p>
            </section>
            <section class="content-section">
              <h2>9. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Your continued use of USA Jobs following updates constitutes acceptance of those changes.</p>
            </section>
            <section class="content-section">
              <h2>10. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us through the footer link on this website.</p>
            </section>
          </div>
        </div>
      </div>
    `;
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
      case 'job-expired':
        html = this.renderJobExpired();
        break;
      case 'verification-error':
        html = this.renderVerificationError();
        break;
      case 'privacy':
        html = this.renderPrivacyPolicy();
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
    let description = 'Discover professional job opportunities across all industries. Browse positions in engineering, data science, design, legal, marketing, sales, and more from top employers.';
    let canonicalUrl = `${canonicalHostname}/`;
    let ogTitle = 'USA Jobs | Professional Job Opportunities';
    let ogDescription = description;
    let ogType = 'website';
    let twitterTitle = ogTitle;
    let twitterDescription = description;

    if (this.state.currentView === 'privacy') {
      title = 'Privacy Policy | USA Jobs';
      description = 'Learn about USA Jobs privacy practices, data collection, and how we protect your information when you search for jobs.';
      canonicalUrl = `${canonicalHostname}/privacy/`;
      ogTitle = 'Privacy Policy | USA Jobs';
      ogDescription = description;
      twitterTitle = ogTitle;
      twitterDescription = description;
    } else if (this.state.currentView === 'offer-detail') {
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
      } else if (this.state.error) {
        title = 'Job Not Found | USA Jobs';
        description = 'The job you are looking for could not be found.';
        canonicalUrl = `${canonicalHostname}/jobs/`;
      }
    } else if (this.state.currentView === 'landing') {
      if (window.location.pathname.startsWith('/jobs')) {
        title = 'Jobs | USA Jobs';
        description = 'Browse available professional job opportunities across all industries. Find your next career move.';
        canonicalUrl = `${canonicalHostname}/jobs/`;
        ogTitle = 'Available Jobs | USA Jobs';
      } else {
        title = 'USA Jobs | Professional Job Opportunities';
        description = 'Discover professional job opportunities across all industries. Browse positions in engineering, data science, design, legal, marketing, sales, and more from top employers.';
        
        ogTitle = 'USA Jobs | Professional Job Opportunities';
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

  renderLanding() {
    const jobCount = this.state.offers?.length || 0;
    const totalJobs = this.state.paginationTotal || jobCount;
    
    if (this.state.loading) {
      return `
        <section class="hero">
          <div class="hero-container">
            <h1>Find The Best Job For Your Future</h1>
            <p>Search thousands of opportunities from top employers across all industries and career levels.</p>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs" id="search-input-hero">
              <button class="search-btn" onclick="app.handleSearch('search-input-hero')">Search</button>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">RECENT JOBS</h2>
          <p class="section-subtitle">Browse through our latest professional opportunities from top employers</p>
          <div class="loading-message">Loading opportunities...</div>
        </section>
      `;
    }

    if (this.state.error) {
      return `
        <section class="hero">
          <div class="hero-container">
            <h1>Find The Best Job For Your Future</h1>
            <p>Search thousands of opportunities from top employers across all industries and career levels.</p>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs" id="search-input-hero-error">
              <button class="search-btn" onclick="app.handleSearch('search-input-hero-error')">Search</button>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">RECENT JOBS</h2>
          <p class="section-subtitle">Browse through our latest professional opportunities from top employers</p>
          <div class="error-message">Error loading jobs: ${this.state.error}</div>
        </section>
      `;
    }

    if (jobCount === 0) {
      return `
        <section class="homepage-hero">
          <div class="hero-container">
            <div class="hero-content">
              <h1 class="hero-title">Find Your Next Opportunity</h1>
              <p class="hero-subtitle">Discover professional opportunities from top employers across all industries. Start your career journey today.</p>
              
              <div class="search-box">
                <form class="search-form" onsubmit="event.preventDefault(); app.handleSearch('search-input-form')">
                  <div class="search-input-wrapper">
                    <input type="text" class="search-input" placeholder="Job title or keyword" aria-label="Job title search" id="search-input-form">
                  </div>
                  <button type="submit" class="search-btn">Find Jobs</button>
                </form>
              </div>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">RECENT JOBS</h2>
          <p class="section-subtitle">Browse through our latest professional opportunities from top employers</p>
          <div class="no-results">No jobs available at the moment. Check back soon!</div>
        </section>
      `;
    }

    // Get unique categories from offers
    const categoriesSet = new Set();
    this.state.offers.forEach(offer => {
      if (offer.category && offer.category.name) {
        categoriesSet.add(JSON.stringify({
          name: offer.category.name,
          slug: offer.category.slug
        }));
      }
    });
    const categories = Array.from(categoriesSet).map(c => JSON.parse(c)).slice(0, 6);

    return `
      <section class="hero">
        <div class="hero-container">
          <h1>Find The Best Job For Your Future</h1>
          <p>Search thousands of opportunities from top employers across all industries and career levels.</p>
          
          <div class="search-container">
            <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs" id="search-input-main">
            <button class="search-btn" onclick="app.handleSearch('search-input-main')">Search</button>
          </div>
        </div>
      </section>
      
      <section class="section jobs-section">
        <h2 class="section-title">RECENT JOBS</h2>
        <p class="section-subtitle">Browse through our latest professional opportunities from top employers</p>
        
        <div class="jobs-grid">
          ${this.state.offers.slice(0, 10).map(offer => this.renderJobCard(offer)).join('')}
        </div>
        
        ${jobCount > 10 ? `<button class="view-more-btn" onclick="app.navigate('/jobs/')">View More Jobs</button>` : ''}
      </section>
      
      <section class="cta-section">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Find Your Dream Job?</h2>
          <p class="cta-text">Browse all ${totalJobs} opportunities and take the next step in your career</p>
          <button class="cta-btn" onclick="app.navigate('/jobs/')">View All Jobs</button>
        </div>
      </section>
    `;
  }

  renderJobCard(offer) {
    const permalink = this.generateJobPermalink(offer);
    const location = offer.location || [offer.location_city, offer.location_state, offer.location_country].filter(Boolean).join(', ') || 'Location not specified';
    const salary = offer.salary_min || offer.salary_max ? `$${offer.salary_min || offer.salary_max}${offer.salary_period ? '/' + offer.salary_period : ''}` : null;
    const applyUrl = offer.apply_url;
    const company = offer.company || 'Company';
    
    return `
      <div class="job-card">
        <div class="job-card-header">
          <a href="${permalink}" class="job-title" onclick="event.preventDefault(); app.navigate('${permalink}')">${offer.title}</a>
          <p class="job-company">${company}</p>
        </div>
        
        <div class="job-meta">
          <div class="job-meta-item">📍 ${location}</div>
          ${offer.employment_type ? `<div class="job-meta-item">📋 ${offer.employment_type}</div>` : ''}
          ${offer.remote ? `<div class="job-meta-item">🌍 Remote</div>` : ''}
        </div>
        
        <div class="job-badges">
          ${offer.category ? `<span class="job-badge">${offer.category.name || 'Job'}</span>` : ''}
          ${offer.remote ? `<span class="job-badge">Remote</span>` : ''}
        </div>
        
        ${offer.description ? `<p class="job-description">${offer.description.substring(0, 100)}${offer.description.length > 100 ? '...' : ''}</p>` : ''}
        
        <div class="job-footer">
          ${salary ? `<span class="job-salary">${salary}</span>` : '<span></span>'}
          ${applyUrl ? `<button type="button" class="apply-btn" onclick="event.stopPropagation(); app.handleOfferClick('${offer.id}')">Apply Now</button>` : '<button class="apply-btn" disabled>Apply</button>'}
        </div>
      </div>
    `;
  }

  formatCategoryName(categoryId) {
    if (!categoryId) return '';
    return categoryId
      .replace(/^cat-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  renderCategories() {
    const filteredOffers = this.state.selectedCategory
      ? this.state.offers.filter(offer => offer.category_id === this.state.selectedCategory)
      : this.state.offers;

    const resultCount = filteredOffers.length;
    const totalCount = this.state.paginationTotal || resultCount;
    const currentPage = this.state.currentPage || 1;
    const pageSize = this.state.pageSize || 20;
    const totalPages = Math.ceil(totalCount / pageSize);

    const paginationHTML = totalPages > 1 ? `
      <div class="pagination">
        <div class="pagination-info">
          Page ${currentPage} of ${totalPages} (${totalCount} total jobs)
        </div>
        <div class="pagination-controls">
          ${currentPage > 1 ? `<button class="pagination-btn" onclick="app.goToPage(${currentPage - 1})">← Previous</button>` : ''}
          ${currentPage < totalPages ? `<button class="pagination-btn" onclick="app.goToPage(${currentPage + 1})">Next →</button>` : ''}
        </div>
      </div>
    ` : '';

    return `
      <div class="categories-container">
        <h2>${totalCount} Jobs</h2>
        <p class="listing-subtitle">Find your next professional opportunity</p>
        <div class="category-filters">
          <a href="/jobs/" class="category-filter ${!this.state.selectedCategory ? 'active' : ''}" onclick="event.preventDefault(); app.navigate('/jobs/')">
            All Jobs
          </a>
          ${this.state.categories.map(cat => `
            <a href="${this.generateCategoryUrl(cat.category_id, cat.slug)}" class="category-filter ${this.state.selectedCategory === cat.category_id ? 'active' : ''}" onclick="event.preventDefault(); app.navigate('${this.generateCategoryUrl(cat.category_id, cat.slug)}')">
              ${this.formatCategoryName(cat.category_id)}
            </a>
          `).join('')}
        </div>

        ${resultCount > 0 ? `
        <div class="offer-grid">
          ${filteredOffers.map(offer => this.renderOfferCard(offer)).join('')}
        </div>
        ${paginationHTML}
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
        <div class="job-detail-page">
          <div class="job-detail-container">
            <div class="job-not-found">
              <h1>Job Not Found</h1>
              <p>The job you're looking for is no longer available.</p>
              <a href="/" class="back-link" onclick="event.preventDefault(); app.navigate('/')">← Back to Jobs</a>
            </div>
          </div>
        </div>
      `;
    }

    const job = this.state.selectedOffer;
    const applyUrl = job.apply_url;
    const location = job.location || [job.location_city, job.location_state, job.location_country].filter(Boolean).join(', ');
    
    const hasSalary = job.salary_min || job.salary_max;
    let salaryText = '';
    if (hasSalary) {
      const currency = job.salary_currency || 'USD';
      const symbol = currency === 'USD' ? '$' : currency;
      const min = job.salary_min ? `${symbol}${(job.salary_min / 1000).toFixed(0)}k` : '';
      const max = job.salary_max ? `${symbol}${(job.salary_max / 1000).toFixed(0)}k` : '';
      salaryText = (min && max) ? `${min} – ${max}` : (min || max);
      salaryText += job.salary_period ? ` / ${job.salary_period}` : ' / year';
    }

    const hasDescriptionHtml = job.description_html && job.description_html.trim().length > 0;
    const hasDescription = job.description && job.description.trim().length > 0;
    const hasResponsibilities = job.responsibilities && job.responsibilities.trim().length > 0;
    const hasRequirements = job.requirements && job.requirements.trim().length > 0;
    const hasQualifications = job.qualifications && job.qualifications.trim().length > 0;
    const hasBenefits = job.benefits && (Array.isArray(job.benefits) ? job.benefits.length > 0 : typeof job.benefits === 'string' && job.benefits.trim().length > 0);
    const hasEducation = job.education && job.education.trim().length > 0;
    const hasSkills = job.skills && job.skills.trim().length > 0;
    const hasExperience = job.experience && job.experience.trim().length > 0;
    const hasDatePosted = job.date_posted || job.created_at;
    const categoryName = job.category_id ? job.category_id.replace('cat-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
    
    return `
      <div class="job-detail-page">
        <div class="job-detail-container">
          
          <div class="job-breadcrumb">
            <a href="/" onclick="event.preventDefault(); app.navigate('/')">Jobs</a>
            ${categoryName ? `<span>/</span><a href="${this.generateCategoryUrl(job.category_id, job.category?.slug)}" onclick="event.preventDefault(); app.navigate('${this.generateCategoryUrl(job.category_id, job.category?.slug)}')">${categoryName}</a>` : ''}
            <span>/</span><span>${job.title}</span>
          </div>

          <div class="job-header">
            <div class="job-header-main">
              <div class="job-header-content">
                <h1 class="job-title">${job.title}</h1>
                <div class="job-company-info">
                  ${job.company ? `<span class="job-company">${job.company}</span>` : ''}
                  ${location ? `<a href="/jobs/" class="job-location" onclick="event.preventDefault(); app.navigate('/jobs/')">📍 ${location}</a>` : ''}
                </div>
              </div>
            </div>
            
            <div class="job-header-meta">
              ${job.employment_type ? `<a href="/jobs/" class="job-meta-badge" onclick="event.preventDefault(); app.navigate('/jobs/')">📋 ${job.employment_type}</a>` : ''}
              ${job.remote ? `<a href="/jobs/" class="job-meta-badge remote" onclick="event.preventDefault(); app.navigate('/jobs/')">🌍 ${job.workplace_type || 'Remote'}</a>` : ''}
              ${categoryName ? `<a href="${this.generateCategoryUrl(job.category_id, job.category?.slug)}" class="job-meta-badge category" onclick="event.preventDefault(); app.navigate('${this.generateCategoryUrl(job.category_id, job.category?.slug)}')">${categoryName}</a>` : ''}
            </div>
          </div>

          <div class="job-content-grid">
            
            <aside class="job-sidebar">
              
              <div class="sidebar-card apply-card">
                ${applyUrl ? `<button type="button" class="apply-button" onclick="app.handleOfferClick('${job.id}')">Apply for this Position</button>` : `<button class="apply-button" disabled style="opacity: 0.5; cursor: not-allowed;">Application Link Not Available</button>`}
                <p class="apply-note">You will be redirected to the application page.</p>
              </div>

              ${hasSalary ? `<div class="salary-section"><div class="salary-label">Compensation</div><div class="salary-amount">${salaryText}</div></div>` : ''}
              
              <div class="sidebar-card">
                <h3 class="sidebar-card-title">Job Overview</h3>
                <div class="sidebar-info-group">
                  ${job.employment_type ? `<div class="sidebar-info-item"><span class="sidebar-label">Employment Type</span><span class="sidebar-value">${job.employment_type}</span></div>` : ''}
                  ${location ? `<div class="sidebar-info-item"><span class="sidebar-label">Location</span><span class="sidebar-value">${location}</span></div>` : ''}
                  ${job.remote !== undefined && job.remote !== null ? `<div class="sidebar-info-item"><span class="sidebar-label">Work Mode</span><span class="sidebar-value">${job.workplace_type || (job.remote ? 'Remote' : 'On-site')}</span></div>` : ''}
                  ${categoryName ? `<div class="sidebar-info-item"><span class="sidebar-label">Category</span><span class="sidebar-value">${categoryName}</span></div>` : ''}
                  ${hasExperience ? `<div class="sidebar-info-item"><span class="sidebar-label">Experience</span><span class="sidebar-value">${job.experience}</span></div>` : ''}
                  ${hasDatePosted ? `<div class="sidebar-info-item"><span class="sidebar-label">Posted</span><span class="sidebar-value">${new Date(job.date_posted || job.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>` : ''}
                </div>
              </div>

              <div class="sidebar-card">
                <h3 class="sidebar-card-title">Share</h3>
                <div class="share-buttons">
                  <button class="share-btn" title="Share on LinkedIn" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href), '_blank')">LinkedIn</button>
                  <button class="share-btn" title="Share on Twitter" onclick="window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(window.location.href), '_blank')">Twitter</button>
                </div>
              </div>

            </aside>
            
            <main class="job-main-content">
              ${hasDescriptionHtml ? `<section class="job-section"><h2>About the Role</h2><div class="job-description-text">${job.description_html}</div></section>` : hasDescription ? `<section class="job-section"><h2>About the Role</h2><div class="job-description-text">${job.description.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : ''}
              ${hasResponsibilities ? `<section class="job-section"><h2>Responsibilities</h2><div class="job-description-text">${job.responsibilities.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : ''}
              ${hasQualifications ? `<section class="job-section"><h2>Qualifications</h2><div class="job-description-text">${job.qualifications.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : hasRequirements ? `<section class="job-section"><h2>Requirements</h2><div class="job-description-text">${job.requirements.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : ''}
              ${hasSkills ? `<section class="job-section"><h2>Skills</h2><div class="job-description-text">${job.skills.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : ''}
              ${hasEducation ? `<section class="job-section"><h2>Education</h2><div class="job-description-text">${job.education.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : ''}
              ${hasBenefits ? `<section class="job-section"><h2>Benefits & Perks</h2><div class="job-description-text">${Array.isArray(job.benefits) ? '<ul>' + job.benefits.map(b => `<li>${b}</li>`).join('') + '</ul>' : job.benefits.split('\\n\\n').map(p => `<p>${p}</p>`).join('')}</div></section>` : ''}
              
              ${this.renderRelatedJobs()}
            </main>

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

  renderJobExpired() {
    const job = this.state.expiredJob || {};
    
    return `
      <div class="job-detail-page">
        <div class="job-detail-container">
          <div class="job-not-found">
            <h1>Job No Longer Available</h1>
            <p>This job posting has expired or is no longer accepting applications.</p>
            ${job.title ? `<p class="expired-job-title">"${job.title}"</p>` : ''}
            <p style="font-size: 0.875rem; color: #666; margin-top: 1rem;">The application page for this position is no longer accessible.</p>
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
              <a href="/jobs/" class="apply-button" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse All Jobs</a>
              ${job.id ? `<a href="/jobs/" class="back-link" onclick="event.preventDefault(); history.back()">← Back</a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderVerificationError() {
    const error = this.state.verificationError || {};
    
    return `
      <div class="job-detail-page">
        <div class="job-detail-container">
          <div class="job-not-found">
            <h1>Unable to Verify Application Page</h1>
            <p>We couldn't verify the application page availability right now.</p>
            ${error.title ? `<p class="expired-job-title">"${error.title}"</p>` : ''}
            <p style="font-size: 0.875rem; color: #666; margin-top: 1rem;">This may be a temporary issue. You can try again or return to browse other jobs.</p>
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              ${error.offerId ? `<button class="apply-button" onclick="app.retryApply('${error.offerId}')">Retry</button>` : ''}
              <a href="/jobs/" class="back-link" onclick="event.preventDefault(); app.navigate('/jobs/')">← Browse Jobs</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async retryApply(offerId) {
    await this.handleOfferClick(offerId);
  }

  renderOfferCard(offer) {
    const permalink = this.generateJobPermalink(offer);
    const location = offer.location || [offer.location_city, offer.location_state, offer.location_country].filter(Boolean).join(', ') || 'Location not specified';
    const salary = offer.salary_min || offer.salary_max ? `$${offer.salary_min || offer.salary_max}${offer.salary_period ? '/' + offer.salary_period : ''}` : null;
    const applyUrl = offer.apply_url;
    const company = offer.company || 'Company';
    
    return `
      <div class="job-card">
        <div class="job-card-header">
          <a href="${permalink}" class="job-title" onclick="event.preventDefault(); app.navigate('${permalink}')">${offer.title}</a>
          <p class="job-company">${company}</p>
        </div>
        
        <div class="job-meta">
          <div class="job-meta-item">📍 ${location}</div>
          ${offer.employment_type ? `<div class="job-meta-item">·</div><div class="job-meta-item">${offer.employment_type}</div>` : ''}
          ${offer.remote ? `<div class="job-meta-item">·</div><div class="job-meta-item">🌍 Remote</div>` : ''}
        </div>
        
        ${offer.description ? `<p class="job-description">${offer.description.substring(0, 120)}${offer.description.length > 120 ? '...' : ''}</p>` : ''}
        
        <div class="job-footer">
          ${salary ? `<span class="job-salary">${salary}</span>` : '<span></span>'}
          ${applyUrl ? `<button type="button" class="apply-btn" onclick="event.stopPropagation(); app.navigate('${permalink}')">View Job →</button>` : '<button class="apply-btn" disabled>View Job</button>'}
        </div>
      </div>
    `;
  }

  setSelectedCategory(category) {
    this.state.selectedCategory = category;
    this.state.currentPage = 1;
    this.render();
  }

  renderRelatedJobs() {
    if (this.state.relatedJobsLoading) {
      return `
        <section class="related-jobs-section">
          <h2 class="related-jobs-title">Related Jobs</h2>
          <div class="related-jobs-grid">
            <div class="loading-message">Loading related opportunities...</div>
          </div>
        </section>
      `;
    }

    if (!this.state.relatedJobs || this.state.relatedJobs.length === 0) {
      return '';
    }

    return `
      <section class="related-jobs-section">
        <h2 class="related-jobs-title">Related Jobs</h2>
        <div class="related-jobs-grid">
          ${this.state.relatedJobs.map(job => this.renderOfferCard(job)).join('')}
        </div>
      </section>
    `;
  }

  async goToPage(pageNum) {
    this.state.currentPage = pageNum;
    this.state.routeParams.page = pageNum;
    await this.loadCategories();
    this.render();
  }

  handleSearch(inputId) {
    const input = document.getElementById(inputId);
    if (!input) {
      console.error('Search input not found:', inputId);
      return;
    }

    const keyword = input.value.trim();
    
    if (!keyword) {
      // Empty search - navigate to all jobs
      this.navigate('/jobs/');
      return;
    }

    // Navigate to jobs with search query parameter
    const encodedKeyword = encodeURIComponent(keyword);
    this.navigate(`/jobs/?q=${encodedKeyword}`);
  }

  async handleOfferClick(offerId) {
    const offer = this.state.selectedOffer || this.state.offers.find(o => o.id === offerId);
    
    if (!offer || !offer.apply_url) {
      console.error('No apply URL found for offer:', offerId);
      return false;
    }
    // Verify apply URL before redirect
        try {
          const verifyResponse = await this.apiCall(`/api/apply?id=${encodeURIComponent(offerId)}&url=${encodeURIComponent(offer.apply_url)}`);
          const verifyResult = await verifyResponse.json();

          // ONLY expired: true means job has expired
      if (verifyResult.expired === true) {
        // Job application URL returned 404 - show expired state
        this.state.currentView = 'job-expired';
        this.state.expiredJob = {
          id: offerId,
          title: offer.title,
          statusCode: verifyResult.statusCode
        };
        this.render();
        return false;
      }

      // available: true means we can redirect
      if (verifyResult.available === true) {
        // Track click
        const clickData = {
          offer_id: offerId,
          ip_address: 'unknown',
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          metadata: {
            source: 'frontend_mvp',
            timestamp: new Date().toISOString(),
            apply_url_verified: true
          }
        };

        await this.trackClick(offerId, clickData);

        // Open verified URL in a new tab, keep Job Detail in current tab
        const redirectUrl = verifyResult.redirectUrl || offer.apply_url;
        window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        return true;
      }

      // Otherwise: verification failed but NOT expired (500, 400, network error, etc.)
      // Show temporary error with retry option
      this.state.currentView = 'verification-error';
      this.state.verificationError = {
        offerId,
        applyUrl: offer.apply_url,
        title: offer.title,
        error: verifyResult.error
      };
      this.render();
      return false;
    } catch (error) {
      console.error('Apply verification failed:', error);
      
      // On verification failure, show retry option
      this.state.currentView = 'verification-error';
      this.state.verificationError = {
        offerId,
        applyUrl: offer.apply_url,
        title: offer.title
      };
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
