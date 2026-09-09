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
   Phase 2: Mobile Responsive + States */

:root {
  --primary: #007acc;
  --text-primary: #333;
  --text-secondary: #666;
  --border-color: #e0e0e0;
  --bg-light: #fafafa;
  --bg-white: #fff;
  --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
  --radius: 8px;
}

* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 0;
  background: var(--bg-light);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

/* Header & Navigation */
header {
  background: var(--bg-white);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
}

.logo {
  font-size: 1.3rem;
  font-weight: bold;
  color: var(--primary);
  text-decoration: none;
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.nav-links a {
  color: var(--text-primary);
  text-decoration: none;
  padding: 0.5rem;
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
}

.nav-links a:hover {
  color: var(--primary);
}

/* Hero Section */
.hero {
  max-width: 1200px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  text-align: center;
  background: var(--bg-white);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.hero h1 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.hero p {
  color: var(--text-secondary);
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

/* Jobs List */
.offer-list {
  max-width: 1200px;
  margin: 1rem auto;
  padding: 0 1rem;
}

.offer-list h2 {
  font-size: 1.25rem;
  margin: 1rem 0 0.75rem 0;
}

.offer-card {
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 100px;
  display: flex;
  flex-direction: column;
}

.offer-card:hover {
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0,122,204,0.1);
}

.offer-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  line-height: 1.3;
  word-break: break-word;
}

.offer-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.category, .status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f0f0f0;
}

