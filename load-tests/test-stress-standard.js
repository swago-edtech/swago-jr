// load-tests/test-stress-standard.js
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Stress monitoring metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success_rate');
const connectionErrors = new Counter('connection_errors');
const timeouts = new Counter('timeouts');
const orderCreations = new Counter('orders_created');
const responseTime = new Trend('response_time');

export let options = {
  stages: [
    // Gradual ramp-up to find breaking points
    { duration: '30s', target: 5 },    // Baseline
    { duration: '1m', target: 15 },    // 3x normal
    { duration: '1m', target: 30 },    // 6x normal
    { duration: '1m', target: 50 },    // 10x normal
    { duration: '1m', target: 75 },    // 15x normal
    { duration: '1m', target: 100 },   // 20x normal - maximum
    { duration: '30s', target: 100 },  // Hold at peak
    { duration: '1m', target: 50 },    // Recovery test
    { duration: '30s', target: 20 },   // Further recovery
    { duration: '30s', target: 5 },    // Return to baseline
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'], // Allow up to 15s during stress
    errors: ['rate<0.9'],                // Fail if 90% errors
  },
};

const BASE_URL = 'http://localhost:3000';
const DEMO_PHONE = '+919876543210';
const DEMO_OTP = '123456';

// Simplified products
const PRODUCTS = [
  { id: 1, name: 'Smart Learning Mat', price: 499 },
  { id: 3, name: 'Scarf Dumb Charades', price: 699 },
  { id: 7, name: 'Vision Board', price: 1 },
];

let vuAuthTokens = {};

function generateTestData() {
  const timestamp = Date.now();
  const vuId = __VU;
  const iter = __ITER;
  
  return {
    email: `stress_${vuId}_${iter}_${timestamp}@test.com`,
    name: `Stress User ${vuId}`,
    age: `${5 + (vuId % 10)}`,
    address: `Stress Test Address ${vuId}`,
    city: 'TestCity',
    state: 'TestState',
    pincode: '400001'
  };
}

export default function () {
  let sessionCookie = vuAuthTokens[__VU];
  let journeySuccess = true;
  
  // STEP 1: Authentication (cache per VU)
  if (!sessionCookie) {
    group('1. Authentication', function () {
      const startTime = Date.now();
      
      const authRes = http.post(
        `${BASE_URL}/api/test-auth`,
        JSON.stringify({ phone: DEMO_PHONE, otp: DEMO_OTP }),
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: '10s'
        }
      );
      
      responseTime.add(Date.now() - startTime);
      
      if (authRes.status === 0) {
        connectionErrors.add(1);
        errorRate.add(1);
        console.log(`VU ${__VU}: Connection failed at auth`);
        return;
      }
      
      const loginOk = check(authRes, {
        'Login successful': (r) => r.status === 200,
      });
      
      if (loginOk && authRes.cookies.session) {
        sessionCookie = authRes.cookies.session[0].value;
        vuAuthTokens[__VU] = sessionCookie;
        successRate.add(1);
      } else {
        errorRate.add(1);
        console.log(`VU ${__VU}: Auth failed - ${authRes.status}`);
        return;
      }
    });
  }
  
  if (!sessionCookie) return;
  
  const jar = http.cookieJar();
  jar.set(BASE_URL, 'session', sessionCookie);
  
  // STEP 2: Browse Products (Quick)
  group('2. Product Browse', function () {
    const startTime = Date.now();
    
    const res = http.get(`${BASE_URL}/products`, { 
      jar,
      timeout: '10s'
    });
    
    responseTime.add(Date.now() - startTime);
    
    if (res.status === 0) {
      connectionErrors.add(1);
      errorRate.add(1);
      journeySuccess = false;
    } else if (res.status === 200) {
      successRate.add(1);
    } else {
      errorRate.add(1);
      journeySuccess = false;
    }
    
    sleep(0.5);
  });
  
  // STEP 3: Create Order (Main stress point)
  if (journeySuccess) {
    group('3. Order Creation', function () {
      const testData = generateTestData();
      const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      
      const orderData = {
        ...testData,
        cart: [{
          ...product,
          quantity: 1
        }],
        discount: 0
      };
      
      const startTime = Date.now();
      
      const orderRes = http.post(
        `${BASE_URL}/api/test-order`,
        JSON.stringify(orderData),
        { 
          headers: { 'Content-Type': 'application/json' },
          jar,
          timeout: '15s'
        }
      );
      
      responseTime.add(Date.now() - startTime);
      
      if (orderRes.status === 0) {
        connectionErrors.add(1);
        errorRate.add(1);
        timeouts.add(1);
        console.log(`VU ${__VU}: Order timeout`);
      } else if (orderRes.status === 200) {
        orderCreations.add(1);
        successRate.add(1);
        if (__VU % 10 === 0) { // Log every 10th VU success
          console.log(`VU ${__VU}: Order created successfully`);
        }
      } else {
        errorRate.add(1);
        console.log(`VU ${__VU}: Order failed - ${orderRes.status}`);
      }
    });
  }
  
  // STEP 4: View Orders
  group('4. View Orders', function () {
    const startTime = Date.now();
    
    const res = http.get(`${BASE_URL}/api/orders`, { 
      jar,
      timeout: '10s'
    });
    
    responseTime.add(Date.now() - startTime);
    
    if (res.status === 0) {
      connectionErrors.add(1);
      timeouts.add(1);
    } else if (res.status === 200) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });
  
  // STEP 5: Quick check
  group('5. API Check', function () {
    const startTime = Date.now();
    
    const res = http.get(`${BASE_URL}/api/me`, { 
      jar,
      timeout: '5s'
    });
    
    responseTime.add(Date.now() - startTime);
    
    if (res.status === 0) {
      connectionErrors.add(1);
    } else if (res.status === 200) {
      successRate.add(1);
    } else {
      errorRate.add(1);
    }
  });
  
  // Minimal delay for stress
  sleep(Math.random() * 2); // 0-2 seconds
}

