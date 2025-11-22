// load-tests/test-auth-flow.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter } from 'k6/metrics';

// Custom metrics
const authErrors = new Counter('auth_errors');
const authSuccess = new Counter('auth_success');

export let options = {
  stages: [
    { duration: '10s', target: 1 },  // Warm up with 1 user
    { duration: '30s', target: 5 },  // Ramp to 5 users
    { duration: '30s', target: 5 },  // Stay at 5 users
    { duration: '10s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    auth_errors: ['count<5'],
    auth_success: ['count>10'],
  },
};

const BASE_URL = 'http://localhost:3000';
const DEMO_PHONE = '+919876543210';
const DEMO_OTP = '123456';

// Helper function to extract cookies from response
function getCookieJar(res) {
  const jar = http.cookieJar();
  const url = BASE_URL;
  
  // Extract all cookies from response headers
  const cookies = res.cookies;
  for (const [name, values] of Object.entries(cookies)) {
    // values is an array of cookie objects
    if (Array.isArray(values)) {
      values.forEach(cookie => {
        jar.set(url, name, cookie.value);
      });
    }
  }
  
  return jar;
}

export default function () {
  // Test 1: Unauthenticated access
  group('Unauthenticated Access', function () {
    let res = http.get(`${BASE_URL}/api/me`);
    check(res, {
      'API returns 401 when not authenticated': (r) => r.status === 401,
    });
    
    res = http.get(`${BASE_URL}/api/kid-profiles`);
    check(res, {
      'Kid profiles returns 401 when not authenticated': (r) => r.status === 401,
    });
  });

  sleep(1);

  // Test 2: Authentication flow
  let jar = http.cookieJar();
  
  group('Authentication Flow', function () {
    // Use test auth endpoint for demo account
    const authPayload = JSON.stringify({
      phone: DEMO_PHONE,
      otp: DEMO_OTP,
    });

    const authRes = http.post(
      `${BASE_URL}/api/test-auth`,
      authPayload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const authCheck = check(authRes, {
      'Auth successful': (r) => r.status === 200,
      'Returns user data': (r) => {
        const body = JSON.parse(r.body);
        return body.success === true && body.user !== undefined;
      },
      'Sets session cookie': (r) => r.cookies.session !== undefined,
    });

    if (authCheck) {
      authSuccess.add(1);
      // Store cookies for subsequent requests
      jar = getCookieJar(authRes);
    } else {
      authErrors.add(1);
      console.error('Auth failed:', authRes.status, authRes.body);
    }
  });

  sleep(1);

  // Test 3: Authenticated API access
  if (jar) {
    group('Authenticated API Access', function () {
      // Test /api/me
      let res = http.get(`${BASE_URL}/api/me`, { jar });
      check(res, {
        'GET /api/me returns 200': (r) => r.status === 200,
        'Returns user info': (r) => {
          if (r.status !== 200) return false;
          const body = JSON.parse(r.body);
          return body.user && body.user.phone === DEMO_PHONE;
        },
      });

      sleep(0.5);

      // Test /api/kid-profiles
// NEW (correct check):
res = http.get(`${BASE_URL}/api/kid-profiles`, { jar });
check(res, {
  'GET /api/kid-profiles returns 200': (r) => r.status === 200,
  'Returns profiles object': (r) => {
    if (r.status !== 200) return false;
    const body = JSON.parse(r.body);
    return body.profiles && Array.isArray(body.profiles);  // ✅ Correct!
  },
});

      sleep(0.5);

      // Test /api/orders
      res = http.get(`${BASE_URL}/api/orders`, { jar });
      check(res, {
        'GET /api/orders returns 200': (r) => r.status === 200,
      });

      sleep(0.5);

      // Test /api/wishlist
      res = http.get(`${BASE_URL}/api/wishlist`, { jar });
      check(res, {
        'GET /api/wishlist accessible': (r) => [200, 201].includes(r.status),
      });
    });

    sleep(1);

    // Test 4: Protected pages access
    group('Protected Pages Access', function () {
      let res = http.get(`${BASE_URL}/profile`, { jar });
      check(res, {
        'Profile page accessible': (r) => r.status === 200,
      });

      sleep(0.5);

      res = http.get(`${BASE_URL}/orders`, { jar });
      check(res, {
        'Orders page accessible': (r) => r.status === 200,
      });

      sleep(0.5);

      res = http.get(`${BASE_URL}/kids`, { jar });
      check(res, {
        'Kids zone accessible': (r) => r.status === 200,
      });
    });

    sleep(1);

    // Test 5: Logout
    group('Logout Flow', function () {
      const res = http.post(`${BASE_URL}/api/logout`, null, { jar });
      check(res, {
        'Logout successful': (r) => r.status === 200,
      });

      // Verify session is cleared
      sleep(0.5);
      const meRes = http.get(`${BASE_URL}/api/me`, { jar });
      check(meRes, {
        'Session cleared after logout': (r) => r.status === 401,
      });
    });
  }

  sleep(2);
}