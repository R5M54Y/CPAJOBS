import { routeRequest } from './src/core/routing.js';
console.log('Route /api/offers:', routeRequest('/api/offers'));
console.log('Route /api/offers?limit=6:', routeRequest(new URL('https://test/api/offers?limit=6').pathname));
console.log('Route /api/categories:', routeRequest('/api/categories'));
