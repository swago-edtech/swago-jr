// load-tests/test-auth-simple.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 1,
  iterations: 1,
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  console.log('=== Testing Test Auth Endpoint ===');
  
  // Test the new endpoint
  const authRes = http.post(
    `${BASE_URL}/api/test-auth`,
    JSON.stringify({
      phone: '+919876543210',
      otp: '123456',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  console.log('Status:', authRes.status);
  console.log('Response:', authRes.body);
  console.log('Cookies:', JSON.stringify(authRes.cookies, null, 2));
  
  check(authRes, {
    'Auth successful': (r) => r.status === 200,
  });
  
  if (authRes.status === 200) {
    // Test authenticated request
    const jar = http.cookieJar();
    jar.set(BASE_URL, 'session', authRes.cookies.session[0].value);
    
    const meRes = http.get(`${BASE_URL}/api/me`, { jar });
    console.log('\n=== Testing /api/me with session ===');
    console.log('Status:', meRes.status);
    console.log('Response:', meRes.body.substring(0, 200));
    
    check(meRes, {
      'Authenticated request works': (r) => r.status === 200,
    });
  }
}