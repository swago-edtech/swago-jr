import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product, Order, User, Coupon as CouponModel, Promotion, InternationalConfig } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { generateOrderId } from "@/lib/generateOrderId";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { validateCoupon } from "@/lib/coupon";


interface ProductDocument {
  _id: string;
  name: string;
  slug: string;
  stock: number;
  reservedStock?: number;
  isActive: boolean;
  save: () => Promise<void>;
  [key: string]: unknown;
}


interface CartItem {
  _id?: string;
  id?: number;
  productId?: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  images?: string[];
  slug?: string;
}


interface OrderItem {
  productId: number | string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}


async function getProductById(id: string): Promise<ProductDocument | null> {
  try {
    // Try slug first
    let product = await Product.findOne({ slug: id, isActive: true });

    // Try MongoDB _id if valid ObjectId
    if (!product && isValidObjectId(id)) {
      product = await Product.findOne({ _id: id, isActive: true });
    }

    return product as ProductDocument | null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}


export async function POST(req: Request) {
  try {
    const session = await getLoginSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }


    const { totalAmount, orderDetails } = await req.json();

    if (!totalAmount || typeof totalAmount !== "number") {
      return NextResponse.json({ error: "A valid total amount is required" }, { status: 400 });
    }


    if (!orderDetails?.cart || !Array.isArray(orderDetails.cart) || orderDetails.cart.length === 0) {
      return NextResponse.json({ error: "Cart is required" }, { status: 400 });
    }


    // ========================================
    // STOCK VALIDATION & RESERVATION
    // ========================================
    console.log('Starting stock validation for', orderDetails.cart.length, 'items');

    await connectDB();

    // Clean up expired orders first to release reserved stock
    await cleanupExpiredOrders();

    // Find the user first
    let user = null;
    if (session.phone) {
      user = await User.findOne({ phone: session.phone });
    } else if (session.email) {
      user = await User.findOne({ email: session.email });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stockErrors: string[] = [];
    const reservations: Array<{ product: ProductDocument; quantity: number }> = [];


    // Step 1: Validate all items have sufficient stock
    for (const item of orderDetails.cart) {
      // Check numeric id FIRST (for hardcoded products), then productId, then _id
      // MongoDB embeds add _id to subdocuments, so we need to prioritize the product's actual ID
      const productId = item.id?.toString() || item.productId?.toString() || item._id;

      // DEBUG LOGGING
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Item:', item.name);
      console.log('   item.id:', item.id, 'item.productId:', item.productId, 'item._id:', item._id);
      console.log('   Final productId:', productId);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');


      if (!productId) {
        stockErrors.push(`Invalid product ID for ${item.name}`);
        continue;
      }

      // Check stock for all products
      // Database products - check stock
      const product = await getProductById(productId);

      if (!product) {
        stockErrors.push(`${item.name} is no longer available`);
        continue;
      }


      const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));

      console.log(`📦 ${product.name}: Stock=${product.stock}, Reserved=${product.reservedStock}, Available=${availableStock}, Requested=${item.quantity}`);

      if (availableStock === 0) {
        stockErrors.push(`${item.name} is out of stock`);
      } else if (item.quantity > availableStock) {
        stockErrors.push(`${item.name}: Only ${availableStock} available (you requested ${item.quantity})`);
      } else {
        // Stock is sufficient - prepare for reservation
        reservations.push({ product, quantity: item.quantity });
      }
    }


    // If any stock errors, don't proceed
    if (stockErrors.length > 0) {
      console.log('❌ Stock validation failed:', stockErrors);
      return NextResponse.json({
        error: "Stock unavailable",
        stockErrors: stockErrors,
        details: stockErrors.join('; ')
      }, { status: 400 });
    }


    // Step 2: Reserve stock for all items (only DB products)
    console.log('Stock validation passed. Reserving stock...');

    for (const { product, quantity } of reservations) {
      product.reservedStock = Math.max(0, product.reservedStock || 0) + quantity;
      await product.save();
      console.log(`🔒 Reserved ${quantity} units of ${product.name} (total reserved: ${product.reservedStock})`);
    }


    console.log('Stock reserved successfully for all items');
    // ========================================


    // ========================================
    // NEW: CREATE ORDER BEFORE PAYMENT
    // ========================================
    console.log('Creating order before payment...');

    const orderId = await generateOrderId();
    console.log('Generated Order ID:', orderId);

    // ZEPRO Reference: Server-side Bonus Item Validation
    const activePromotion = await Promotion.findOne({ isActive: true }).lean() as any;

    const BONUS_THRESHOLDS: Record<string, number> = {};
    if (activePromotion?.bonusItems) {
      activePromotion.bonusItems.forEach((item: any) => {
        BONUS_THRESHOLDS[item.slug] = item.threshold;
      });
    } else {
      // Fallback
      BONUS_THRESHOLDS['mini-swago-game-card'] = 999;
      BONUS_THRESHOLDS['special-edition-item'] = 1999;
    }

    // Securely calculate non-bonus subtotal using DB prices
    const nonBonusSubtotal = orderDetails.cart.reduce((sum: number, item: any) => {
      const productId = item.id?.toString() || item.productId?.toString() || item._id;
      const reservation = reservations.find(r =>
        r.product._id.toString() === productId ||
        r.product.slug === productId
      );
      const productPrice = reservation ? (reservation.product as any).price || 0 : item.price;

      const slugValue = item.slug || item.productId || item._id;
      if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string]) return sum;

      return sum + (productPrice * item.quantity);
    }, 0);

    for (const item of orderDetails.cart) {
      const slugValue = item.slug || item.productId || item._id;
      if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string]) {
        if (nonBonusSubtotal < BONUS_THRESHOLDS[slugValue as string]) {
          console.error(`❌ Fraud Detection: Bonus item ${item.name} added without meeting threshold ₹${BONUS_THRESHOLDS[slugValue as string]}. Current subtotal: ₹${nonBonusSubtotal}`);
          return NextResponse.json({ error: "Invalid bonus item threshold" }, { status: 400 });
        }
      }
    }

    // Prepare order items SECURELY
    let totalWeight = 0;
    const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => {
      const productId = item.id?.toString() || item.productId?.toString() || item._id;
      const reservation = reservations.find(r =>
        r.product._id.toString() === productId ||
        r.product.slug === productId
      );

      const dbProduct = reservation?.product as any;
      let finalPrice = dbProduct?.price || item.price;

      const slugValue = item.slug || item.productId || item._id;
      // Allow price of 1 if it passed the bonus threshold check above
      if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string] && nonBonusSubtotal >= BONUS_THRESHOLDS[slugValue as string]) {
        finalPrice = 1;
      }
      totalWeight += (dbProduct?.weight || 0) * item.quantity;
      
      return {
        productId: dbProduct?._id || item._id || item.id || 0,
        name: dbProduct?.name || item.name,
        price: finalPrice,
        quantity: item.quantity,
        image: item.image || item.images?.[0] || '',
      };
    });

    const subtotal = orderItems.reduce(
      (sum: number, item: OrderItem) => sum + (item.price * item.quantity),
      0
    );

    let discountAmount = 0;
    let validatedCoupon = null;

    // Server-side coupon validation
    if (orderDetails.coupon?.code) {
      try {
        const { coupon, discountAmount: validatedDiscount } = await validateCoupon(
          orderDetails.coupon.code,
          subtotal,
          orderDetails.cart,
          user._id.toString()
        );
        discountAmount = validatedDiscount;
        validatedCoupon = coupon;
      } catch (couponError: any) {
        console.error("Coupon validation failed during checkout:", couponError.message);
        // If coupon is invalid, we proceed with 0 discount or return error?
        // Better to return error if the user expected a discount but it's no longer valid
        return NextResponse.json({ error: `Coupon Error: ${couponError.message}` }, { status: 400 });
      }
    }

    const calculatedAmountAfterCoupon = Math.max(0, subtotal - discountAmount);

    // NEW: Handle Swago Money Redemption
    const swagoMoneyRedeemed = orderDetails.swagoMoneyRedeemed || 0;

    if (swagoMoneyRedeemed > 0) {
      if (calculatedAmountAfterCoupon < 799) {
        return NextResponse.json({ error: "Order amount must be ₹799 or more to use Swago Dollars" }, { status: 400 });
      }

      const maxAllowed = Math.trunc(calculatedAmountAfterCoupon * 0.05);
      if (swagoMoneyRedeemed > maxAllowed) {
        return NextResponse.json({ error: `You can only use up to 5% (₹${maxAllowed}) of your order amount in Swago Dollars` }, { status: 400 });
      }

      // Verify User has enough — check directly on User
      const totalAvailable = user.ambassador?.swagoMoney || user.swagoMoney || 0;

      if (totalAvailable < swagoMoneyRedeemed) {
        return NextResponse.json({ error: "Insufficient Swago Dollars balance" }, { status: 400 });
      }
    }

    const countryCode = orderDetails.country || 'IN';
    const currency = orderDetails.currency || 'INR';
    const exchangeRateUsed = orderDetails.exchangeRate || 1;

    let shippingFee = 0;
    if (countryCode !== 'IN') {
      const config = await InternationalConfig.findOne({ isSingleton: true }).lean() as any;
      if (config && config.supportedCountries) {
        const countryConfig = config.supportedCountries.find((c: any) => c.code === countryCode);
        if (countryConfig) {
          if (countryConfig.shippingTiers && countryConfig.shippingTiers.length > 0) {
            const matchedTier = countryConfig.shippingTiers.find(
              (t: any) => totalWeight >= t.minWeight && totalWeight <= t.maxWeight
            );
            if (matchedTier) {
              shippingFee = matchedTier.fee;
            } else {
              const highestTier = [...countryConfig.shippingTiers].sort((a: any, b: any) => b.maxWeight - a.maxWeight)[0];
              shippingFee = totalWeight > highestTier.maxWeight ? highestTier.fee : countryConfig.shippingFee;
            }
          } else {
            shippingFee = countryConfig.shippingFee || 0;
          }
        }
      }
    }

    const calculatedTotal = Math.max(0, calculatedAmountAfterCoupon - swagoMoneyRedeemed + shippingFee);

    // Verify if calculated total matches what frontend sent (optional safety check)
    if (Math.abs(calculatedTotal - totalAmount) > 1) { // 1 rupee tolerance
      console.warn(`Total mismatch: frontend=${totalAmount}, backend=${calculatedTotal}`);
      // We'll use the backend calculated total for the actual payment
    }

    // Create the order with Pending status
    const newOrder = await Order.create({
      orderId: orderId,
      userId: new mongoose.Types.ObjectId(user._id),
      paymentMethod: 'razorpay',  // Explicit payment method
      phone: orderDetails.phone,
      email: orderDetails.email,
      name: orderDetails.name,
      age: orderDetails.age,
      referralSource: orderDetails.referralSource,
      address: orderDetails.address,
      city: orderDetails.city,
      state: orderDetails.state,
      pincode: orderDetails.pincode,
      status: "Pending",  // ← Starts as Pending
      items: orderItems,
      subtotal: subtotal,
      discount: discountAmount,
      shippingFee: countryCode === 'IN' ? shippingFee : 0,
      internationalShippingFee: countryCode !== 'IN' ? shippingFee : 0,
      total: calculatedTotal,
      swagoMoneyRedeemed: swagoMoneyRedeemed,
      swagoMoneyKidId: user._id,
      stockReservedAt: new Date(),
      paymentAttempts: 0,
      country: countryCode,
      currency: currency,
      exchangeRateUsed: exchangeRateUsed,
      displayTotal: calculatedTotal * exchangeRateUsed,
      ...(validatedCoupon && {
        couponCode: validatedCoupon.code,
        couponDetails: validatedCoupon,
      }),
    });

    console.log('✅ Order created with ID:', orderId, 'MongoDB ID:', newOrder._id);

    // Link order to user
    try {
      user.orders.push(newOrder._id);
      await user.save();
      console.log('✅ Order linked to user');
    } catch (linkError) {
      console.error('⚠️ Could not link order to user:', linkError);
    }
    // ========================================


    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("Razorpay credentials missing");

      // Mark order as failed and rollback reservations
      newOrder.status = 'Failed';
      await newOrder.save();

      console.log('⚠️ Razorpay config missing, rolling back reservations...');
      for (const { product, quantity } of reservations) {
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
        await product.save();
      }

      return NextResponse.json({
        error: "Payment gateway not configured"
      }, { status: 500 });
    }


    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });


    // Prepare cart items for notes
    const cartItemsJson = JSON.stringify(
      orderDetails?.cart?.map((item: CartItem) => ({
        id: item.id,
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || item.images?.[0] || '',
      })) || []
    );


    // Prepare coupon details if exists
    const couponDetailsJson = orderDetails?.coupon
      ? JSON.stringify(orderDetails.coupon)
      : '';


    const options = {
      amount: Math.round((currency === "INR" ? calculatedTotal : calculatedTotal * exchangeRateUsed) * 100),
      currency: currency,
      receipt: orderId,  // Use our orderId as receipt
      notes: {
        // NEW: Our order reference
        orderId: orderId,
        mongoOrderId: newOrder._id.toString(),

        // Login credentials (for user lookup)
        loginPhone: session.phone || "",
        loginEmail: session.email || "",

        // Delivery details (from checkout form)
        phone: orderDetails?.phone || "",
        email: orderDetails?.email || "",
        name: orderDetails?.name || "",
        age: orderDetails?.age || "",
        referralSource: orderDetails?.referralSource || "",
        address: orderDetails?.address || "",
        city: orderDetails?.city || "",
        state: orderDetails?.state || "",
        pincode: orderDetails?.pincode || "",

        // Order details
        items: cartItemsJson,
        subtotal: orderDetails?.originalAmount?.toString() || "0",
        discount: orderDetails?.discount?.savedAmount?.toString() || "0",
        couponDetails: couponDetailsJson,

        // Quick reference
        items_count: orderDetails?.cart?.length?.toString() || "0",
        has_discount: orderDetails?.discount ? "yes" : "no",
        coupon_code: orderDetails?.coupon?.code || "",

        // Stock reservation flag
        stock_reserved: reservations.length > 0 ? "true" : "false",
        reservation_timestamp: Date.now().toString(),
      }
    };


    console.log("Creating Razorpay order with stock reserved");


    try {
      const razorpayOrder = await razorpay.orders.create(options);
      console.log("✅ Razorpay order created:", razorpayOrder.id);

      // Update our order with Razorpay reference
      newOrder.razorpay_order_id = razorpayOrder.id;
      await newOrder.save();
      console.log("✅ Order updated with Razorpay order ID");

      // Return both our orderId and Razorpay data
      return NextResponse.json({
        ...razorpayOrder,
        key: process.env.RAZORPAY_KEY_ID, // Add key for frontend
        orderId: orderId,
        mongoOrderId: newOrder._id.toString(),
      });
    } catch (razorpayError) {
      // Razorpay order creation failed - mark order as failed and rollback reservations
      console.error("❌ Razorpay order creation failed, marking order as failed...");

      newOrder.status = 'Failed';
      await newOrder.save();

      for (const { product, quantity } of reservations) {
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - quantity);
        await product.save();
        console.log(`🔓 Released ${quantity} units of ${product.name}`);
      }

      throw razorpayError;
    }


  } catch (error: unknown) {
    console.error("Payment creation error - Full error:", error);

    let errorMessage = "Failed to create payment order";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message || errorMessage;
      errorDetails = error.stack || "";
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    console.error("Error message:", errorMessage);
    console.error("Error details:", errorDetails);

    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    }, { status: 500 });
  }
}
