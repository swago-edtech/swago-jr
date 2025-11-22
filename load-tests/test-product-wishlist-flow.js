// load-tests/test-product-wishlist-flow.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const wishlistErrors = new Rate('wishlist_errors');
const pageLoadTime = new Trend('page_load_time');

export let options = {
  stages: [
    { duration: '10s', target: 2 },  // Warm up
    { duration: '1m', target: 5 },   // Ramp to 5 users
    { duration: '2m', target: 5 },   // Stay at 5 users
    { duration: '20s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    wishlist_errors: ['rate<0.1'],
    page_load_time: ['p(95)<1500'],
  },
};

const BASE_URL = 'http://localhost:3000';
const DEMO_PHONE = '+919876543210';
const DEMO_OTP = '123456';

// Product IDs from your data
const PRODUCT_IDS = [1, 2, 3, 4, 5, 6, 7, 8];
const EXPENSIVE_PRODUCTS = [4, 6]; // Brain Gym (₹1999) and Calendar (₹2499)
const CHEAP_PRODUCTS = [1, 5, 7]; // Mat (₹499), Dance Cards (₹499), Vision Board (₹1)

let sessionCookie = null;

function authenticate() {
  const authRes = http.post(
    `${BASE_URL}/api/test-auth`,
    JSON.stringify({ phone: DEMO_PHONE, otp: DEMO_OTP }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  if (authRes.status === 200 && authRes.cookies.session) {
    sessionCookie = authRes.cookies.session[0].value;
    return true;
  }
  return false;
}

export default function () {
  // Authenticate once per VU
  if (!sessionCookie) {
    const success = authenticate();
    if (!success) {
      console.error('Authentication failed');
      sleep(5);
      return;
    }
  }

  const jar = http.cookieJar();
  jar.set(BASE_URL, 'session', sessionCookie);

  // Test 1: Browse Products
  group('Product Browsing', function () {
    // Homepage
    let startTime = Date.now();
    let res = http.get(BASE_URL);
    pageLoadTime.add(Date.now() - startTime);
    check(res, {
      'Homepage loads': (r) => r.status === 200,
    });
    sleep(1);

    // Products listing page
    startTime = Date.now();
    res = http.get(`${BASE_URL}/products`);
    pageLoadTime.add(Date.now() - startTime);
    check(res, {
      'Products page loads': (r) => r.status === 200,
      'Contains product grid': (r) => r.body.includes('ProductGrid') || r.body.includes('Kits by Age'),
    });
    sleep(2);

    // Visit random product detail page
    const randomProductId = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
    startTime = Date.now();
    res = http.get(`${BASE_URL}/product/${randomProductId}`);
    pageLoadTime.add(Date.now() - startTime);
    check(res, {
      'Product detail page loads': (r) => r.status === 200,
    });
    sleep(1);
  });

  // Test 2: Wishlist Operations
  group('Wishlist Management', function () {
    // Get current wishlist
    let res = http.get(`${BASE_URL}/api/wishlist`, { jar });
    const wishlistCheck = check(res, {
      'GET wishlist successful': (r) => r.status === 200,
      'Returns array': (r) => {
        if (r.status !== 200) return false;
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
    });
    
    if (!wishlistCheck) {
      wishlistErrors.add(1);
    }

    sleep(1);

    // Add item to wishlist (pick a random product)
    const productToAdd = CHEAP_PRODUCTS[Math.floor(Math.random() * CHEAP_PRODUCTS.length)];
    res = http.post(
      `${BASE_URL}/api/wishlist`,
      JSON.stringify({ productId: productToAdd }),
      { 
        headers: { 'Content-Type': 'application/json' },
        jar 
      }
    );
    
    const addCheck = check(res, {
      'Add to wishlist successful': (r) => r.status === 200,
      'Returns updated wishlist': (r) => {
        if (r.status !== 200) return false;
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.wishlist);
        } catch {
          return false;
        }
      },
    });

    if (!addCheck) {
      wishlistErrors.add(1);
    }

    sleep(2);

    // Remove item from wishlist (only if add was successful)
    if (addCheck) {
      res = http.del(
        `${BASE_URL}/api/wishlist`,
        JSON.stringify({ productId: productToAdd }),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar 
        }
      );
      
      const removeCheck = check(res, {
        'Remove from wishlist successful': (r) => r.status === 200,
        'Item removed from list': (r) => {
          if (r.status !== 200) return false;
          try {
            const body = JSON.parse(r.body);
            return body.success === true && 
                   Array.isArray(body.wishlist) && 
                   !body.wishlist.includes(productToAdd);
          } catch {
            return false;
          }
        },
      });

      if (!removeCheck) {
        wishlistErrors.add(1);
      }
    }

    sleep(1);
  });

  // Test 3: Cart Page Access (can't test actual cart operations)
  group('Cart & Checkout Pages', function () {
    // Cart page
    let res = http.get(`${BASE_URL}/cart`, { jar });
    check(res, {
      'Cart page accessible': (r) => r.status === 200,
      'Shows empty cart or items': (r) => 
        r.body.includes('Your Cart') || r.body.includes('Your cart is empty'),
    });
    sleep(1);

    // Wishlist page
    res = http.get(`${BASE_URL}/wishlist`, { jar });
    check(res, {
      'Wishlist page accessible': (r) => r.status === 200,
    });
    sleep(1);

    // Checkout page (should redirect if cart is empty)
    res = http.get(`${BASE_URL}/checkout`, { jar });
    check(res, {
      'Checkout page response': (r) => [200, 302, 307].includes(r.status),
    });
  });

  // Test 4: Search/Filter simulation (visiting different categories)
  group('Product Categories', function () {
    const ageCategories = ['5-7', '8-10'];
    const randomCategory = ageCategories[Math.floor(Math.random() * ageCategories.length)];
    
    // Since there's no API for filtering, just visit products page
    // In real app, this might be /products?age=5-7
    const res = http.get(`${BASE_URL}/products`, { jar });
    check(res, {
      'Category page loads': (r) => r.status === 200,
    });
  });

  sleep(3 + Math.random() * 2); // Random delay between iterations
}

export function teardown() {
  if (sessionCookie) {
    const jar = http.cookieJar();
    jar.set(BASE_URL, 'session', sessionCookie);
    
    // Clean up: Remove all items from wishlist
    PRODUCT_IDS.forEach(productId => {
      http.del(
        `${BASE_URL}/api/wishlist`,
        JSON.stringify({ productId }),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar 
        }
      );
    });
  }
}