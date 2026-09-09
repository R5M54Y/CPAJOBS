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
  <meta name="description" content="Find accounting and finance job opportunities. Browse high-paying CPA positions from top employers.">
  <meta name="theme-color" content="#0066cc">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="USA Jobs">
  <meta property="og:locale" content="en_US">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  
  <title>USA Jobs | Accounting & Finance Jobs</title>
  <link rel="canonical" href="https://usajobs.usajobs.workers.dev/">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%230066cc' width='100' height='100'/%3E%3Ctext x='50' y='65' font-size='60' font-weight='bold' fill='white' text-anchor='middle'%3EJ%3C/text%3E%3C/svg%3E">
  <base href="/">
</head>
<body>
  <header role="banner">
    <nav class="nav" role="navigation" aria-label="Main navigation">
      <a href="/" class="logo">USA Jobs</a>
      <div class="nav-links">
        <a href="/">Home</a>
        <a href="/" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse Jobs</a>
      </div>
    </nav>
  </header>

  <main id="app" role="main">
    <!-- Content will be loaded dynamically -->
  </main>

  <footer role="contentinfo">
    <p>&copy; 2026 USA Jobs. Discover accounting and finance opportunities.</p>
  </footer>

  <script src="/js/app.js"></script>
</body>
</html>
`;

const STYLE_CSS = `/* USA JOBS — REJOIN REFERENCE MATCH
   Complete visual redesign to match Rejoin job portal
   Reference: https://preview.sprukomarket.com/html/listing/rejoin/Rejoin/html/index.html
*/

:root {
  /* Rejoin Color System */
  --primary-blue: #3B5BDB;
  --primary-blue-dark: #2E5FBF;
  --dark-blue: #1E3A8A;
  --very-dark-blue: #0F172A;
  --accent-orange: #FF6B35;
  --accent-orange-dark: #E55A28;
  --accent-purple: #8B5CF6;
  
  /* Neutral Palette */
  --white: #FFFFFF;
  --light-gray-bg: #F7FAFC;
  --light-gray: #F0F0F0;
  --medium-gray: #718096;
  --medium-gray-light: #A0AEC0;
  --medium-gray-lighter: #CBD5E0;
  --border-gray: #E8EAED;
  --dark-gray: #2D3748;
  --charcoal: #1A202C;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 50%;
  
  /* Shadows */
  --shadow-subtle: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 10px 25px rgba(0, 0, 0, 0.1);
  
  /* Container */
  --container-max: 1200px;
  --container-padding: 40px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.6;
  color: var(--dark-gray);
  background: var(--white);
}

/* === HEADER & NAVIGATION === */

header {
  background: var(--dark-blue);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 12px var(--container-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: var(--white);
  text-decoration: none;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 32px;
  align-items: center;
}

.nav-links a {
  color: var(--white);
  text-decoration: none;
  font-size: 13px;
  font-weight: 400;
  transition: opacity 0.2s;
}

.nav-links a:hover {
  opacity: 0.8;
}

/* === MAIN CONTAINER === */

main {
  min-height: calc(100vh - 120px);
}

/* === HERO SECTION === */

.hero {
  background: linear-gradient(135deg, var(--dark-blue) 0%, var(--primary-blue) 100%);
  color: var(--white);
  padding: 60px var(--container-padding);
  text-align: center;
}

.hero-container {
  max-width: var(--container-max);
  margin: 0 auto;
}

.hero h1 {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
  line-height: 1.2;
}

.hero p {
  font-size: 16px;
  margin-bottom: 28px;
  opacity: 0.9;
}

.search-container {
  max-width: 500px;
  margin: 0 auto;
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: var(--font-family);
}

.search-input::placeholder {
  color: #999;
}

.search-btn {
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  padding: 12px 28px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  margin-left: 8px;
}

.search-btn:hover {
  background: var(--primary-blue-dark);
}

/* === CATEGORY SECTION === */

.section {
  padding: 60px var(--container-padding);
  max-width: var(--container-max);
  margin: 0 auto;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--dark-blue);
  text-align: center;
  margin-bottom: 12px;
}

