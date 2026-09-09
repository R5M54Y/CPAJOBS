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

const STYLE_CSS = `/* USA JOBS - REDESIGNED HOMEPAGE
   Modern Job Marketplace Design System
   Reference: Professional job board composition patterns */

:root {
  /* Brand Colors */
  --brand-primary: #0066cc;
  --brand-primary-dark: #0052a3;
  --brand-primary-light: #e6f0ff;
  --brand-accent: #10b981;
  --brand-accent-dark: #059669;
  
  /* Neutral Palette */
  --neutral-50: #fafbfc;
  --neutral-100: #f3f4f6;
  --neutral-200: #e5e7eb;
  --neutral-300: #d1d5db;
  --neutral-400: #9ca3af;
  --neutral-500: #6b7280;
  --neutral-600: #4b5563;
  --neutral-700: #374151;
  --neutral-800: #1f2937;
  --neutral-900: #111827;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Typography Scale */
  --font-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  --text-6xl: 3.75rem;
  
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
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Container Widths */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1400px;
}

/* === Base Reset === */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-base);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--neutral-800);
  background: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

/* === Header === */

header {
  background: white;
  border-bottom: 1px solid var(--neutral-200);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.nav {
  max-width: var(--container-2xl);
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--brand-primary);
  text-decoration: none;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.nav-links a {
  padding: var(--space-2) var(--space-4);
  color: var(--neutral-700);
  text-decoration: none;
  font-weight: 500;
  font-size: var(--text-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.nav-links a:hover {
  color: var(--brand-primary);
  background: var(--brand-primary-light);
}

/* === Hero Section === */

.homepage-hero {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  padding: var(--space-24) var(--space-6);
  position: relative;
  overflow: hidden;
}

.homepage-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 102, 204, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.hero-container {
  max-width: var(--container-xl);
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.hero-title {
  font-size: var(--text-5xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--neutral-600);
  margin-bottom: var(--space-10);
  line-height: 1.6;
}

/* === Search Box === */

.search-box {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
  max-width: 700px;
  margin: 0 auto var(--space-8);
}

.search-form {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.search-input-wrapper {
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: var(--space-4);
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  color: var(--neutral-900);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.search-input::placeholder {
  color: var(--neutral-400);
}

.search-btn {
  padding: var(--space-4) var(--space-8);
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.search-btn:hover {
  background: var(--brand-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

/* === Quick Categories === */

.quick-categories {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--space-8);
}

.quick-category {
  padding: var(--space-2) var(--space-4);
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  color: var(--neutral-700);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all 0.2s;
}

.quick-category:hover {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  background: var(--brand-primary-light);
  transform: translateY(-1px);
}

/* === Section Common === */

.section {
  padding: var(--space-20) var(--space-6);
}

.section-container {
  max-width: var(--container-2xl);
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-4);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  max-width: 600px;
  margin: 0 auto;
}

/* === Browse Categories Section === */

.browse-categories {
  background: var(--neutral-50);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-6);
}

.category-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--brand-primary);
  transform: scaleY(0);
  transition: transform 0.2s;
}

.category-card:hover {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.category-card:hover::before {
  transform: scaleY(1);
}

.category-icon {
  width: 48px;
  height: 48px;
  background: var(--brand-primary-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-4);
  font-size: var(--text-2xl);
}

.category-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: var(--space-2);
}

.category-count {
  font-size: var(--text-sm);
  color: var(--neutral-500);
}

/* === Featured Jobs Section === */

.featured-jobs {
  background: white;
}

.jobs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-6);
}

.job-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.job-card:hover {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.job-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-4);
}

.job-company {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--brand-primary);
  margin-bottom: var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.job-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-3);
  line-height: 1.3;
}

.job-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--neutral-200);
  border-bottom: 1px solid var(--neutral-200);
}

.job-meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--neutral-600);
}

.job-badges {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.job-badge {
  padding: var(--space-1) var(--space-3);
  background: var(--neutral-100);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.job-badge.remote {
  background: #d1fae5;
  color: #065f46;
}

.job-badge.featured {
  background: var(--brand-primary-light);
  color: var(--brand-primary-dark);
}

.job-description {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.job-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.job-salary {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--brand-accent);
}

.job-posted {
  font-size: var(--text-xs);
  color: var(--neutral-500);
}

/* === CTA Section === */

.cta-section {
  background: linear-gradient(135deg, var(--brand-primary) 0%, #0052a3 100%);
  color: white;
  text-align: center;
}

.cta-title {
  font-size: var(--text-4xl);
  font-weight: 700;
  margin-bottom: var(--space-6);
  color: white;
}

.cta-text {
  font-size: var(--text-lg);
  margin-bottom: var(--space-8);
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-btn {
  display: inline-block;
  padding: var(--space-4) var(--space-8);
  background: white;
  color: var(--brand-primary);
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

/* === Footer === */

footer {
  background: var(--neutral-900);
  color: var(--neutral-300);
  padding: var(--space-12) var(--space-6);
  margin-top: auto;
}

.footer-container {
  max-width: var(--container-2xl);
  margin: 0 auto;
  text-align: center;
}

footer p {
  margin: 0;
  font-size: var(--text-sm);
}

/* === Loading & Error States === */

.loading-message,
.error-message,
.no-results {
  padding: var(--space-12);
  text-align: center;
  border-radius: var(--radius-lg);
}

.loading-message {
  animation: pulse 2s infinite;
  color: var(--neutral-600);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-message {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  font-weight: 600;
}

.no-results {
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  color: var(--neutral-600);
}

/* === Responsive Design === */

@media (max-width: 1024px) {
  .hero-title {
    font-size: var(--text-4xl);
  }
  
  .jobs-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .nav {
    padding: var(--space-3) var(--space-4);
  }
  
  .logo {
    font-size: var(--text-xl);
  }
  
  .nav-links a {
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-3);
  }
  
  .homepage-hero {
    padding: var(--space-16) var(--space-4);
  }
  
  .hero-title {
    font-size: var(--text-3xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-lg);
  }
  
  .search-box {
    padding: var(--space-4);
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-input-wrapper {
    min-width: 100%;
  }
  
  .search-btn {
    width: 100%;
  }
  
  .section {
    padding: var(--space-16) var(--space-4);
  }
  
  .section-title {
    font-size: var(--text-3xl);
  }
  
  .categories-grid,
  .jobs-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-title {
    font-size: var(--text-3xl);
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: var(--text-2xl);
  }
  
  .hero-subtitle {
    font-size: var(--text-base);
  }
  
  .section-title {
    font-size: var(--text-2xl);
  }
  
  .job-title {
    font-size: var(--text-lg);
  }
}

/* === Accessibility === */

:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* === JOB DETAIL PAGE === */

.job-detail-page {
  background: var(--neutral-50);
  min-height: 100vh;
  padding: var(--space-12) var(--space-6);
}

.job-detail-container {
  max-width: var(--container-xl);
  margin: 0 auto;
}

.job-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
  font-size: var(--text-sm);
  color: var(--neutral-600);
}

.job-breadcrumb a {
  color: var(--brand-primary);
  text-decoration: none;
  font-weight: 500;
}

.job-breadcrumb a:hover {
  text-decoration: underline;
}

.job-breadcrumb span {
  color: var(--neutral-400);
}

/* Job Header */

.job-header {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  margin-bottom: var(--space-12);
  box-shadow: var(--shadow-sm);
}

.job-header-main {
  margin-bottom: var(--space-6);
}

.job-header-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.job-title {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
  line-height: 1.2;
}

.job-company-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.job-company {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--brand-primary);
}

.job-location {
  font-size: var(--text-base);
  color: var(--neutral-600);
}

.job-header-meta {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  padding-top: var(--space-6);
  border-top: 1px solid var(--neutral-200);
}

.job-meta-badge {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  background: var(--neutral-100);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--neutral-700);
}

.job-meta-badge.remote {
  background: #d1fae5;
  color: #065f46;
}

.job-meta-badge.category {
  background: var(--brand-primary-light);
  color: var(--brand-primary-dark);
}

/* Content Grid */

.job-content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-10);
}

.job-main-content {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-10);
  box-shadow: var(--shadow-sm);
}

.job-section {
  margin-bottom: var(--space-10);
  padding-bottom: var(--space-10);
  border-bottom: 1px solid var(--neutral-200);
}

.job-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.job-section h2 {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--brand-primary);
  display: inline-block;
}

.job-description-text {
  font-size: var(--text-base);
  line-height: 1.8;
  color: var(--neutral-700);
  word-break: break-word;
  overflow-wrap: break-word;
}

.job-description-text ul,
.job-description-text ol {
  margin-left: var(--space-6);
  margin-top: var(--space-4);
  margin-bottom: var(--space-4);
}

.job-description-text li {
  margin-bottom: var(--space-3);
}

.job-description-text p {
  margin-bottom: var(--space-4);
}

/* Sidebar */

.job-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  height: fit-content;
  position: sticky;
  top: var(--space-8);
}

.sidebar-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.sidebar-card-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 var(--space-4) 0;
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--brand-primary);
}

.sidebar-info-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sidebar-info-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar-label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--neutral-500);
}

.sidebar-value {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--neutral-900);
}

/* Apply Card */

.apply-card {
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%);
  color: white;
}

.apply-card .sidebar-card-title {
  display: none;
}

.apply-button {
  display: block;
  width: 100%;
  padding: var(--space-4) var(--space-6);
  background: white;
  color: var(--brand-primary);
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: var(--space-3);
}

.apply-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.apply-note {
  font-size: var(--text-xs);
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin: 0;
}

/* Share Buttons */

.share-buttons {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.share-btn {
  flex: 1;
  min-width: 80px;
  padding: var(--space-2) var(--space-3);
  background: var(--neutral-100);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--neutral-700);
  cursor: pointer;
  transition: all 0.2s;
}

.share-btn:hover {
  background: var(--brand-primary-light);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

/* Not Found State */

.job-not-found {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-16);
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.job-not-found h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-4);
}

.job-not-found p {
  font-size: var(--text-lg);
  color: var(--neutral-600);
  margin-bottom: var(--space-8);
}

.back-link {
  display: inline-block;
  padding: var(--space-3) var(--space-6);
  background: var(--brand-primary);
  color: white;
  border-radius: var(--radius-lg);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.back-link:hover {
  background: var(--brand-primary-dark);
  transform: translateY(-2px);
}

/* Responsive Job Detail */

@media (max-width: 1024px) {
  .job-content-grid {
    grid-template-columns: 1.5fr 1fr;
    gap: var(--space-8);
  }
  
  .job-title {
    font-size: var(--text-3xl);
  }
}

@media (max-width: 768px) {
  .job-detail-page {
    padding: var(--space-6) var(--space-4);
  }

  .job-detail-container {
    max-width: 100%;
  }

  .job-content-grid {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .job-sidebar {
    position: static;
    top: auto;
  }

  .job-header {
    padding: var(--space-6);
  }

  .job-title {
    font-size: var(--text-2xl);
  }

  .job-main-content {
    padding: var(--space-6);
  }

  .job-header-meta {
    flex-direction: column;
    gap: var(--space-2);
  }

  .sidebar-card {
    padding: var(--space-5);
  }

  .apply-button {
    padding: var(--space-3) var(--space-4);
  }
}

@media (max-width: 480px) {
  .job-detail-page {
    padding: var(--space-4) var(--space-3);
  }

  .job-header {
    padding: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .job-title {
    font-size: var(--text-xl);
  }

  .job-company {
    font-size: var(--text-base);
  }

  .job-section h2 {
    font-size: var(--text-lg);
  }

  .sidebar-card {
    padding: var(--space-4);
  }

  .share-buttons {
    gap: var(--space-1);
  }

  .share-btn {
    min-width: 70px;
    font-size: var(--text-xs);
    padding: var(--space-2) var(--space-2);
  }
} */

.offer-detail,
.offer-detail-card,
.categories-container,
.back-btn,
.apply-btn,
.category-filter,
.meta-item,
.salary-section,
.description-section,
.job-details,
.skills-section,
.skill-badge {
  /* Preserve existing job detail styles */
}

.offer-detail {
  max-width: var(--container-lg);
  margin: 0 auto;
  padding: var(--space-6);
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--brand-primary);
  background: transparent;
  border: none;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: var(--space-6);
}

.back-btn:hover {
  background: var(--brand-primary-light);
}

.offer-detail-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-md);
}

.offer-detail-card h1 {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-6);
}

.offer-detail-card h3 {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--neutral-900);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--brand-primary);
}

.job-header-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-8);
  border-bottom: 1px solid var(--neutral-200);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.meta-item strong {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--neutral-600);
}

.apply-btn {
  display: inline-block;
  padding: var(--space-4) var(--space-8);
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-size: var(--text-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  margin-top: var(--space-8);
}

.apply-btn:hover {
  background: var(--brand-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.categories-container {
  max-width: var(--container-2xl);
  margin: var(--space-12) auto;
  padding: 0 var(--space-6);
}

.category-filters {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-12);
}

.category-filter {
  padding: var(--space-2) var(--space-4);
  background: white;
  border: 2px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.category-filter:hover {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.category-filter.active {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: white;
}

.salary-section {
  background: var(--brand-primary-light);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-8);
  border-left: 4px solid var(--brand-primary);
}

.salary-display {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--brand-primary);
}

.description-section,
.job-details,
.skills-section {
  margin-bottom: var(--space-8);
}

.skill-badge {
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  background: #f0f9ff;
  color: #0369a1;
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 500;
  margin-right: var(--space-2);
  margin-bottom: var(--space-2);
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
        
        <section class="section featured-jobs">
          <div class="section-container">
            <div class="section-header">
              <h2 class="section-title">Featured Opportunities</h2>
            </div>
            <div class="loading-message">Loading opportunities...</div>
          </div>
        </section>
      \`;
    }

    if (this.state.error) {
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
        
        <section class="section featured-jobs">
          <div class="section-container">
            <div class="section-header">
              <h2 class="section-title">Featured Opportunities</h2>
            </div>
            <div class="error-message">Error loading jobs: \${this.state.error}</div>
          </div>
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
        
        <section class="section featured-jobs">
          <div class="section-container">
            <div class="section-header">
              <h2 class="section-title">Featured Opportunities</h2>
            </div>
            <div class="no-results">No jobs available at the moment. Check back soon!</div>
          </div>
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
            
            \${categories.length > 0 ? \`
            <div class="quick-categories">
              \${categories.map(cat => \`
                <a href="/jobs/category/\${cat.slug}" class="quick-category" onclick="event.preventDefault(); app.navigate('/jobs/category/\${cat.slug}')">\${cat.name}</a>
              \`).join('')}
            </div>
            \` : ''}
          </div>
        </div>
      </section>
      
      <section class="section featured-jobs">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Featured Opportunities</h2>
            <p class="section-subtitle">Browse \${jobCount} open \${jobCount === 1 ? 'position' : 'positions'} from leading companies</p>
          </div>
          
          <div class="jobs-grid">
            \${this.state.offers.slice(0, 6).map(offer => this.renderJobCard(offer)).join('')}
          </div>
        </div>
      </section>
      
      <section class="section cta-section">
        <div class="section-container">
          <h2 class="cta-title">Ready to Find Your Dream Job?</h2>
          <p class="cta-text">Browse all \${jobCount} opportunities and take the next step in your career</p>
          <a href="/jobs/" class="cta-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">View All Jobs</a>
        </div>
      </section>
    \`;
  }

  renderJobCard(offer) {
    const permalink = this.generateJobPermalink(offer);
    const location = offer.location || [offer.location_city, offer.location_state, offer.location_country].filter(Boolean).join(', ') || 'Location not specified';
    const salary = offer.salary_min || offer.salary_max ? \`\$\${offer.salary_min || offer.salary_max}\${offer.salary_period ? '/' + offer.salary_period : ''}\` : null;
    
    return \`
      <a href="\${permalink}" class="job-card" onclick="event.preventDefault(); app.navigate('\${permalink}')">
        <div class="job-card-header">
          <div>
            <span class="job-company">\${offer.company || 'Company'}</span>
            <h3 class="job-title">\${offer.title}</h3>
          </div>
        </div>
        
        <div class="job-meta">
          <span class="job-meta-item">📍 \${location}</span>
          \${offer.employment_type ? \`<span class="job-meta-item">📋 \${offer.employment_type}</span>\` : ''}
          \${offer.remote ? \`<span class="job-meta-item">🌍 Remote</span>\` : ''}
        </div>
        
        <div class="job-badges">
          \${offer.category ? \`<span class="job-badge">\${offer.category.name || 'Job'}</span>\` : ''}
          \${offer.remote ? \`<span class="job-badge remote">✓ Remote</span>\` : ''}
        </div>
        
        \${offer.description ? \`<p class="job-description">\${offer.description.substring(0, 120)}\${offer.description.length > 120 ? '...' : ''}</p>\` : ''}
        
        <div class="job-footer">
          \${salary ? \`<span class="job-salary">\${salary}</span>\` : '<span></span>'}
          <span class="job-posted">View details →</span>
        </div>
      </a>
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
    const hasDescription = offer.description && offer.description.trim().length > 0;
    
    return \`
      <div class="offer-card">
        <a href="\${permalink}" class="offer-card-link" onclick="event.preventDefault(); app.navigate('\${permalink}')">
          <h3>\${offer.title}</h3>
          <div class="offer-meta">
            <span class="category">\${offer.category?.name || offer.category_id?.replace('cat-', '').toUpperCase() || 'General'}</span>
            \${offer.employment_type ? \`<span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; background: #f0f0f0; font-size: 0.8rem;">\${offer.employment_type}</span>\` : ''}
          </div>
          \${hasDescription ? \`<p>\${offer.description.substring(0, 120)}...</p>\` : ''}
          <div class="offer-footer">
            <span style="font-size: 0.8rem; color: #666;">\${location}</span>
            \${offer.remote ? '<span style="font-size: 0.8rem; color: #059669;">✓ Remote</span>' : ''}
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
