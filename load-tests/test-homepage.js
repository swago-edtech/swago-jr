// load-tests/test-homepage.js

import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
export let options = {
  vus: 1,        // 1 virtual user
  duration: '10s', // Run for 10 seconds
};

// The test function that each virtual user will run
export default function () {
  // Make a GET request to your homepage
  let response = http.get('http://localhost:3000');
  
  // Check if the response was successful
  check(response, {
    'status is 200': (r) => r.status === 200,
    'page loaded quickly': (r) => r.timings.duration < 2000, // Less than 2 seconds
  });
  
  // Wait 1 second before next request
  sleep(1);
}