export function handleSummary(data) {
  const errorRateValue = data.metrics.errors?.values.rate || 0;
  const successRateValue = data.metrics.success_rate?.values.rate || 0;
  const connectionErrorCount = data.metrics.connection_errors?.values.count || 0;
  const timeoutCount = data.metrics.timeouts?.values.count || 0;
  const ordersCreated = data.metrics.orders_created?.values.count || 0;
  const p95Response = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const maxVUs = data.metrics.vus_max?.values.value || 0;
  
  console.log(`
╔════════════════════════════════════════╗
║         STRESS TEST RESULTS            ║
╠════════════════════════════════════════╣
║ 🔥 Max VUs:        ${String(maxVUs).padEnd(20)} ║
║ ✅ Success Rate:   ${(successRateValue * 100).toFixed(1) + '%'.padEnd(20)} ║
║ ❌ Error Rate:     ${(errorRateValue * 100).toFixed(1) + '%'.padEnd(20)} ║
║ 🔌 Connection Errors: ${String(connectionErrorCount).padEnd(17)} ║
║ ⏱  Timeouts:       ${String(timeoutCount).padEnd(20)} ║
║ 📦 Orders Created: ${String(ordersCreated).padEnd(20)} ║
║ ⚡ p95 Response:   ${(p95Response.toFixed(0) + 'ms').padEnd(20)} ║
╠════════════════════════════════════════╣
║ SYSTEM BEHAVIOR:                       ║`);


  // Analyze breaking points
  if (errorRateValue < 0.1) {
    console.log(`║ ✅ System handled load excellently     ║`);
  } else if (errorRateValue < 0.3) {
    console.log(`║ ⚠️  System showing moderate stress     ║`);
  } else if (errorRateValue < 0.5) {
    console.log(`║ ⚠️  System under significant stress    ║`);
  } else if (errorRateValue < 0.7) {
    console.log(`║ 🔥 System struggling badly             ║`);
  } else {
    console.log(`║ 💀 System essentially failed           ║`);
  }


  console.log(`╠════════════════════════════════════════╣`);
  
  // Performance analysis
  if (p95Response < 2000) {
    console.log(`║ Performance: Excellent (<2s)          ║`);
  } else if (p95Response < 5000) {
    console.log(`║ Performance: Degraded (2-5s)          ║`);
  } else if (p95Response < 10000) {
    console.log(`║ Performance: Poor (5-10s)             ║`);
  } else {
    console.log(`║ Performance: Critical (>10s)          ║`);
  }


  console.log(`╠════════════════════════════════════════╣`);
  console.log(`║ RECOMMENDATIONS:                       ║`);
  
  if (maxVUs > 50 && errorRateValue < 0.3) {
    console.log(`║ • Can handle 50+ concurrent users     ║`);
    console.log(`║ • Production ready for medium traffic  ║`);
  } else if (maxVUs > 30 && errorRateValue < 0.5) {
    console.log(`║ • Can handle 30+ concurrent users     ║`);
    console.log(`║ • Suitable for small-medium traffic   ║`);
  } else if (maxVUs > 15) {
    console.log(`║ • Can handle 15+ concurrent users     ║`);
    console.log(`║ • Suitable for small traffic          ║`);
  }
  
  if (connectionErrorCount > 100) {
    console.log(`║ • Connection pool needs increase      ║`);
  }
  if (timeoutCount > 50) {
    console.log(`║ • Database queries need optimization  ║`);
  }


  console.log(`╚════════════════════════════════════════╝`);
  console.log(`
📊 Detailed Metrics:
- Total Requests: ${data.metrics.http_reqs?.values.count || 0}
- Avg Response Time: ${(data.metrics.http_req_duration?.values.avg || 0).toFixed(0)}ms
- Max Response Time: ${(data.metrics.http_req_duration?.values.max || 0).toFixed(0)}ms
- Data Received: ${((data.metrics.data_received?.values.count || 0) / 1024 / 1024).toFixed(2)}MB


🧹 Cleanup Commands:
// Option 1: By payment ID (recommended)
db.orders.deleteMany({ razorpay_payment_id: { $regex: /^TEST_PAY_/ } })

// Option 2: By customer name
db.orders.deleteMany({ name: { $regex: /^Stress User/ } })

// Option 3: Check count before deleting
db.orders.countDocuments({ razorpay_payment_id: { $regex: /^TEST_PAY_/ } })
  `);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
  };
}