.section-subtitle {
  font-size: 14px;
  color: var(--medium-gray);
  text-align: center;
  margin-bottom: 40px;
  line-height: 1.6;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
  margin-bottom: 36px;
}

.category-card {
  background: var(--white);
  border: 1px solid var(--border-gray);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
  transition: all 0.3s;
  box-shadow: var(--shadow-subtle);
  cursor: pointer;
}

.category-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--primary-blue);
}

.category-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  background: var(--light-gray-bg);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--primary-blue);
}

.category-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark-gray);
  margin-bottom: 8px;
}

.category-card p {
  font-size: 13px;
  color: var(--medium-gray);
  line-height: 1.5;
}

.view-more-btn {
  display: block;
  margin: 0 auto;
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.view-more-btn:hover {
  background: var(--primary-blue-dark);
}

/* === JOB LISTINGS === */

.jobs-section {
  background: var(--light-gray-bg);
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
}

.job-card {
  background: var(--white);
  border: 1px solid var(--border-gray);
  border-radius: var(--radius-lg);
  padding: 20px;
  transition: all 0.3s;
  box-shadow: var(--shadow-subtle);
}

.job-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-2px);
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.job-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark-blue);
  text-decoration: none;
  transition: color 0.2s;
  flex: 1;
}

.job-title:hover {
  color: var(--primary-blue);
}

.job-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--medium-gray);
}

.job-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.job-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.job-badge {
  display: inline-block;
  background: #DBEAFE;
  color: var(--primary-blue);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
}

.job-description {
  font-size: 13px;
  color: var(--medium-gray);
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-gray);
}

.job-salary {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-orange);
}

.apply-btn {
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.apply-btn:hover {
  background: var(--primary-blue-dark);
}

.apply-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* === PAGINATION === */

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-gray);
  background: var(--white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.pagination-btn:hover {
  border-color: var(--primary-blue);
  color: var(--primary-blue);
}

.pagination-btn.active {
  background: var(--primary-blue);
  color: var(--white);
  border-color: var(--primary-blue);
}

/* === JOB TYPE SECTION === */

.job-type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.job-type-card {
  background: var(--white);
  border: 2px solid var(--border-gray);
  border-radius: var(--radius-xl);
  padding: 28px;
  text-align: center;
  transition: all 0.3s;
  cursor: pointer;
}

.job-type-card:hover {
  border-color: var(--primary-blue);
  box-shadow: var(--shadow-sm);
}

.job-type-icon {
  width: 90px;
  height: 90px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-purple) 100%);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--white);
}

.job-type-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--dark-blue);
  margin-bottom: 8px;
}

.job-type-card p {
  font-size: 13px;
  color: var(--medium-gray);
  line-height: 1.5;
}

/* === FEATURED EMPLOYERS === */

.employers-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
}

.employer-card {
  background: var(--white);
  border: 1px solid var(--border-gray);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-subtle);
  transition: box-shadow 0.3s;
}

.employer-card:hover {
  box-shadow: var(--shadow-sm);
}

.employer-logo {
  width: 64px;
  height: 64px;
  background: var(--charcoal);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

.employer-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--dark-blue);
  margin-bottom: 4px;
}

.employer-jobs {
  font-size: 13px;
  color: var(--medium-gray);
}

/* === CTA SECTION === */

.cta-section {
  background: var(--white);
  padding: 60px var(--container-padding);
  text-align: center;
}

.cta-content {
  max-width: var(--container-max);
  margin: 0 auto;
}

.cta-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--dark-blue);
  margin-bottom: 16px;
}

