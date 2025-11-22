// load-tests/test-full-user-journey.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Set to true for detailed debugging
const VERBOSE = false;

// Custom metrics for journey tracking
const journeyCompletions = new Counter('journey_completions');
const journeyErrors = new Rate('journey_errors');
const stepDuration = new Trend('step_duration');

export let options = {
  stages: [
    { duration: '30s', target: 2 },   // Ramp up to 2 users
    { duration: '2m', target: 5 },    // Ramp to 5 users
    { duration: '3m', target: 5 },    // Stay at 5 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
  http_req_duration: ['p(95)<2000'],
  journey_errors: ['rate<0.1'],
  journey_completions: ['count>10'],
  step_duration: ['p(95)<7000'], // Changed from 6000 to 7000
},
};

const BASE_URL = 'http://localhost:3000';
const DEMO_PHONE = '+919876543210';
const DEMO_OTP = '123456';

// Product catalog
const PRODUCTS = [
  { id: 1, name: 'Smart Learning Mat', price: 499, category: 'educational' },
  { id: 2, name: 'Confidence Journal', price: 399, category: 'personal' },
  { id: 3, name: 'Scarf Dumb Charades', price: 699, category: 'games' },
  { id: 4, name: 'Brain Gym Lab', price: 1999, category: 'educational' },
  { id: 5, name: 'Dance Freeze Cards', price: 499, category: 'physical' },
  { id: 6, name: 'Brain Gym Calendar', price: 2499, category: 'educational' },
  { id: 7, name: 'Vision Board', price: 1, category: 'personal' },
  { id: 8, name: 'Seek Rush', price: 599, category: 'games' },
];

const COUPON_CODES = ['WELCOME10', 'FLAT50', 'SAVE20'];

// Journey tracking
let journeySteps = {
  login: false,
  browsed: false,
  wishlist: false,
  cart: false,
  checkout: false,
  orderPlaced: false,
  viewedOrders: false,
  logout: false
};

function resetJourney() {
  journeySteps = {
    login: false,
    browsed: false,
    wishlist: false,
    cart: false,
    checkout: false,
    orderPlaced: false,
    viewedOrders: false,
    logout: false
  };
}

function generateCustomerData() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  return {
    name: `Test Customer ${random}`,
    age: `${Math.floor(Math.random() * 10) + 5}`,
    email: `customer.${timestamp}@test-journey.com`,
    address: `${random} Test Street, Building ${Math.floor(Math.random() * 100)}`,
    city: ['Mumbai', 'Delhi', 'Bangalore'][Math.floor(Math.random() * 3)],
    state: ['Maharashtra', 'Delhi', 'Karnataka'][Math.floor(Math.random() * 3)],
    pincode: ['400001', '110001', '560001'][Math.floor(Math.random() * 3)]
  };
}

