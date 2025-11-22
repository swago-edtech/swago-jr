// load-tests/test-product-browsing.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Simulate 10 users browsing
    { duration: '1m', target: 10 },   
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    'group_duration{group:::Product Browsing}': ['p(95)<3000'],
  },
};

export default function () {
  group('Product Browsing', function() {
    // 1. Visit homepage
    let home = http.get('http://localhost:3000');
    check(home, { 'homepage loaded': (r) => r.status === 200 });
    sleep(2);
    
    // 2. Browse products page
    let products = http.get('http://localhost:3000/products');
    check(products, { 'products page loaded': (r) => r.status === 200 });
    sleep(3);
    
    // 3. View a specific product (1-8 available)
    let productId = Math.floor(Math.random() * 8) + 1;
    let product = http.get(`http://localhost:3000/product/${productId}`);
    check(product, { 'product detail loaded': (r) => r.status === 200 });
    sleep(2);
  });
  
  // Random wait before next iteration
  sleep(Math.random() * 2);
}