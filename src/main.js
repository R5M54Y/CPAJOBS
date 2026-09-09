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

const STYLE_CSS = `/* USA JOBS - Modern UI/UX Design System
   Professional, clean, premium job platform
   Content > Clarity > Usability > Polish */

:root {
  /* Color System */
  --primary: #0066cc;
  --primary-dark: #0052a3;
  --primary-light: #e6f0ff;
  
  --success: #059669;
  --warning: #d97706;
  --error: #dc2626;
  --error-light: #fee2e2;
  
  --neutral-950: #0f172a;
  --neutral-900: #1e293b;
  --neutral-800: #334155;
  --neutral-700: #475569;
  --neutral-600: #64748b;
  --neutral-500: #78909c;
  --neutral-400: #cbd5e1;
  --neutral-300: #e2e8f0;
  --neutral-200: #f1f5f9;
  --neutral-100: #f8fafc;
  --neutral-50: #fafbfc;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: 'Monaco', 'Menlo', 'Consolas', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;
  
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
  
  /* Spacing */
  --space-0: 0;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
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
  --radius-2xl: 1.5rem;
  
  /* Shadows */
  --shadow-none: none;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-index */
  --z-dropdown: 100;
  --z-sticky: 20;
  --z-fixed: 50;
  --z-modal: 1000;
}

/* === Reset & Base Styles === */

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--neutral-900);
  background: var(--neutral-50);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

main {
  flex: 1;
  width: 100%;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-4);
}

h1 {
  font-size: var(--font-size-4xl);
}

h2 {
  font-size: var(--font-size-3xl);
}

h3 {
  font-size: var(--font-size-2xl);
}

h4 {
  font-size: var(--font-size-xl);
}

h5, h6 {
  font-size: var(--font-size-lg);
}

p {
  margin-bottom: var(--space-4);
  color: var(--neutral-700);
}

a {
  color: var(--primary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--primary-dark);
}

/* === Header & Navigation === */

header {
  background: white;
  border-bottom: 1px solid var(--neutral-200);
  padding: var(--space-4) var(--space-6);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  box-shadow: var(--shadow-sm);
}

.nav {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-6);
}

.logo {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--primary);
  text-decoration: none;
  flex-shrink: 0;
  letter-spacing: -0.5px;
  transition: color var(--transition-fast);
}

.logo:hover {
  color: var(--primary-dark);
}

.nav-links {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.nav-links a {
  color: var(--neutral-700);
  text-decoration: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.nav-links a:hover {
  color: var(--primary);
  background: var(--primary-light);
}

/* === Hero Section === */

.hero {
  background: linear-gradient(135deg, var(--neutral-50) 0%, var(--primary-light) 100%);
  padding: var(--space-16) var(--space-6);
  text-align: center;
  border-bottom: 1px solid var(--neutral-200);
}

.hero h1 {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-4);
  color: var(--neutral-900);
  font-weight: var(--font-weight-bold);
  letter-spacing: -1px;
}

.hero p {
  font-size: var(--font-size-lg);
  color: var(--neutral-700);
  margin-bottom: var(--space-8);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-btn {
  display: inline-block;
  background: var(--primary);
  color: white;
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
  text-decoration: none;
  border: 2px solid var(--primary);
  cursor: pointer;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.cta-btn:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* === Job Listing Container === */

.offer-list {
  max-width: 1400px;
  margin: var(--space-12) auto;
  padding: 0 var(--space-6);
  width: 100%;
}

.offer-list h2 {
  font-size: var(--font-size-3xl);
  margin-bottom: var(--space-8);
  color: var(--neutral-900);
}

/* === Job Cards === */

.offer-card {
  background: white;
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--transition-base);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.offer-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--transition-fast);
}

.offer-card:hover {
  border-color: var(--primary);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.offer-card:hover::before {
  transform: scaleX(1);
}

.offer-card-link {
  text-decoration: none;
  color: inherit;
  display: contents;
}

.offer-card h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--neutral-900);
  margin-bottom: var(--space-3);
  line-height: var(--line-height-tight);
  word-break: break-word;
}

.offer-meta {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
  align-items: center;
}

.category {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status.active {
  background: #d1fae5;
  color: #065f46;
}

.status.draft {
  background: var(--neutral-200);
  color: var(--neutral-700);
}

.offer-card p {
  color: var(--neutral-600);
  font-size: var(--font-size-sm);
  margin: 0;
  flex: 1;
  line-height: var(--line-height-normal);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--space-4);
}

.offer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-4);
  border-top: 1px solid var(--neutral-200);
  gap: var(--space-4);
  flex-wrap: wrap;
  font-size: var(--font-size-xs);
  color: var(--neutral-700);
}

.payout {
  font-weight: var(--font-weight-bold);
  color: var(--primary);
  font-size: var(--font-size-base);
}

/* Grid Layout */
.offer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);
  width: 100%;
}

/* === Job Detail Page === */

.offer-detail {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--space-6);
  width: 100%;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--primary);
  background: transparent;
  border: none;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-6);
  min-height: 44px;
}

.back-btn:hover {
  background: var(--primary-light);
  transform: translateX(-2px);
}

.offer-detail-card {
  background: white;
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--neutral-200);
}

.offer-detail-card h1 {
  font-size: var(--font-size-4xl);
  margin-bottom: var(--space-6);
  color: var(--neutral-900);
  word-break: break-word;
  line-height: var(--line-height-tight);
}

.offer-detail-card h3 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--primary);
  color: var(--neutral-900);
}

.job-header-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--neutral-600);
}

.meta-item > span:not(strong) {
  font-size: var(--font-size-base);
  color: var(--neutral-900);
  font-weight: var(--font-weight-medium);
}

.salary-section {
  background: linear-gradient(135deg, var(--primary-light) 0%, rgba(0, 102, 204, 0.05) 100%);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-8);
  border-left: 4px solid var(--primary);
}

.salary-section h3 {
  border: none;
  padding: 0;
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-size-lg);
}

.salary-display {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--primary);
}

.description-section,
.job-details,
.skills-section {
  margin-bottom: var(--space-8);
}

.description-content,
.detail-content {
  line-height: var(--line-height-relaxed);
  color: var(--neutral-700);
}

.description-content p,
.detail-content p {
  margin-bottom: var(--space-4);
}

.description-content ul,
.description-content ol,
.detail-content ul,
.detail-content ol {
  margin-left: var(--space-6);
  margin-bottom: var(--space-4);
}

.description-content li,
.detail-content li {
  margin-bottom: var(--space-2);
}

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.skill-badge {
  display: inline-block;
  background: #f0f9ff;
  color: #0369a1;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: 1px solid #bae6fd;
}

/* === Buttons === */

.apply-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: var(--primary);
  color: white;
  border: 2px solid var(--primary);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  min-height: 48px;
  margin-top: var(--space-8);
}

.apply-btn:hover:not(:disabled) {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* === State Messages === */

.no-results,
.error-message,
.loading-message {
  padding: var(--space-12);
  text-align: center;
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
}

.no-results {
  color: var(--neutral-600);
  background: var(--neutral-100);
  border: 1px solid var(--neutral-200);
}

.error-message {
  background: var(--error-light);
  border: 1px solid #fca5a5;
  color: var(--error);
  font-weight: var(--font-weight-medium);
}

.loading-message {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  color: var(--neutral-600);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.error {
  color: var(--error);
  font-weight: var(--font-weight-semibold);
}

/* === Categories Container === */

.categories-container {
  max-width: 1400px;
  margin: var(--space-12) auto;
  padding: 0 var(--space-6);
  width: 100%;
}

.categories-container h2 {
  margin-bottom: var(--space-8);
}

.category-filters {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-12);
  align-items: center;
}

.category-filter {
  background: white;
  border: 2px solid var(--neutral-300);
  color: var(--neutral-700);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
}

.category-filter:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.category-filter.active {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

/* === Footer === */

footer {
  background: var(--neutral-900);
  color: var(--neutral-300);
  padding: var(--space-8) var(--space-6);
  text-align: center;
  font-size: var(--font-size-sm);
  border-top: 1px solid var(--neutral-800);
  margin-top: var(--space-16);
}

footer p {
  margin: 0;
  color: var(--neutral-300);
}

/* === Responsive Design === */

@media (max-width: 768px) {
  h1 {
    font-size: var(--font-size-3xl);
  }

  h2 {
    font-size: var(--font-size-2xl);
  }

  h3 {
    font-size: var(--font-size-xl);
  }

  header {
    padding: var(--space-4) var(--space-4);
  }

  .nav {
    gap: var(--space-4);
  }

  .logo {
    font-size: var(--font-size-xl);
  }

  .nav-links a {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
  }

  .hero {
    padding: var(--space-8) var(--space-4);
  }

  .hero h1 {
    font-size: var(--font-size-2xl);
  }

  .hero p {
    font-size: var(--font-size-base);
  }

  .offer-list {
    margin: var(--space-8) auto;
    padding: 0 var(--space-4);
  }

  .offer-list h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--space-6);
  }

  .offer-grid {
    grid-template-columns: 1fr;
    gap: var(--space-4);
  }

  .offer-card {
    padding: var(--space-4);
  }

  .offer-detail {
    padding: var(--space-4);
  }

  .offer-detail-card {
    padding: var(--space-6);
  }

  .offer-detail-card h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--space-4);
  }

  .offer-detail-card h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-3);
  }

  .job-header-meta {
    grid-template-columns: 1fr;
    gap: var(--space-3);
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-6);
  }

  .apply-btn {
    width: 100%;
    margin-top: var(--space-6);
  }

  .category-filters {
    gap: var(--space-2);
  }

  .category-filter {
    font-size: var(--font-size-xs);
    padding: var(--space-2) var(--space-3);
  }

  footer {
    padding: var(--space-6) var(--space-4);
  }
}

@media (max-width: 480px) {
  body {
    font-size: var(--font-size-sm);
  }

  header {
    padding: var(--space-3) var(--space-3);
  }

  .nav {
    gap: var(--space-2);
  }

  .logo {
    font-size: var(--font-size-lg);
  }

  .nav-links a {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-xs);
    min-height: 40px;
  }

  h1 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--space-3);
  }

  h2 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space-3);
  }

  h3 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-2);
  }

  .hero {
    padding: var(--space-6) var(--space-3);
  }

  .hero h1 {
    font-size: var(--font-size-2xl);
  }

  .hero p {
    font-size: var(--font-size-sm);
    margin-bottom: var(--space-6);
  }

  .cta-btn {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-sm);
    min-height: 44px;
  }

  .offer-list {
    margin: var(--space-6) auto;
    padding: 0 var(--space-3);
  }

  .offer-card {
    padding: var(--space-3);
  }

  .offer-card h3 {
    font-size: var(--font-size-base);
  }

  .offer-meta {
    gap: var(--space-1);
    margin-bottom: var(--space-3);
  }

  .category,
  .status {
    font-size: var(--font-size-xs);
    padding: var(--space-1) var(--space-2);
  }

  .offer-card p {
    font-size: var(--font-size-xs);
    margin-bottom: var(--space-3);
  }

  .offer-detail {
    padding: var(--space-3);
  }

  .offer-detail-card {
    padding: var(--space-4);
  }

  .offer-detail-card h1 {
    font-size: var(--font-size-xl);
    margin-bottom: var(--space-3);
  }

  .offer-detail-card h3 {
    font-size: var(--font-size-base);
    margin-bottom: var(--space-2);
  }

  .job-header-meta {
    gap: var(--space-2);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-4);
  }

  .meta-item {
    gap: var(--space-1);
  }

  .meta-item strong {
    font-size: var(--font-size-xs);
  }

  .meta-item > span:not(strong) {
    font-size: var(--font-size-sm);
  }

  .salary-section {
    padding: var(--space-4);
    margin-bottom: var(--space-6);
  }

  .salary-display {
    font-size: var(--font-size-xl);
  }

  .apply-btn {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-sm);
    margin-top: var(--space-4);
    min-height: 44px;
  }

  .back-btn {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-xs);
    margin-bottom: var(--space-4);
  }

  footer {
    padding: var(--space-4) var(--space-3);
    font-size: var(--font-size-xs);
  }
}

/* === Accessibility === */

:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  body {
    background: var(--neutral-900);
    color: var(--neutral-100);
  }

  header {
    background: var(--neutral-800);
    border-bottom-color: var(--neutral-700);
  }

  .nav-links a {
    color: var(--neutral-300);
  }

  .nav-links a:hover {
    background: rgba(0, 102, 204, 0.1);
  }

  .hero {
    background: linear-gradient(135deg, var(--neutral-800) 0%, rgba(0, 102, 204, 0.1) 100%);
    border-bottom-color: var(--neutral-700);
  }

  .hero h1,
  .hero p {
    color: var(--neutral-100);
  }

  .offer-card {
    background: var(--neutral-800);
    border-color: var(--neutral-700);
  }

  .offer-card h3 {
    color: var(--neutral-100);
  }

  .offer-card p {
    color: var(--neutral-400);
  }

  .offer-detail-card {
    background: var(--neutral-800);
    border-color: var(--neutral-700);
  }

  .offer-detail-card h1,
  .offer-detail-card h3 {
    color: var(--neutral-100);
  }

  .job-header-meta {
    border-bottom-color: var(--neutral-700);
  }

  .meta-item > span:not(strong) {
    color: var(--neutral-100);
  }

  .salary-section {
    background: rgba(0, 102, 204, 0.1);
    border-left-color: var(--primary);
  }

  .description-content,
  .detail-content {
    color: var(--neutral-400);
  }

  .no-results {
    background: var(--neutral-800);
    border-color: var(--neutral-700);
    color: var(--neutral-400);
  }

  footer {
    background: var(--neutral-950);
    border-top-color: var(--neutral-800);
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
          <p class="error-message">⚠️ Error: \${this.state.error}</p>
          <button onclick="location.reload()" class="apply-btn">Try Again</button>
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
          <div class="no-results">
            <p>No opportunities available at this time.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">Please check back soon for new listings.</p>
          </div>
        </section>
      \`;
    }

    return \`
      <section class="hero">
        <h1>Find Your Next Opportunity</h1>
        <p>Discover high-paying accounting and finance jobs</p>
        <a href="/jobs/" class="cta-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse \${this.state.offers.length} Jobs</a>
      </section>

      <section class="offer-list">
        <h2>Featured Opportunities</h2>
        <div class="offer-grid">
          \${this.state.offers.slice(0, 6).map(offer => this.renderOfferCard(offer)).join('')}
        </div>
      </section>
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
        <div class="offer-detail">
          <a href="/jobs/" class="back-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">← Back to Jobs</a>
          <div class="offer-detail-card">
            <div class="error-message">
              <p style="margin: 0;">⚠️ Job not found or unavailable</p>
            </div>
            <a href="/jobs/" class="apply-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">Browse All Jobs</a>
          </div>
        </div>
      \`;
    }

    const o = this.state.selectedOffer;
    const hasCompany = o.company || o.company_domain;
    const hasLocation = o.location || o.location_city || o.location_country;
    const hasSalary = o.salary_min || o.salary_max || o.salary_display;
    const applyUrl = o.apply_url || o.url;
    
    const location = o.location || [o.location_city, o.location_state, o.location_country].filter(Boolean).join(', ') || 'Not specified';

    return \`
      <div class="offer-detail">
        <a href="/jobs/" class="back-btn" onclick="event.preventDefault(); app.navigate('/jobs/')">← Back to Jobs</a>
        <div class="offer-detail-card">
          <h1>\${o.title}</h1>
          
          <div class="job-header-meta">
            \${hasCompany ? \`
            <div class="meta-item">
              <strong>Company</strong>
              <span>\${o.company}\${o.company_domain ? \` · \${o.company_domain}\` : ''}</span>
            </div>\` : ''}
            \${hasLocation ? \`
            <div class="meta-item">
              <strong>Location</strong>
              <span>\${location}</span>
            </div>\` : ''}
            \${o.remote !== undefined && o.remote !== null ? \`
            <div class="meta-item">
              <strong>Work Mode</strong>
              <span>\${o.remote ? '✓ Remote' : 'On-site'}</span>
            </div>\` : ''}
            \${o.employment_type ? \`
            <div class="meta-item">
              <strong>Employment Type</strong>
              <span>\${o.employment_type}</span>
            </div>\` : ''}
            \${o.category_id ? \`
            <div class="meta-item">
              <strong>Category</strong>
              <span>\${o.category_id.replace('cat-', '').charAt(0).toUpperCase() + o.category_id.replace('cat-', '').slice(1)}</span>
            </div>\` : ''}
            \${o.date_posted ? \`
            <div class="meta-item">
              <strong>Posted</strong>
              <span>\${new Date(o.date_posted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>\` : ''}
          </div>

          \${hasSalary ? \`
          <div class="salary-section">
            <h3>Compensation</h3>
            <div class="salary-display">
              \${o.salary_display || (o.salary_min || o.salary_max) ? \`\${o.salary_display || \`\${o.salary_currency || 'USD'} \${o.salary_min ? o.salary_min.toLocaleString() : ''}\${o.salary_min && o.salary_max ? ' - ' : ''}\${o.salary_max ? o.salary_max.toLocaleString() : ''} \${o.salary_period || 'per year'}\`}\` : 'Not specified'}
            </div>
          </div>\` : ''}

          \${applyUrl ? \`
          <a href="\${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn" onclick="app.handleOfferClick('\${o.id}')">Apply for this Position</a>
          \` : \`
          <button disabled class="apply-btn" style="opacity: 0.5; cursor: not-allowed;">Application Link Not Available</button>
          \`}

          \${o.description_html || o.description ? \`
          <div class="description-section">
            <h3>Job Description</h3>
            <div class="description-content">
              \${o.description_html ? o.description_html : \`<p>\${o.description}</p>\`}
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

          \${o.experience ? \`
          <div class="job-details">
            <h3>Experience Required</h3>
            <div class="detail-content">\${o.experience}</div>
          </div>\` : ''}

          \${o.skills && o.skills.length > 0 ? \`
          <div class="skills-section">
            <h3>Required Skills</h3>
            <div class="skills-list">
              \${o.skills.map(skill => \`<span class="skill-badge">\${skill}</span>\`).join('')}
            </div>
          </div>\` : ''}

          \${o.benefits ? \`
          <div class="job-details">
            <h3>Benefits</h3>
            <div class="detail-content">\${Array.isArray(o.benefits) ? o.benefits.map(b => \`<div>• \${b}</div>\`).join('') : o.benefits}</div>
          </div>\` : ''}

          \${applyUrl ? \`
          <a href="\${applyUrl}" target="_blank" rel="noopener noreferrer" class="apply-btn" onclick="app.handleOfferClick('\${o.id}')">Apply for this Position</a>
          \` : ''}
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