.status.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.offer-card p {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0.25rem 0;
  line-height: 1.4;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.offer-footer {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

.payout {
  font-weight: 600;
  color: var(--primary);
}

/* Offer Detail */
.offer-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.back-btn {
  background: transparent;
  border: none;
  color: var(--primary);
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  min-height: 44px;
  min-width: 44px;
  margin-bottom: 1rem;
}

.back-btn:hover {
  background: #f0f0f0;
  border-radius: 4px;
}

.offer-detail-card {
  background: var(--bg-white);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.offer-detail-card h1 {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  word-break: break-word;
}

.offer-detail-card h3 {
  font-size: 1.1rem;
  margin: 1.5rem 0 0.75rem 0;
  border-bottom: 2px solid var(--primary);
  padding-bottom: 0.5rem;
}

.job-header-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.meta-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.meta-item strong {
  min-width: 80px;
}

.salary-section {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: var(--radius);
  margin-bottom: 1rem;
}

.salary-display {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
}

.description-section {
  margin-bottom: 1.5rem;
}

.description-content {
  line-height: 1.6;
  color: var(--text-secondary);
}

.description-content p {
  margin: 0.5rem 0;
}

.job-details {
  margin-bottom: 1.5rem;
}

.detail-content {
  line-height: 1.6;
  color: var(--text-secondary);
}

.skills-section {
  margin-bottom: 1.5rem;
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.skill-badge {
  display: inline-block;
  background: #e3f2fd;
  color: var(--primary);
  padding: 0.4rem 0.8rem;
  border-radius: 16px;
  font-size: 0.85rem;
}

/* Apply Button */
.apply-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius);
  font-size: 1rem;
  cursor: pointer;
  min-height: 44px;
  margin-top: 1rem;
  transition: background 0.2s;
}

.apply-btn:hover {
  background: #0056a0;
}

/* State Messages */
.no-results, .error-message, .loading-message {
  padding: 2rem;
  text-align: center;
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.error {
  color: #d32f2f;
  font-weight: 600;
}

.error-message {
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: var(--radius);
  color: #d32f2f;
}

.loading-message {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* Footer */
footer {
  background: var(--bg-white);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
  text-align: center;
  font-size: 0.75rem;
  color: #888;
  margin-top: 2rem;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  header {
    padding: 0.75rem;
  }

  .nav {
    padding: 0;
  }

  .logo {
    font-size: 1.1rem;
  }

  .nav-links {
    gap: 0;
    font-size: 0.8rem;
  }

  .hero {
    margin: 1rem;
    padding: 1rem;
  }

  .hero h1 {
    font-size: 1.25rem;
  }

  .hero p {
    font-size: 0.9rem;
  }

  .offer-list {
    padding: 0 0.75rem;
  }

  .offer-card {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .offer-detail-card {
    padding: 1rem;
  }

  .offer-detail-card h1 {
    font-size: 1.25rem;
  }

  .offer-detail-card h3 {
    font-size: 1rem;
  }

  .job-header-meta {
    gap: 0.25rem;
  }

  .meta-item {
    font-size: 0.85rem;
  }

  .apply-btn {
    width: 100%;
    padding: 0.75rem 1rem;
  }
}

@media (max-width: 380px) {
  .nav-links a {
    padding: 0.25rem;
    font-size: 0.75rem;
  }

  .hero h1 {
    font-size: 1.1rem;
  }

  .offer-card h3 {
    font-size: 0.9rem;
  }

  .offer-detail-card h1 {
    font-size: 1.1rem;
  }
}

/* Desktop Optimization */
@media (min-width: 768px) {
  .hero {
    margin: 2rem auto;
    padding: 2rem;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .offer-list {
    margin: 2rem auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .offer-card {
    margin-bottom: 0;
  }

  .offer-detail {
    padding: 2rem;
  }

  .offer-detail-card {
    padding: 2rem;
  }

  .offer-detail-card h1 {
    font-size: 2rem;
  }

  .job-header-meta {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
`;

const APP_JS = `// app.js - USA JOBS Frontend MVP

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
    const ashbyMatch = pathSegment.match(/(ashby-[a-f0-9-]+)\$/i);
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
    return \`/jobs/\${slug}-\${job.id}\`;
  }

  normalizeSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\\w\\s-]/g, '')
      .replace(/\\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+\$/g, '');
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
      const response = await this.apiCall(\`/offers/\${offerId}\`);
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
    let canonicalUrl = \`\${canonicalHostname}/\`;
    let ogTitle = 'USA Jobs | Accounting & Finance Opportunities';
    let ogDescription = description;
    let ogType = 'website';
    let twitterTitle = ogTitle;
    let twitterDescription = description;
    let jobPostingJson = null;

    if (this.state.currentView === 'offer-detail') {
      if (this.state.selectedOffer) {
        const job = this.state.selectedOffer;
        title = \`\${job.title} | USA Jobs\`;
        description = this.generateMetaDescription(job);
        const permalink = this.generateJobPermalink(job);
        canonicalUrl = \`\${canonicalHostname}\${permalink}\`;
        ogTitle = job.title;
        ogDescription = description;
        twitterTitle = job.title;
        twitterDescription = description;
        jobPostingJson = this.generateJobPostingJson(job, canonicalUrl);
      } else if (this.state.error) {
        title = 'Job Not Found | USA Jobs';
        description = 'The job you are looking for could not be found.';
        canonicalUrl = \`\${canonicalHostname}/jobs/\`;
      }
    } else if (this.state.currentView === 'landing') {
      if (window.location.pathname.startsWith('/jobs')) {
        title = 'Jobs | USA Jobs';
        description = 'Browse available accounting and finance job opportunities. Find your next career move.';
        canonicalUrl = \`\${canonicalHostname}/jobs/\`;
        ogTitle = 'Available Jobs | USA Jobs';
      } else {
        title = 'USA Jobs | Accounting & Finance Jobs';
        description = 'Find accounting and finance job opportunities. Browse high-paying CPA positions from top employers.';
        canonicalUrl = \`\${canonicalHostname}/\`;
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
    
    desc = desc.replace(/\\s+/g, ' ').trim();
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
    const selector = \`meta[\${attribute}="\${name}"]\`;
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
      return \`
        <section class="hero">
          <h1>Find Your Next Opportunity</h1>
          <p>Discover high-paying accounting and finance jobs</p>
          <p class="loading-message">Loading opportunities...</p>
        </section>
      \`;
    }

    if (this.state.error) {
      return \`
        <section class="hero">
          <h1>Find Your Next Opportunity</h1>
          <p class="error-message">Error: \${this.state.error}</p>
          <button onclick="location.reload()" class="apply-btn">Retry</button>
        </section>
      \`;
    }

    if (!this.state.offers || this.state.offers.length === 0) {
      return \`
        <section class="hero">
          <h1>Find Your Next Opportunity</h1>
          <p>Discover high-paying accounting and finance jobs</p>
        </section>
        <section class="offer-list">
          <h2>Available Opportunities</h2>
          <div class="no-results">No opportunities available at this time. Please check back soon.</div>
        </section>
      \`;
    }

    return \`
      <section class="hero">
        <h1>Find Your Next Opportunity</h1>
        <p>Discover high-paying accounting and finance jobs</p>
        <a href="/jobs/" class="cta-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">View All Jobs</a>
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
        <div class="category-filters">
          <button class="category-filter \${!this.state.selectedCategory ? 'active' : ''}" onclick="app.setSelectedCategory(null)">
            All
          </button>
          \${this.state.categories.map(cat => \`
            <button class="category-filter \${this.state.selectedCategory === cat.slug ? 'active' : ''}" onclick="app.setSelectedCategory('\${cat.slug}')">
              \${cat.name}
            </button>
          \`).join('')}
        </div>

        <div class="offer-grid">
          \${filteredOffers.map(offer => this.renderOfferCard(offer)).join('')}
        </div>
      </div>
    \`;
  }

  renderOfferDetail() {
    if (!this.state.selectedOffer) {
      return \`
        <div class="offer-detail">
          <a href="/jobs/" class="back-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">← Back to Jobs</a>
          <div class="offer-detail-card">
            <div class="error-message">Offer not found or loading...</div>
            <a href="/jobs/" class="apply-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">Back to Opportunities</a>
          </div>
        </div>
      \`;
    }

    const o = this.state.selectedOffer;
    const hasCompany = o.company || o.company_domain;
    const hasLocation = o.location || o.location_city || o.location_country;
    const hasSalary = o.salary_min || o.salary_max || o.salary_display;
    const applyUrl = o.apply_url || o.url;

    return \`
      <div class="offer-detail">
        <a href="/jobs/" class="back-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">← Back to Jobs</a>
        <div class="offer-detail-card">
          <h1>\${o.title}</h1>
          
          <div class="job-header-meta">
            \${hasCompany ? \`<div class="meta-item"><strong>Company:</strong> \${o.company}\${o.company_domain ? \` (\${o.company_domain})\` : ''}</div>\` : ''}
            \${hasLocation ? \`<div class="meta-item"><strong>Location:</strong> \${o.location || [o.location_city, o.location_state, o.location_country].filter(Boolean).join(', ')}</div>\` : ''}
            \${o.remote !== undefined ? \`<div class="meta-item"><strong>Remote:</strong> \${o.remote ? 'Yes' : 'On-site'}</div>\` : ''}
            \${o.employment_type ? \`<div class="meta-item"><strong>Employment:</strong> \${o.employment_type}</div>\` : ''}
            \${o.status ? \`<div class="meta-item"><strong>Status:</strong> <span class="status \${o.status}">\${o.status}</span></div>\` : ''}
          </div>

          \${hasSalary ? \`
          <div class="salary-section">
            <h3>Compensation</h3>
            <div class="salary-display">
              \${o.salary_display || (o.salary_min || o.salary_max) ? \`\${o.salary_display || \`\${o.salary_currency || ''} \${o.salary_min || ''}\${o.salary_min && o.salary_max ? ' - ' : ''}\${o.salary_max || ''} \${o.salary_period || 'per year'}\`}\` : 'Not specified'}
            </div>
          </div>\` : ''}

          \${o.description_html || o.description ? \`
          <div class="description-section">
            <h3>Job Description</h3>
            <div class="description-content">
              \${o.description_html ? o.description_html : \`<p>\${o.description}</p>\`}
            </div>
          </div>\` : ''}

          \${o.experience ? \`
          <div class="job-details">
            <h3>Experience Required</h3>
            <p>\${o.experience}</p>
          </div>\` : ''}

          \${o.skills && o.skills.length > 0 ? \`
          <div class="skills-section">
            <h3>Skills</h3>
            <div class="skills-list">
              \${o.skills.map(skill => \`<span class="skill-badge">\${skill}</span>\`).join('')}
            </div>
          </div>\` : ''}

          \${o.responsibilities ? \`
          <div class="job-details">
            <h3>Responsibilities</h3>
            <div class="detail-content">\${o.responsibilities}</div>
          </div>\` : ''}

          \${o.qualifications ? \`
          <div class="job-details">
            <h3>Requirements</h3>
            <div class="detail-content">\${o.qualifications}</div>
          </div>\` : ''}

          \${o.preferred_qualifications ? \`
          <div class="job-details">
            <h3>Preferred Qualifications</h3>
            <div class="detail-content">\${o.preferred_qualifications}</div>
          </div>\` : ''}

          \${o.education ? \`
          <div class="job-details">
            <h3>Education</h3>
            <div class="detail-content">\${o.education}</div>
          </div>\` : ''}

          \${o.benefits ? \`
          <div class="job-details">
            <h3>Benefits</h3>
            <div class="detail-content">\${Array.isArray(o.benefits) ? o.benefits.map(b => \`<div>• \${b}</div>\`).join('') : o.benefits}</div>
          </div>\` : ''}

          \${applyUrl ? \`
          <a href="\${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn">Apply Now</a>
          \` : \`
          <button disabled class="apply-btn" style="opacity: 0.5; cursor: not-allowed;">Application Link Not Available</button>
          \`}
        </div>
      </div>
    \`;
  }

  renderAdmin() {
    return \`
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
    \`;
  }

  renderOfferCard(offer) {
    const permalink = this.generateJobPermalink(offer);
    return \`
      <div class="offer-card">
        <a href="\${permalink}" class="offer-card-link" onclick="event.preventDefault(); app.navigate('\${permalink}')">
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
        </a>
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
}
`;

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

// SEO Phase 5: Validate job lifecycle before serving detail page
const validateJobForLifecycle = async (pathname, env) => {
  // Check if this is a job detail path
  if (!pathname.startsWith('/jobs/') || pathname.length <= 6) {
    return null; // Not a job detail request
  }

  // Extract job ID from pretty URL (format: /jobs/<slug>-<id>)
  const pathSegment = pathname.slice(6); // Remove '/jobs/' prefix
  
  // Extract job ID (last segment after the last dash)
  const lastDashIndex = pathSegment.lastIndexOf('-');
  if (lastDashIndex === -1) {
    return null; // No dash found, not a valid pretty permalink
  }
  
  const jobId = pathSegment.slice(lastDashIndex + 1);
  if (!jobId) {
    return null; // No ID after dash
  }

  // Query D1 to check if job exists and is active
  try {
    const result = await env.DB.prepare(
      'SELECT id, status FROM offers WHERE id = ?'
    ).bind(jobId).first();

    if (!result) {
      // Job not found in database
      return { exists: false, active: false, jobId };
    }

    if (result.status !== 'active') {
      // Job exists but is not active
      return { exists: true, active: false, jobId, status: result.status };
    }

    // Job is active and valid
    return { exists: true, active: true, jobId };
  } catch (error) {
    console.error('validateJobForLifecycle error:', error);
    // On database error, allow the request to proceed (fail open)
    return null;
  }
};

// GET /jobs/* - Job detail pages with lifecycle validation
const serveJobDetail = async (pathname, env) => {
  const validation = await validateJobForLifecycle(pathname, env);

  if (validation === null) {
    // Not a job detail request or extraction failed, serve normally
    return serveStatic(pathname);
  }

  if (!validation.active) {
    // Job is not active or does not exist - return 404
    return new Response('Job not found', { status: 404 });
  }

  // Job is active - serve the application HTML
  return serveStatic('/');
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

// SEO Phase 7: Normalize category slug consistently
const normalizeCategorySlug = (categoryId) => {
  if (!categoryId) return 'general';
  // Convert cat-engineering → engineering
  return categoryId
    .toLowerCase()
    .replace(/^cat-/, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const getCategoryNameFromId = (categoryId) => {
  if (!categoryId) return 'General';
  // Convert cat-engineering → Engineering
  return categoryId
    .replace(/^cat-/, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// GET /categories - List categories
const getCategories = async (env) => {
  try {
    const result = await env.DB.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active" ORDER BY category_id'
    ).all();

    const categories = (result.results || []).map(row => ({
      name: getCategoryNameFromId(row.category_id || 'general'),
      slug: normalizeCategorySlug(row.category_id || 'general')
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

// SEO Phase 7: Serve category landing page
const serveCategoryPage = async (categorySlug, env) => {
  try {
    const canonicalHostname = 'https://usajobs.usajobs.workers.dev';
    
    // Get all active categories
    const categoriesResult = await env.DB.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active"'
    ).all();
    
    // Find matching category (case-insensitive)
    const categories = (categoriesResult.results || []);
    const matchedCategory = categories.find(row => {
      const slug = normalizeCategorySlug(row.category_id);
      return slug === categorySlug;
    });
    
    if (!matchedCategory) {
      return new Response('Category not found', { status: 404 });
    }
    
    const categoryId = matchedCategory.category_id || 'general';
    const categoryName = getCategoryNameFromId(categoryId);
    
    // Get jobs for this category
    const jobsResult = await env.DB.prepare(
      'SELECT id, title, description, category_id FROM offers WHERE status = "active" AND category_id = ? ORDER BY created_at DESC'
    ).bind(categoryId).all();
    
    const jobs = jobsResult.results || [];
    const jobCount = jobs.length;
    
    if (jobCount === 0) {
      // No active jobs - return 404
      return new Response('Category not found', { status: 404 });
    }
    
    // Generate job permalink (must match frontend)
    const generateJobPermalink = (job) => {
      if (!job || !job.id) return null;
      const slug = normalizeSlug(job.title || 'job');
      return `/jobs/${slug}-${job.id}`;
    };
    
    // Build job list HTML
    const jobListHtml = jobs.map(job => {
      const permalink = generateJobPermalink(job);
      const description = (job.description || '').substring(0, 150);
      return `
        <div class="category-job-card">
          <h3><a href="${permalink}">${escapeHtml(job.title)}</a></h3>
          <p>${escapeHtml(description)}${description.length >= 150 ? '...' : ''}</p>
        </div>
      `;
    }).join('');
    
    const title = `${categoryName} Jobs | USA Jobs`;
    const description = `Browse ${jobCount} ${categoryName} job${jobCount !== 1 ? 's' : ''} on USA Jobs. Find your next accounting and finance opportunity.`;
    const canonicalUrl = `${canonicalHostname}/jobs/category/${categorySlug}`;
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <meta property="og:site_name" content="USA Jobs">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonicalUrl}">
  
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  
  <script type="application/ld+json">
  ${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${categoryName} Jobs`,
    "description": description,
    "url": canonicalUrl,
    "isPartOf": {
      "@type": "WebSite",
      "name": "USA Jobs",
      "url": `${canonicalHostname}/`
    }
  })}
  </script>
  
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div id="app">
    <section class="category-landing">
      <nav class="breadcrumb">
        <a href="/">Home</a> &gt; <a href="/jobs/">Jobs</a> &gt; ${escapeHtml(categoryName)}
      </nav>
      
      <h1>${escapeHtml(categoryName)} Jobs</h1>
      <p class="category-intro">Explore ${jobCount} ${categoryName} job${jobCount !== 1 ? 's' : ''} in accounting and finance. Find opportunities that match your career goals.</p>
      
      <div class="category-jobs">
        ${jobListHtml}
      </div>
      
      <div class="category-footer">
        <a href="/jobs/" class="back-link">← View All Jobs</a>
      </div>
    </section>
  </div>
  <script src="/js/app.js"></script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('serveCategoryPage error:', error);
    return new Response('Error loading category page', { status: 500 });
  }
};

// HTML escape helper
const escapeHtml = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// SEO Phase 3: Generate dynamic sitemap.xml from current job data
const generateSitemap = async (env) => {
  try {
    const canonicalHostname = 'https://usajobs.usajobs.workers.dev';
    
    // Fetch current active jobs from D1
    const result = await env.DB.prepare(
      'SELECT id, title FROM offers WHERE status = ? ORDER BY created_at DESC'
    ).bind('active').all();
    
    const jobs = result.results || [];
    
    // Helper to normalize slug (must match frontend logic)
    const normalizeSlug = (title) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    };
    
    // Generate job permalink (must match frontend generateJobPermalink)
    const generateJobPermalink = (job) => {
      if (!job || !job.id) return null;
      const slug = normalizeSlug(job.title || 'job');
      return `${canonicalHostname}/jobs/${slug}-${job.id}`;
    };
    
    // Build sitemap XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Static URLs
    xml += '  <url>\n';
    xml += `    <loc>${canonicalHostname}/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>1.0</priority>\n';
    xml += '  </url>\n';
    
    xml += '  <url>\n';
    xml += `    <loc>${canonicalHostname}/jobs/</loc>\n`;
    xml += '    <changefreq>daily</changefreq>\n';
    xml += '    <priority>0.9</priority>\n';
    xml += '  </url>\n';
    
    // SEO Phase 7: Category landing pages
    const categoriesResult = await env.DB.prepare(
      'SELECT DISTINCT category_id FROM offers WHERE status = "active"'
    ).all();
    
    const categories = (categoriesResult.results || []);
    for (const catRow of categories) {
      if (catRow.category_id) {
        const categorySlug = normalizeCategorySlug(catRow.category_id);
        // Only include categories with active jobs
        const countResult = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM offers WHERE status = "active" AND category_id = ?'
        ).bind(catRow.category_id).first();
        
        if (countResult && countResult.count > 0) {
          xml += '  <url>\n';
          xml += `    <loc>${canonicalHostname}/jobs/category/${categorySlug}</loc>\n`;
          xml += '    <changefreq>weekly</changefreq>\n';
          xml += '    <priority>0.8</priority>\n';
          xml += '  </url>\n';
        }
      }
    }
    
    // Dynamic job URLs
    for (const job of jobs) {
      const url = generateJobPermalink(job);
      if (url) {
        xml += '  <url>\n';
        xml += `    <loc>${url}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      }
    }
    
    xml += '</urlset>';
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('generateSitemap error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
};

// SEO Phase 3: Serve robots.txt
const serveRobotsTxt = () => {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /jobs/

Sitemap: https://usajobs.usajobs.workers.dev/sitemap.xml
`;
  
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
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
    const hostname = url.hostname;
    
    // SEO Phase 4: Canonical hostname consolidation
    // Redirect alternate hostname to canonical
    const canonicalHostname = 'usajobs.usajobs.workers.dev';
    const alternateHostname = 'usajobs.workers.dev';
    
    if (hostname === alternateHostname) {
      // Construct canonical URL with preserved pathname and search
      const canonicalUrl = `https://${canonicalHostname}${url.pathname}${url.search}`;
      return new Response(null, {
        status: 301,
        headers: {
          'Location': canonicalUrl
        }
      });
    }
    
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

    // SEO Phase 3: Dynamic sitemap
    if (pathname === '/sitemap.xml') {
      return generateSitemap(env);
    }

    // SEO Phase 3: robots.txt
    if (pathname === '/robots.txt') {
      return serveRobotsTxt();
    }

    // SEO Phase 5: Job detail pages with lifecycle validation
    if (pathname.startsWith('/jobs/')) {
      // SEO Phase 7: Check for category landing page first
      if (pathname.startsWith('/jobs/category/')) {
        const categorySlug = pathname.slice(15); // '/jobs/category/' is 15 characters
        if (categorySlug) {
          return serveCategoryPage(categorySlug, env);
        }
      }
      // Regular job detail page
      return serveJobDetail(pathname, env);
    }

    // Static files
    return serveStatic(pathname);
  },

  async scheduled(event, env) {
    await importJobs(event, env);
  }
};