.cta-text {
  font-size: 15px;
  color: var(--medium-gray);
  margin-bottom: 28px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.cta-btn {
  background: var(--primary-blue);
  color: var(--white);
  border: none;
  padding: 14px 36px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.cta-btn:hover {
  background: var(--primary-blue-dark);
}

/* === TESTIMONIAL SECTION === */

.testimonial-section {
  background: linear-gradient(135deg, var(--dark-blue) 0%, var(--accent-orange) 100%);
  color: var(--white);
  padding: 60px var(--container-padding);
  text-align: center;
}

.testimonial-content {
  max-width: var(--container-max);
  margin: 0 auto;
}

.testimonial-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 28px;
}

.testimonial-text {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.testimonial-avatars {
  display: flex;
  justify-content: center;
  gap: -8px;
  margin-bottom: 16px;
}

.testimonial-avatar {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  border: 3px solid var(--white);
  margin: 0 -8px;
  background: rgba(255, 255, 255, 0.3);
}

.testimonial-author {
  font-size: 14px;
  font-weight: 600;
}

.testimonial-position {
  font-size: 12px;
  opacity: 0.9;
}

/* === FOOTER === */

footer {
  background: var(--very-dark-blue);
  color: var(--medium-gray-lighter);
  padding: 60px var(--container-padding) 40px;
  font-size: 13px;
  line-height: 1.8;
}

.footer-content {
  max-width: var(--container-max);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-bottom: 40px;
}

.footer-section h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--white);
  margin-bottom: 16px;
}

.footer-section a {
  color: var(--medium-gray-lighter);
  text-decoration: none;
  display: block;
  transition: color 0.2s;
}

.footer-section a:hover {
  color: var(--white);
}

.footer-bottom {
  max-width: var(--container-max);
  margin: 0 auto;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--medium-gray);
}

/* === RESPONSIVE DESIGN === */

@media (max-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  
  .job-type-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .employers-grid {
    grid-template-columns: 1fr;
  }
  
  .section {
    padding: 48px 24px;
  }
}

