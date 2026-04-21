const crypto = require('crypto');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const WEBHOOK_SECRET = 'test_secret'; // We'll need to set this in .env during test

async function runTest() {
  console.log('🧪 Starting Payment Flow Test...');

  // 1. Setup Order
  console.log('\n1️⃣ Setting up test order...');
  const setupRes = await fetch(`${BASE_URL}/api/test/setup-order`);
  const setupData = await setupRes.json();
  const { orderId } = setupData;
  console.log(`✅ Created Order: ${orderId}`);
  console.log('Initial State:', setupData.initialState);

  // 2. Simulate Webhook Call
  console.log('\n2️⃣ Simulating Razorpay Webhook (payment.captured)...');
  const payload = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_' + Date.now(),
          amount: 15000,
          order_id: 'razor_order_' + Date.now(),
          notes: { orderId: orderId }
        }
      }
    }
  };

  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const webhookRes = await fetch(`${BASE_URL}/api/razorpay/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: body
  });

  const webhookData = await webhookRes.json();
  console.log('Webhook Response:', webhookData);

  if (webhookRes.statusCode !== 200) {
    console.error('❌ Webhook failed. Status:', webhookRes.statusCode);
    return;
  }

  // 3. Verify Final State
  console.log('\n3️⃣ Verifying final state...');
  const verifyRes = await fetch(`${BASE_URL}/api/test/verify-order?orderId=${orderId}`);
  const finalState = await verifyRes.json();
  console.log('Final State:', finalState);

  // Assertions
  const assertions = [
    { name: 'Status is Paid', passed: finalState.orderStatus === 'Paid' },
    { name: 'Stock reduced (50 -> 48)', passed: finalState.productStock === 48 },
    { name: 'Reserved stock released (2 -> 0)', passed: finalState.productReserved === 0 },
    { name: 'Swago Money deducted (1000 -> 980)', passed: finalState.swagoMoney === 980 },
    { name: 'Coupon usage incremented (0 -> 1)', passed: finalState.couponUsage === 1 },
    { name: 'Created via webhook', passed: finalState.createdVia === 'webhook' }
  ];

  console.log('\n📊 TEST RESULTS:');
  assertions.forEach(a => {
    console.log(`${a.passed ? '✅' : '❌'} ${a.name}`);
  });

  if (assertions.every(a => a.passed)) {
    console.log('\n🎉 ALL TESTS PASSED!');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED.');
  }
}

async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(u, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        res.json = () => JSON.parse(data);
        resolve(res);
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

runTest().catch(console.error);
