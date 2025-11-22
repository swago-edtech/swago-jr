// load-tests/test-auth-debug.js

import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 1,
  iterations: 1, // Run only once
};

export default function () {
  console.log('=== Testing OTP Send ===');
  
  // Try to send OTP
  let sendOtpRes = http.post('http://localhost:3000/api/send-otp', 
    JSON.stringify({ phone: '+919876543210' }),
    { headers: { 'Content-Type': 'application/json' }}
  );
  
  console.log('Send OTP Status:', sendOtpRes.status);
  console.log('Send OTP Response:', sendOtpRes.body.substring(0, 200)); // First 200 chars
  
  check(sendOtpRes, { 
    'OTP request processed': (r) => r.status < 500 
  });
  
  // Check if profile page requires auth
  console.log('\n=== Testing Profile Page ===');
  let profileRes = http.get('http://localhost:3000/profile');
  console.log('Profile Status:', profileRes.status);
  
  // Check API without auth
  console.log('\n=== Testing API without Auth ===');
  let meRes = http.get('http://localhost:3000/api/me');
  console.log('/api/me Status:', meRes.status);
  console.log('/api/me Response:', meRes.body.substring(0, 100));
}