@media (max-width: 768px) {
  :root {
    --container-padding: 20px;
  }
  
  .nav {
    padding: 12px 16px;
  }
  
  .logo {
    font-size: 20px;
  }
  
  .nav-links {
    gap: 16px;
    font-size: 12px;
  }
  
  .hero h1 {
    font-size: 32px;
  }
  
  .hero p {
    font-size: 14px;
  }
  
  .section-title {
    font-size: 28px;
  }
  
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .category-card {
    padding: 16px;
  }
  
  .category-icon {
    width: 44px;
    height: 44px;
  }
  
  .category-card h3 {
    font-size: 15px;
  }
  
  .jobs-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .job-type-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .job-type-card {
    padding: 20px;
  }
  
  .job-type-icon {
    width: 70px;
    height: 70px;
    font-size: 32px;
  }
  
  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .hero h1 {
    font-size: 24px;
  }
  
  .search-container {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-btn {
    width: 100%;
    margin-left: 0;
  }
  
  .category-grid {
    grid-template-columns: 1fr;
  }
  
  .job-type-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 16px;
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
    const jobCount = this.state.offers?.length || 0;
    
    if (this.state.loading) {
      return \`
        <section class="hero">
          <div class="hero-container">
            <h1>Find The Best Job For Your Future</h1>
            <p>It is a long established fact that a reader will be distracted by the readable.</p>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs">
              <button class="search-btn">Search</button>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">RECENT JOBS</h2>
          <p class="section-subtitle">Mauris ut cursus nunc. Morbi eleifend, ligula at consectetur vehicula</p>
          <div class="loading-message">Loading opportunities...</div>
        </section>
      \`;
    }

    if (this.state.error) {
      return \`
        <section class="hero">
          <div class="hero-container">
            <h1>Find The Best Job For Your Future</h1>
            <p>It is a long established fact that a reader will be distracted by the readable.</p>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs">
              <button class="search-btn">Search</button>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">RECENT JOBS</h2>
          <p class="section-subtitle">Mauris ut cursus nunc. Morbi eleifend, ligula at consectetur vehicula</p>
          <div class="error-message">Error loading jobs: \${this.state.error}</div>
        </section>
      \`;
    }

    if (jobCount === 0) {
      return \`
        <section class="homepage-hero">
          <div class="hero-container">
            <div class="hero-content">
              <h1 class="hero-title">Find Your Next Opportunity</h1>
              <p class="hero-subtitle">Discover accounting and finance jobs from top employers. Start your career journey today.</p>
              
              <div class="search-box">
                <form class="search-form" onsubmit="event.preventDefault(); app.navigate('/jobs/')">
                  <div class="search-input-wrapper">
                    <input type="text" class="search-input" placeholder="Job title or keyword" aria-label="Job title search">
                  </div>
                  <button type="submit" class="search-btn">Find Jobs</button>
                </form>
              </div>
            </div>
          </div>
        </section>
        
    if (jobCount === 0) {
      return \`
        <section class="hero">
          <div class="hero-container">
            <h1>Find The Best Job For Your Future</h1>
            <p>It is a long established fact that a reader will be distracted by the readable.</p>
            <div class="search-container">
              <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs">
              <button class="search-btn">Search</button>
            </div>
          </div>
        </section>
        
        <section class="section">
          <h2 class="section-title">RECENT JOBS</h2>
          <p class="section-subtitle">Mauris ut cursus nunc. Morbi eleifend, ligula at consectetur vehicula</p>
          <div class="no-results">No jobs available at the moment. Check back soon!</div>
        </section>
      \`;
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

    return \`
      <section class="hero">
        <div class="hero-container">
          <h1>Find The Best Job For Your Future</h1>
          <p>It is a long established fact that a reader will be distracted by the readable.</p>
          
          <div class="search-container">
            <input type="text" class="search-input" placeholder="Search Jobs" aria-label="Search jobs">
            <button class="search-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">Search</button>
          </div>
        </div>
      </section>
      
      <section class="section jobs-section">
        <h2 class="section-title">RECENT JOBS</h2>
        <p class="section-subtitle">Mauris ut cursus nunc. Morbi eleifend, ligula at consectetur vehicula</p>
        
        <div class="jobs-grid">
          \${this.state.offers.slice(0, 10).map(offer => this.renderJobCard(offer)).join('')}
        </div>
        
        \${jobCount > 10 ? \`<button class="view-more-btn" onclick="app.navigate('/jobs/')">View More Jobs</button>\` : ''}
      </section>
      
      <section class="cta-section">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Find Your Dream Job?</h2>
          <p class="cta-text">Browse all \${jobCount} opportunities and take the next step in your career</p>
          <button class="cta-btn" onclick="app.navigate('/jobs/')">View All Jobs</button>
        </div>
      </section>
    \`;
  }

  renderJobCard(offer) {
    const permalink = this.generateJobPermalink(offer);
    const location = offer.location || [offer.location_city, offer.location_state, offer.location_country].filter(Boolean).join(', ') || 'Location not specified';
    const salary = offer.salary_min || offer.salary_max ? \`\$\${offer.salary_min || offer.salary_max}\${offer.salary_period ? '/' + offer.salary_period : ''}\` : null;
    const applyUrl = offer.apply_url;
    
    return \`
      <div class="job-card">
        <div class="job-card-header">
          <a href="\${permalink}" class="job-title" onclick="event.preventDefault(); app.navigate('\${permalink}')">\${offer.title}</a>
        </div>
        
        <div class="job-meta">
          <div class="job-meta-item">📍 \${location}</div>
          \${offer.employment_type ? \`<div class="job-meta-item">📋 \${offer.employment_type}</div>\` : ''}
          \${offer.remote ? \`<div class="job-meta-item">🌍 Remote</div>\` : ''}
        </div>
        
        <div class="job-badges">
          \${offer.category ? \`<span class="job-badge">\${offer.category.name || 'Job'}</span>\` : ''}
          \${offer.remote ? \`<span class="job-badge">Remote</span>\` : ''}
        </div>
        
        \${offer.description ? \`<p class="job-description">\${offer.description.substring(0, 100)}\${offer.description.length > 100 ? '...' : ''}</p>\` : ''}
        
        <div class="job-footer">
          \${salary ? \`<span class="job-salary">\${salary}</span>\` : '<span></span>'}
          \${applyUrl ? \`<a href="\${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn" onclick="event.stopPropagation(); app.handleOfferClick('\${offer.id}')">Apply Now</a>\` : '<button class="apply-btn" disabled>Apply</button>'}
        </div>
      </div>
    \`;
  }

  renderCategories() {
    const filteredOffers = this.state.selectedCategory
      ? this.state.offers.filter(offer => offer.category?.slug === this.state.selectedCategory)
      : this.state.offers;

    const resultCount = filteredOffers.length;
    const categoryName = this.state.selectedCategory 
      ? this.state.categories.find(c => c.slug === this.state.selectedCategory)?.name || 'Category'
      : 'All';

    return \`
      <div class="categories-container">
        <h2>\${categoryName} Jobs \${resultCount > 0 ? \`(\${resultCount})\` : ''}</h2>
        <div class="category-filters">
          <button class="category-filter \${!this.state.selectedCategory ? 'active' : ''}" onclick="app.setSelectedCategory(null)">
            All Jobs
          </button>
          \${this.state.categories.map(cat => \`
            <button class="category-filter \${this.state.selectedCategory === cat.slug ? 'active' : ''}" onclick="app.setSelectedCategory('\${cat.slug}')">
              \${cat.name}
            </button>
          \`).join('')}
        </div>

        \${resultCount > 0 ? \`
        <div class="offer-grid">
          \${filteredOffers.map(offer => this.renderOfferCard(offer)).join('')}
        </div>
        \` : \`
        <div class="no-results">
          <p>No jobs available in this category.</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">Try selecting a different category.</p>
        </div>
        \`}
      </div>
    \`;
  }

  renderOfferDetail() {
    if (!this.state.selectedOffer) {
      return \`
        <div class="job-detail-page">
          <div class="job-detail-container">
            <div class="job-not-found">
              <h1>Job Not Found</h1>
              <p>The job you're looking for is no longer available.</p>
              <a href="/" class="back-link" onclick="event.preventDefault(); app.navigate('/')">← Back to Jobs</a>
            </div>
          </div>
        </div>
      \`;
    }

    const job = this.state.selectedOffer;
    const applyUrl = job.apply_url;
    const location = job.location || [job.location_city, job.location_state, job.location_country].filter(Boolean).join(', ');
    const hasDescription = job.description && job.description.trim().length > 0;
    const hasResponsibilities = job.responsibilities && job.responsibilities.trim().length > 0;
    const hasRequirements = job.qualifications || job.requirements;
    const hasBenefits = job.benefits && (Array.isArray(job.benefits) ? job.benefits.length > 0 : true);
    
    return \`
      <div class="job-detail-page">
        <div class="job-detail-container">
          
          <!-- Breadcrumb -->
          <div class="job-breadcrumb">
            <a href="/" onclick="event.preventDefault(); app.navigate('/')">Jobs</a>
            \${job.category ? \`<span>/</span><span>\${job.category.name}</span>\` : ''}
            <span>/</span><span>\${job.title}</span>
          </div>

          <!-- Job Header -->
          <div class="job-header">
            <div class="job-header-main">
              <div class="job-header-content">
                <h1 class="job-title">\${job.title}</h1>
                <div class="job-company-info">
                  <span class="job-company">\${job.company || 'Company'}</span>
                  \${location ? \`<span class="job-location">📍 \${location}</span>\` : ''}
                </div>
              </div>
            </div>
            
            <div class="job-header-meta">
              \${job.employment_type ? \`<span class="job-meta-badge">📋 \${job.employment_type}</span>\` : ''}
              \${job.remote ? \`<span class="job-meta-badge remote">🌍 Remote</span>\` : ''}
              \${job.category ? \`<span class="job-meta-badge category">\${job.category.name}</span>\` : ''}
            </div>
          </div>

          <!-- Main Content Layout -->
          <div class="job-content-grid">
            
            <!-- Main Content -->
            <main class="job-main-content">
              \${hasDescription ? \`
              <section class="job-section">
                <h2>Job Description</h2>
                <div class="job-description-text">
                  \${job.description}
                </div>
              </section>
              \` : ''}

              \${hasResponsibilities ? \`
              <section class="job-section">
                <h2>Responsibilities</h2>
                <div class="job-description-text">
                  \${job.responsibilities}
                </div>
              </section>
              \` : ''}

              \${hasRequirements ? \`
              <section class="job-section">
                <h2>Requirements</h2>
                <div class="job-description-text">
                  \${job.qualifications || job.requirements}
                </div>
              </section>
              \` : ''}

              \${hasBenefits ? \`
              <section class="job-section">
                <h2>Benefits</h2>
                <div class="job-description-text">
                  \${Array.isArray(job.benefits) ? '<ul>' + job.benefits.map(b => \`<li>\${b}</li>\`).join('') + '</ul>' : job.benefits}
                </div>
              </section>
              \` : ''}
            </main>

            <!-- Sidebar -->
            <aside class="job-sidebar">
              
              <!-- Quick Info Card -->
              <div class="sidebar-card">
                <h3 class="sidebar-card-title">Job Details</h3>
                <div class="sidebar-info-group">
                  \${job.employment_type ? \`
                  <div class="sidebar-info-item">
                    <span class="sidebar-label">Employment Type</span>
                    <span class="sidebar-value">\${job.employment_type}</span>
                  </div>
                  \` : ''}
                  
                  \${location ? \`
                  <div class="sidebar-info-item">
                    <span class="sidebar-label">Location</span>
                    <span class="sidebar-value">\${location}</span>
                  </div>
                  \` : ''}
                  
                  \${job.remote !== undefined ? \`
                  <div class="sidebar-info-item">
                    <span class="sidebar-label">Remote</span>
                    <span class="sidebar-value">\${job.remote ? '✓ Yes' : 'On-site'}</span>
                  </div>
                  \` : ''}
                  
                  \${job.category ? \`
                  <div class="sidebar-info-item">
                    <span class="sidebar-label">Category</span>
                    <span class="sidebar-value">\${job.category.name}</span>
                  </div>
                  \` : ''}
                </div>
              </div>

              <!-- Apply Card -->
              <div class="sidebar-card apply-card">
                \${applyUrl ? \`
                <a href="\${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-button" onclick="app.handleOfferClick('\${job.id}')">
                  Apply for this Position
                </a>
                \` : \`
                <button class="apply-button" disabled style="opacity: 0.5; cursor: not-allowed;">
                  Application Link Not Available
                </button>
                \`}
                <p class="apply-note">You will be redirected to the application page.</p>
              </div>

              <!-- Share Card -->
              <div class="sidebar-card">
                <h3 class="sidebar-card-title">Share</h3>
                <div class="share-buttons">
                  <button class="share-btn" title="Share on LinkedIn" onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href), '_blank')">LinkedIn</button>
                  <button class="share-btn" title="Share on Twitter" onclick="window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(window.location.href), '_blank')">Twitter</button>
                </div>
              </div>

            </aside>

          </div>

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
    const location = offer.location || [offer.location_city, offer.location_state, offer.location_country].filter(Boolean).join(', ') || 'Location not specified';
    const salary = offer.salary_min || offer.salary_max ? \`\$\${offer.salary_min || offer.salary_max}\${offer.salary_period ? '/' + offer.salary_period : ''}\` : null;
    const applyUrl = offer.apply_url;
    
    return \`
      <div class="job-card">
        <div class="job-card-header">
          <a href="\${permalink}" class="job-title" onclick="event.preventDefault(); app.navigate('\${permalink}')">\${offer.title}</a>
        </div>
        
        <div class="job-meta">
          <div class="job-meta-item">📍 \${location}</div>
          \${offer.employment_type ? \`<div class="job-meta-item">📋 \${offer.employment_type}</div>\` : ''}
          \${offer.remote ? \`<div class="job-meta-item">🌍 Remote</div>\` : ''}
        </div>
        
        <div class="job-badges">
          \${offer.category ? \`<span class="job-badge">\${offer.category.name || 'Job'}</span>\` : ''}
          \${offer.remote ? \`<span class="job-badge">Remote</span>\` : ''}
        </div>
        
        \${offer.description ? \`<p class="job-description">\${offer.description.substring(0, 100)}\${offer.description.length > 100 ? '...' : ''}</p>\` : ''}
        
        <div class="job-footer">
          \${salary ? \`<span class="job-salary">\${salary}</span>\` : '<span></span>'}
          \${applyUrl ? \`<a href="\${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn" onclick="event.stopPropagation(); app.handleOfferClick('\${offer.id}')">Apply Now</a>\` : '<button class="apply-btn" disabled>Apply</button>'}
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

// Helper to normalize slug (must match frontend logic)
const normalizeSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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
