// load-tests/test-homepage-load.js

import http from 'k6/http';
import { check, sleep } from 'k6';

// Gradually increase load
export let options = {
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users over 30s
    { duration: '1m', target: 5 },    // Stay at 5 users for 1 minute
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests must complete below 3s
    http_req_failed: ['rate<0.1'],     // Error rate must be below 10%
  },
};

export default function () {
  let response = http.get('http://localhost:3000');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'page loaded': (r) => r.timings.duration < 3000,
  });
  
  // Random sleep between 1-3 seconds (simulating real user behavior)
  sleep(Math.random() * 2 + 1);
}