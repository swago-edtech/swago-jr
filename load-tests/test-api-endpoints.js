// load-tests/test-api-endpoints.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 5 },    // Stay at 5 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration{endpoint:me}': ['p(95)<1000'],
    'http_req_duration{endpoint:products}': ['p(95)<1500'],
    'http_req_duration{endpoint:kid-profiles}': ['p(95)<1000'],
  },
};

export default function () {
  // Test 1: Check user session
  let meResponse = http.get('http://localhost:3000/api/me', {
    tags: { endpoint: 'me' }
  });
  
  check(meResponse, {
    'me status 200': (r) => r.status === 200,
  });
  
  sleep(0.5);
  
  // Test 2: Get products
  let productsResponse = http.get('http://localhost:3000/products', {
    tags: { endpoint: 'products' }
  });
  
  check(productsResponse, {
    'products loaded': (r) => r.status === 200,
  });
  
  sleep(0.5);
  
  // Test 3: Kid profiles API
  let kidResponse = http.get('http://localhost:3000/api/kid-profiles', {
    tags: { endpoint: 'kid-profiles' }
  });
  
  check(kidResponse, {
    'kid-profiles status ok': (r) => [200, 401].includes(r.status), // 401 if not logged in
  });
  
  sleep(1);
}