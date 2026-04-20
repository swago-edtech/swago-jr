// load-tests/test-order-flow.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const orderErrors = new Rate('order_errors');
const orderCreationTime = new Trend('order_creation_time');
const ordersCreated = new Counter('orders_created');
const couponsApplied = new Counter('coupons_applied');

export let options = {
  stages: [
    { duration: '10s', target: 1 },  // Start with 1 user
    { duration: '1m', target: 3 },   // Ramp to 3 users (safe for DB)
    { duration: '2m', target: 3 },   // Stay at 3 users
    { duration: '20s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    order_errors: ['rate<0.1'],
    order_creation_time: ['p(95)<3000'],
  },
};

const BASE_URL = 'http://localhost:3000';
const DEMO_PHONE = '+919876543210';
const DEMO_OTP = '123456';

// Test data
const TEST_PRODUCTS = [
  { id: 1, name: 'Smart Learning Mat', price: 499 },
  { id: 2, name: 'Confidence Journal', price: 399 },
  { id: 3, name: 'Scarf Dumb Charades', price: 699 },
  { id: 7, name: 'Vision Board', price: 1 },
  { id: 8, name: 'Seek Rush', price: 599 },
];

const TEST_ADDRESSES = [
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
];

const COUPON_CODES = ['WELCOME10', 'FLAT50', 'SAVE20'];

let sessionCookie = null;
let createdOrders = [];

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

function generateTestCustomer() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const address = TEST_ADDRESSES[Math.floor(Math.random() * TEST_ADDRESSES.length)];
  
  return {
    name: `Test User ${random}`,
    age: `${Math.floor(Math.random() * 9) + 6}`, // 6-14 years
    email: `test.user.${timestamp}@swago-test.com`,
    address: `Test Address ${random}, Street ${Math.floor(Math.random() * 100)}`,
    ...address
  };
}

function generateCart() {
  const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items
  const cart = [];
  const usedIds = new Set();
  
  for (let i = 0; i < numItems; i++) {
    let product;
    do {
      product = TEST_PRODUCTS[Math.floor(Math.random() * TEST_PRODUCTS.length)];
    } while (usedIds.has(product.id));
    
    usedIds.add(product.id);
    cart.push({
      ...product,
      quantity: Math.floor(Math.random() * 2) + 1, // 1-2 quantity
    });
  }
  
  return cart;
}

export default function () {
  // Authenticate once per VU
  if (!sessionCookie) {
    const success = authenticate();
    if (!success) {
      console.error('Authentication failed');
      orderErrors.add(1);
      sleep(5);
      return;
    }
  }

  const jar = http.cookieJar();
  jar.set(BASE_URL, 'session', sessionCookie);

  // Test 1: Coupon Validation
  group('Coupon Validation', function () {
    const cart = generateCart();
    const orderAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const couponCode = COUPON_CODES[Math.floor(Math.random() * COUPON_CODES.length)];
    
    const res = http.post(
      `${BASE_URL}/api/coupon/validate`,
      JSON.stringify({ couponCode, orderAmount }),
      { 
        headers: { 'Content-Type': 'application/json' },
        jar 
      }
    );
    
    const couponValid = check(res, {
      'Coupon validation works': (r) => r.status === 200 || r.status === 400,
    });
    
    if (res.status === 200) {
      couponsApplied.add(1);
      const data = JSON.parse(res.body);
      console.log(`Coupon ${couponCode} applied: ₹${data.discount.savedAmount} saved`);
    }
    
    sleep(1);
  });

  // Test 2: Create Order (with Paid status)
  group('Order Creation', function () {
    const customer = generateTestCustomer();
    const cart = generateCart();
    const orderAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Build order data
    const orderData = {
      ...customer,
      cart,
      discount: 0
    };
    
    // Sometimes apply a coupon (50% chance)
    if (Math.random() > 0.5) {
      const couponCode = COUPON_CODES[Math.floor(Math.random() * COUPON_CODES.length)];
      const couponRes = http.post(
        `${BASE_URL}/api/coupon/validate`,
        JSON.stringify({ couponCode, orderAmount }),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar 
        }
      );
      
      if (couponRes.status === 200) {
        const couponData = JSON.parse(couponRes.body);
        orderData.discount = couponData.discount.savedAmount;
        orderData.couponCode = couponCode; // Only add if valid
        couponsApplied.add(1);
      }
    }
    
    const startTime = Date.now();
    
    // Create test order (simulating successful payment)
    const orderRes = http.post(
      `${BASE_URL}/api/test-order`,
      JSON.stringify(orderData),
      { 
        headers: { 'Content-Type': 'application/json' },
        jar 
      }
    );
    
    orderCreationTime.add(Date.now() - startTime);
    
    const orderCheck = check(orderRes, {
      'Order created successfully': (r) => r.status === 200,
      'Returns order ID': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.success && body.order && body.order._id;
      },
      'Order status is Paid': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.order && body.order.status === 'Paid';
      },
    });
    
    if (orderCheck) {
      ordersCreated.add(1);
      const order = JSON.parse(orderRes.body).order;
      createdOrders.push(order._id);
      console.log(`Order created: ${order._id} with status: ${order.status}`);
    } else {
      orderErrors.add(1);
      console.error('Order creation failed:', orderRes.status, orderRes.body);
    }
    
    sleep(2);
  });

  // Test 3: Retrieve Orders
  group('Order Retrieval', function () {
    const res = http.get(`${BASE_URL}/api/orders`, { jar });
    
    check(res, {
      'GET orders successful': (r) => r.status === 200,
      'Returns orders array': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.success && Array.isArray(body.orders);
      },
'Contains test orders': (r) => {
  if (r.status !== 200) return false;
  const body = JSON.parse(r.body);
  // Check if we have any recent orders (since we just created them)
  return body.orders && body.orders.length > 0;
}
    });
    
    sleep(1);
  });

  // Test 4: Checkout Page Validation
  group('Checkout Form Validation', function () {
    // Test email validation
    const validationRes = http.post(
      `${BASE_URL}/api/validate-checkout`,
      JSON.stringify({
        email: `test.${Date.now()}@example.com`,
        phone: DEMO_PHONE.replace('+91', ''),
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        jar 
      }
    );
    
    check(validationRes, {
      'Checkout validation works': (r) => r.status === 200,
      'Returns valid status': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.valid !== undefined;
      },
    });
    
    sleep(1);
  });

  // Test 5: Order History Page
  group('Order History Page', function () {
    const res = http.get(`${BASE_URL}/orders`, { jar });
    
    check(res, {
      'Orders page accessible': (r) => r.status === 200,
      'Contains order content': (r) => 
        r.body.includes('Orders') || r.body.includes('orders'),
    });
    
    sleep(1);
  });

  sleep(3 + Math.random() * 2); // Random delay between iterations
}

// Cleanup function
export function teardown() {
  console.log('\n=== Test Summary ===');
  console.log(`Orders created: ${createdOrders.length}`);
  if (createdOrders.length > 0) {
    console.log(`Order IDs for cleanup:`);
    createdOrders.forEach(id => console.log(`  - ${id}`));
    console.log('\nTo clean up test orders in MongoDB:');
    console.log(`db.orders.deleteMany({ paymentId: { $regex: /^TEST_/ } })`);
  }
}