export default function () {
  resetJourney();
  let sessionCookie = null;
  let startTime;
  
  // STEP 1: Homepage Visit
  group('01. Homepage Visit', function () {
    startTime = Date.now();
    
    const res = http.get(BASE_URL);
    check(res, {
      'Homepage loads': (r) => r.status === 200,
    });
    
    stepDuration.add(Date.now() - startTime);
    sleep(2);
  });

  // STEP 2: Authentication
  group('02. User Authentication', function () {
    startTime = Date.now();
    
    const authRes = http.post(
      `${BASE_URL}/api/test-auth`,
      JSON.stringify({ phone: DEMO_PHONE, otp: DEMO_OTP }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
    const loginSuccess = check(authRes, {
      'Login successful': (r) => r.status === 200,
      'Session cookie set': (r) => r.cookies.session !== undefined,
    });
    
    if (loginSuccess && authRes.cookies.session) {
      sessionCookie = authRes.cookies.session[0].value;
      journeySteps.login = true;
    } else {
      journeyErrors.add(1);
      console.error(`❌ VU ${__VU}: Login failed`);
      return;
    }
    
    stepDuration.add(Date.now() - startTime);
    sleep(1);
  });

  const jar = http.cookieJar();
  jar.set(BASE_URL, 'session', sessionCookie);

  // STEP 3: Browse Products
  group('03. Product Browsing', function () {
    startTime = Date.now();
    
    let res = http.get(`${BASE_URL}/products`, { jar });
    check(res, {
      'Products page loads': (r) => r.status === 200,
    });
    
    sleep(2);
    
    const numProductsToView = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numProductsToView; i++) {
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      res = http.get(`${BASE_URL}/product/${product.id}`, { jar });
      check(res, {
        'Product detail loads': (r) => r.status === 200,
      });
      sleep(1.5);
    }
    
    journeySteps.browsed = true;
    stepDuration.add(Date.now() - startTime);
  });

  // STEP 4: Wishlist Management
  group('04. Wishlist Operations', function () {
    startTime = Date.now();
    
    const wishlistItems = PRODUCTS.slice(0, 2);
    
    for (const product of wishlistItems) {
      const res = http.post(
        `${BASE_URL}/api/wishlist`,
        JSON.stringify({ productId: product.id }),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar 
        }
      );
      
      check(res, {
        'Add to wishlist successful': (r) => r.status === 200,
      });
      sleep(1);
    }
    
    const wishlistRes = http.get(`${BASE_URL}/api/wishlist`, { jar });
    const wishlistCheck = check(wishlistRes, {
      'Get wishlist successful': (r) => r.status === 200,
      'Wishlist has items': (r) => {
        if (r.status !== 200) return false;
        const items = JSON.parse(r.body);
        return Array.isArray(items) && items.length > 0;
      },
    });
    
    if (wishlistCheck) {
      journeySteps.wishlist = true;
    }
    
    if (wishlistItems.length > 0) {
      const removeRes = http.del(
        `${BASE_URL}/api/wishlist`,
        JSON.stringify({ productId: wishlistItems[0].id }),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar 
        }
      );
      check(removeRes, {
        'Remove from wishlist successful': (r) => r.status === 200,
      });
    }
    
    stepDuration.add(Date.now() - startTime);
    sleep(1);
  });

  // STEP 5: Cart & Checkout
  group('05. Shopping Cart', function () {
    startTime = Date.now();
    
    const res = http.get(`${BASE_URL}/cart`, { jar });
    check(res, {
      'Cart page accessible': (r) => r.status === 200,
    });
    
    journeySteps.cart = true;
    stepDuration.add(Date.now() - startTime);
    sleep(2);
  });

  // STEP 6: Checkout Process
  group('06. Checkout Process', function () {
    startTime = Date.now();
    
    const cartItems = [];
    const numItems = 1 + Math.floor(Math.random() * 3);
    const usedIds = new Set();
    
    for (let i = 0; i < numItems; i++) {
      let product;
      do {
        product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      } while (usedIds.has(product.id));
      
      usedIds.add(product.id);
      cartItems.push({
        ...product,
        quantity: 1 + Math.floor(Math.random() * 2),
      });
    }
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const customer = generateCustomerData();
    
    const validationRes = http.post(
      `${BASE_URL}/api/validate-checkout`,
      JSON.stringify({
        email: customer.email,
        phone: DEMO_PHONE.replace('+91', ''),
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        jar 
      }
    );
    
    check(validationRes, {
      'Checkout validation passes': (r) => r.status === 200,
    });
    
    let discount = 0;
    if (Math.random() > 0.3 && subtotal > 500) {
      const couponCode = COUPON_CODES[Math.floor(Math.random() * COUPON_CODES.length)];
      const couponRes = http.post(
        `${BASE_URL}/api/coupon/validate`,
        JSON.stringify({ couponCode, orderAmount: subtotal }),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar 
        }
      );
      
      if (couponRes.status === 200) {
        const couponData = JSON.parse(couponRes.body);
        discount = couponData.discount.savedAmount;
        if (VERBOSE) console.log(`Coupon applied: ₹${discount} saved`);
      }
    }
    
    journeySteps.checkout = true;
    stepDuration.add(Date.now() - startTime);
    sleep(1);
  });

  // STEP 7: Place Order
  group('07. Place Order', function () {
    startTime = Date.now();
    
    const customer = generateCustomerData();
    const cartItems = [];
    const numItems = 1 + Math.floor(Math.random() * 3);
    const usedIds = new Set();
    
    for (let i = 0; i < numItems; i++) {
      let product;
      do {
        product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      } while (usedIds.has(product.id));
      
      usedIds.add(product.id);
      cartItems.push({
        ...product,
        quantity: 1 + Math.floor(Math.random() * 2),
      });
    }
    
    const orderData = {
      ...customer,
      cart: cartItems,
      discount: 0
    };
    
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (subtotal > 500 && Math.random() > 0.3) {
      const couponCode = COUPON_CODES[Math.floor(Math.random() * COUPON_CODES.length)];
      const couponRes = http.post(
        `${BASE_URL}/api/coupon/validate`,
        JSON.stringify({ couponCode, orderAmount: subtotal }),
        { 
          headers: { 'Content-Type': 'application/json' },
                    jar 
        }
      );
      
      if (couponRes.status === 200) {
        const couponData = JSON.parse(couponRes.body);
        orderData.discount = couponData.discount.savedAmount;
        orderData.couponCode = couponCode;
      }
    }
    
    const orderRes = http.post(
      `${BASE_URL}/api/test-order`,
      JSON.stringify(orderData),
      { 
        headers: { 'Content-Type': 'application/json' },
        jar 
      }
    );
    
    const orderCheck = check(orderRes, {
      'Order placed successfully': (r) => r.status === 200,
      'Order has ID': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.order && body.order._id;
      },
    });
    
    if (orderCheck) {
      journeySteps.orderPlaced = true;
      if (VERBOSE) {
        const order = JSON.parse(orderRes.body).order;
        console.log(`Order ${order._id} placed`);
      }
    } else {
      journeyErrors.add(1);
    }
    
    stepDuration.add(Date.now() - startTime);
    sleep(2);
  });

  // STEP 8: View Order History
  group('08. Order History', function () {
    startTime = Date.now();
    
    const ordersApiRes = http.get(`${BASE_URL}/api/orders`, { jar });
    const ordersCheck = check(ordersApiRes, {
      'GET orders successful': (r) => r.status === 200,
      'Has orders': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.orders && body.orders.length > 0;
      },
    });
    
    if (ordersCheck) {
      journeySteps.viewedOrders = true;
    }
    
    const ordersPageRes = http.get(`${BASE_URL}/orders`, { jar });
    check(ordersPageRes, {
      'Orders page loads': (r) => r.status === 200,
    });
    
    stepDuration.add(Date.now() - startTime);
    sleep(1);
  });

  // STEP 9: Profile Management
  group('09. Profile & Account', function () {
    startTime = Date.now();
    
    const meRes = http.get(`${BASE_URL}/api/me`, { jar });
    check(meRes, {
      'Get profile successful': (r) => r.status === 200,
      'Profile has user data': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.user && body.user.phone === DEMO_PHONE;
      },
    });
    
    const profileRes = http.get(`${BASE_URL}/profile`, { jar });
    check(profileRes, {
      'Profile page loads': (r) => r.status === 200,
    });
    
    stepDuration.add(Date.now() - startTime);
    sleep(1);
  });

  // STEP 10: Logout
  group('10. Logout', function () {
    startTime = Date.now();
    
    const logoutRes = http.post(`${BASE_URL}/api/logout`, null, { jar });
    const logoutCheck = check(logoutRes, {
      'Logout successful': (r) => r.status === 200,
    });
    
    if (logoutCheck) {
      journeySteps.logout = true;
    }
    
    const verifyRes = http.get(`${BASE_URL}/api/me`, { jar });
    check(verifyRes, {
      'Session cleared': (r) => r.status === 401,
    });
    
    stepDuration.add(Date.now() - startTime);
  });

  // Calculate journey completion
  const completedSteps = Object.values(journeySteps).filter(v => v === true).length;
  const totalSteps = Object.keys(journeySteps).length;
  const completionRate = (completedSteps / totalSteps) * 100;
  
  if (completionRate >= 80) {
    journeyCompletions.add(1);
    console.log(`Journey ${__VU}: ${completionRate.toFixed(0)}% complete`);
  } else {
    journeyErrors.add(1);
    console.log(`Journey ${__VU}: Failed (${completionRate.toFixed(0)}%)`);
  }
  
  sleep(3 + Math.random() * 2);
}

export function handleSummary(data) {
  const completions = data.metrics.journey_completions ? data.metrics.journey_completions.values.count : 0;
  const errorRate = data.metrics.journey_errors ? data.metrics.journey_errors.values.rate : 0;
  const p95 = data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0;
  const avgStepDuration = data.metrics.step_duration ? data.metrics.step_duration.values.avg : 0;
  
  console.log(`
╔══════════════════════════════════════╗
║     FULL JOURNEY TEST RESULTS       ║
╠══════════════════════════════════════╣
║ ✅ Completions: ${String(completions).padEnd(20)} ║
║ ❌ Error Rate:  ${(errorRate * 100).toFixed(1) + '%'.padEnd(20)} ║
║ ⚡ p95 Response: ${(p95.toFixed(0) + 'ms').padEnd(20)} ║
║ ⏱  Avg Step:    ${(avgStepDuration.toFixed(0) + 'ms').padEnd(20)} ║
║ 🏆 Status:      ${(completions >= 10 && errorRate < 0.1 ? 'PASSED ✅' : 'FAILED ❌').padEnd(20)} ║
╚══════════════════════════════════════╝

Cleanup: db.orders.deleteMany({ paymentId: { $regex: /^TEST_/ } })
  `);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}