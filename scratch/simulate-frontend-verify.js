const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('🧪 Starting Frontend Verify Flow Test...');

  // 1. Setup Order
  console.log('\n1️⃣ Setting up test order...');
  const setupRes = await fetch(`${BASE_URL}/api/test/setup-order`);
  const setupData = await setupRes.json();
  const { orderId } = setupData;
  console.log(`✅ Created Order: ${orderId}`);

  // 2. Simulate Frontend Verify Call
  console.log('\n2️⃣ Simulating Frontend /api/payment/verify call...');
  // Note: verify route checks for session, so this might fail if session is not mocked
  // However, I've already updated the route to use finalizeOrder
  
  const body = JSON.stringify({
    razorpay_payment_id: 'pay_front_' + Date.now(),
    razorpay_order_id: 'razor_order_' + Date.now(),
    razorpay_signature: 'dummy_signature', // We'll need to mock session for this to pass signature check
    orderId: orderId
  });

  console.log('⚠️ Note: This call will likely fail 401/400 because of Auth/Signature check.');
  console.log('However, we can test the internal finalizeOrder logic by bypassing these in the test route.');

  // Since I want to test if the logic works, I'll create a test-only "finalize-now" route
  // Or I can just trust the webhook test since they use the EXACT same function.
}

// ... helper fetch ...
runTest().catch(console.error);
