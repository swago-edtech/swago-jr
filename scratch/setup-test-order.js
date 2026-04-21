const { connectDB, Order, Product, User, KidProfile, Coupon } = require('@swago/database');
const mongoose = require('mongoose');

async function setupTestData() {
  await connectDB();
  console.log('✅ Connected to DB');

  // 1. Find or Create a Test User
  let user = await User.findOne({ phone: '9999999999' });
  if (!user) {
    user = await User.create({
      name: 'Test User',
      phone: '9999999999',
      email: 'test@example.com',
    });
    console.log('👤 Created test user');
  }

  // 2. Find or Create a Test Product
  let product = await Product.findOne({ slug: 'test-product' });
  if (!product) {
    product = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      price: 100,
      stock: 50,
      reservedStock: 0,
      isActive: true,
    });
    console.log('📦 Created test product');
  }

  // 3. Find or Create a Kid Profile for Swago Money
  let kid = await KidProfile.findOne({ userId: user._id });
  if (!kid) {
    kid = await KidProfile.create({
      userId: user._id,
      name: 'Test Kid',
      ambassador: { swagoMoney: 1000 }
    });
    console.log('👶 Created kid profile');
  } else {
    kid.ambassador.swagoMoney = 1000;
    await kid.save();
    console.log('💰 Reset Swago Money balance');
  }

  // 4. Create a Test Coupon
  let coupon = await Coupon.findOne({ code: 'TEST50' });
  if (!coupon) {
    coupon = await Coupon.create({
      code: 'TEST50',
      type: 'fixed',
      value: 50,
      usageCount: 0,
      isActive: true,
    });
    console.log('🎫 Created test coupon');
  } else {
    coupon.usageCount = 0;
    await coupon.save();
    console.log('🎫 Reset coupon usage count');
  }

  // 5. Create a Pending Order
  const orderId = 'TEST_ORDER_' + Date.now();
  const order = await Order.create({
    orderId: orderId,
    userId: user._id,
    paymentMethod: 'razorpay',
    status: 'Pending',
    items: [{
      productId: product.slug,
      name: product.name,
      price: product.price,
      quantity: 2,
    }],
    subtotal: 200,
    discount: 50,
    total: 150,
    swagoMoneyRedeemed: 20,
    swagoMoneyKidId: kid._id,
    couponCode: 'TEST50',
    phone: user.phone,
    email: user.email,
    name: user.name,
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
  });

  // Reserve stock for the order (mimic /api/payment/create)
  product.reservedStock = (product.reservedStock || 0) + 2;
  await product.save();

  console.log('📝 Created pending order:', orderId);
  console.log('🔒 Reserved stock: 2');

  return { orderId, productId: product._id, kidId: kid._id, couponCode: coupon.code };
}

setupTestData().then(({ orderId }) => {
  console.log('\n🚀 TEST ORDER READY:', orderId);
  console.log('Now run the webhook simulation script with this orderId.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
