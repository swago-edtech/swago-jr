import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import { getLoginSession } from "@/lib/auth";
import { connectDB, Product, Order, User, Coupon as CouponModel, Promotion } from "@swago/database";
import { isValidObjectId } from "mongoose";
import { generateOrderId } from "@/lib/generateOrderId";
import { cleanupExpiredOrders } from "@/lib/cleanupExpiredOrders";
import { validateCoupon } from "@/lib/coupon";
import { findProductWithAvailability } from "@/lib/product-stock";
import {
  allocateInventoryForOrder,
  releaseInventoryAllocation,
  InsufficientInventoryError,
} from "@/lib/inventory-service";
import { getProductPrice, convertToINR, convertToLocal } from "@/lib/currency";
import {
  resolveInternationalShipping,
  computeInternationalDisplayTotal,
  type InternationalShippingResult,
} from "@swago/utils";
import {
  normalizeCountryCode,
  resolveServerIntlCountry,
  type ServerIntlCountry,
} from "@/lib/international-server";


interface ProductDocument {
  _id: string;
  name: string;
  slug: string;
  stock: number;
  reservedStock?: number;
  isActive: boolean;
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
  localPrice?: number; // international orders only
}


// Helper to get product by ID or slug with effective availability
async function getProductById(id: string) {
  return findProductWithAvailability(id);
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

    // ========================================
    // COUNTRY / CURRENCY (server-trusted)
    // ========================================
    // Domestic (IN): always INR @ 1 — identical to what the storefront sends for India.
    // International: currency + exchange rate come from InternationalConfig, never the client.
    const countryCode = normalizeCountryCode(orderDetails.country);
    let intlCountry: ServerIntlCountry | null = null;
    if (countryCode !== 'IN') {
      const resolvedCountry = await resolveServerIntlCountry(countryCode);
      if (!resolvedCountry.ok) {
        return NextResponse.json({ error: resolvedCountry.error, code: "COUNTRY_NOT_SUPPORTED" }, { status: 400 });
      }
      intlCountry = resolvedCountry.country;
      if (
        (orderDetails.currency && String(orderDetails.currency).toUpperCase() !== intlCountry.currency) ||
        (orderDetails.exchangeRate && Number(orderDetails.exchangeRate) !== intlCountry.exchangeRate)
      ) {
        console.warn(
          `⚠️ Client currency/rate mismatch for ${countryCode}: client=${orderDetails.currency}@${orderDetails.exchangeRate}, server=${intlCountry.currency}@${intlCountry.exchangeRate}. Using server values.`
        );
      }
    }

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
    const reservations: Array<{ product: ProductDocument & { availableStock?: number }; quantity: number }> = [];


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


      const availableStock = product.availableStock ?? 0;

      console.log(`📦 ${product.name}: Stock=${product.stock}, Reserved=${product.reservedStock}, Available=${availableStock}, Requested=${item.quantity}`);

      // Stock decoupled: allow orders regardless of stock level
      {
        if (availableStock <= 0) console.log(`⚠️ ${item.name}: negative/zero stock (${availableStock}), order still accepted`);

        // Stock is sufficient - prepare for reservation
        reservations.push({ product, quantity: item.quantity });
      }
    }


    // Stock decoupled: stockErrors no longer block checkout
    if (stockErrors.length > 0) {
      console.log("⚠️ Stock warnings (non-blocking):", stockErrors);
    }


// Step 2: Reserve stock for all items (only DB products)
    console.log('Stock validation passed. Reserving stock...');

    // Products are plain objects (toObject with flattened maps), so reserve with an atomic update
    for (const { product, quantity } of reservations) {
      await Product.updateOne({ _id: product._id }, { $inc: { reservedStock: quantity } });
      console.log(`🔒 Reserved ${quantity} units of ${product.name}`);
    }


    console.log('Stock reserved successfully for all items');
// Stock validated — inventory allocated after order is created
    console.log('✅ Stock validation passed.');
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
    const currency = intlCountry ? intlCountry.currency : "INR";
    const exchangeRateUsed = intlCountry ? intlCountry.exchangeRate : 1;
    const orderItems: OrderItem[] = orderDetails.cart.map((item: CartItem) => {
      const productId = item.id?.toString() || item.productId?.toString() || item._id;
      const reservation = reservations.find(r =>
        r.product._id.toString() === productId ||
        r.product.slug === productId
      );

      const dbProduct = reservation?.product as any;
      const resolvedLocal = getProductPrice(
        {
          price: dbProduct?.price ?? item.price,
          originalPrice: dbProduct?.originalPrice,
          internationalPricing: dbProduct?.internationalPricing,
        },
        currency,
        exchangeRateUsed
      );
      // Order ledger stays in INR; fixed intl prices convert back for accounting.
      let finalPrice =
        currency === "INR"
          ? dbProduct?.price || item.price
          : convertToINR(resolvedLocal.price, exchangeRateUsed);

      const slugValue = item.slug || item.productId || item._id;
      // Allow price of 1 if it passed the bonus threshold check above
      if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string] && nonBonusSubtotal >= BONUS_THRESHOLDS[slugValue as string]) {
        finalPrice = 1;
      }
      return {
        productId: dbProduct?._id || item._id || item.id || 0,
        name: dbProduct?.name || item.name,
        price: finalPrice,
        quantity: item.quantity,
        image: item.image || item.images?.[0] || '',
        // International only: unit price as charged (mirrors localMerchandiseTotal below)
        ...(intlCountry
          ? {
              localPrice:
                item.price === 1 && BONUS_THRESHOLDS[slugValue as string]
                  ? convertToLocal(1, exchangeRateUsed)
                  : resolvedLocal.price,
            }
          : {}),
      };
    });

    // Local-currency merchandise total (fixed price wins over multiplier when set)
    const localMerchandiseTotal = orderDetails.cart.reduce((sum: number, item: CartItem) => {
      const productId = item.id?.toString() || item.productId?.toString() || item._id;
      const reservation = reservations.find(r =>
        r.product._id.toString() === productId ||
        r.product.slug === productId
      );
      const dbProduct = reservation?.product as any;
      const resolved = getProductPrice(
        {
          price: dbProduct?.price ?? item.price,
          originalPrice: dbProduct?.originalPrice,
          internationalPricing: dbProduct?.internationalPricing,
        },
        currency,
        exchangeRateUsed
      );
      const slugValue = item.slug || item.productId || item._id;
      if (item.price === 1 && BONUS_THRESHOLDS[slugValue as string]) {
        return sum + (currency === "INR" ? 1 : convertToLocal(1, exchangeRateUsed)) * item.quantity;
      }
      return sum + resolved.price * item.quantity;
    }, 0);
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

    let shippingFee = 0;
    let intlShipping: InternationalShippingResult | null = null;
    if (intlCountry) {
      // International only: product fixed shipping (once per line, local currency)
      // + config weight tiers / flat fee on the weight of lines without a fixed fee.
      intlShipping = resolveInternationalShipping(
        reservations.map(({ product, quantity }) => ({
          productId: product._id.toString(),
          name: product.name,
          quantity,
          weight: (product as any).weight || 0,
          internationalShipping: (product as any).internationalShipping,
        })),
        intlCountry,
        currency
      );
      shippingFee = intlShipping.feeINR; // INR ledger
    }

    const calculatedTotal = Math.max(0, calculatedAmountAfterCoupon - swagoMoneyRedeemed + shippingFee);

    const localDiscount = currency === "INR" ? discountAmount : convertToLocal(discountAmount, exchangeRateUsed);
    const localSwago = currency === "INR" ? swagoMoneyRedeemed : convertToLocal(swagoMoneyRedeemed, exchangeRateUsed);
    const localShipping = intlShipping ? intlShipping.feeLocal : shippingFee;
    const displayTotal = intlCountry
      ? // International: coupon/Swago never eat into shipping; never negative (mirrors INR ledger)
        computeInternationalDisplayTotal({
          localMerchandise: localMerchandiseTotal,
          localDiscount,
          localSwago,
          localShipping,
        })
      : Math.max(
          0,
          localMerchandiseTotal - localDiscount - localSwago + localShipping
        );

    // Verify if calculated total matches what frontend sent (optional safety check).
    // Server totals are always what gets charged.
    if (!intlCountry) {
      if (Math.abs(calculatedTotal - totalAmount) > 1) { // 1 rupee tolerance
        console.warn(`Total mismatch: frontend=${totalAmount}, backend=${calculatedTotal}`);
        // We'll use the backend calculated total for the actual payment
      }
    } else if (typeof orderDetails.displayTotal === "number") {
      // International: compare in the charged (local) currency
      if (Math.abs(displayTotal - orderDetails.displayTotal) > 0.5) {
        console.warn(`Intl total mismatch (${currency}): frontend=${orderDetails.displayTotal}, backend=${displayTotal}`);
      }
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
      ...(intlShipping && {
        internationalShippingBreakdown: { feeLocal: intlShipping.feeLocal, ...intlShipping.breakdown },
      }),
      total: calculatedTotal,
      swagoMoneyRedeemed: swagoMoneyRedeemed,
      swagoMoneyKidId: user._id,
      stockReservedAt: new Date(),
      paymentAttempts: 0,
      country: countryCode,
      currency: currency,
      exchangeRateUsed: exchangeRateUsed,
      displayTotal: displayTotal,
      ...(intlCountry?.currencySymbol && { currencySymbol: intlCountry.currencySymbol }),
      ...(validatedCoupon && {
        couponCode: validatedCoupon.code,
        couponDetails: validatedCoupon,
      }),
    });

    try {
      await allocateInventoryForOrder(newOrder, { consumeImmediately: false });
    } catch (allocError) {
      await Order.findByIdAndDelete(newOrder._id);
      if (allocError instanceof InsufficientInventoryError) {
        return NextResponse.json({
          error: "Stock unavailable",
          stockErrors: [allocError.message],
          details: allocError.message,
        }, { status: 400 });
      }
      throw allocError;
    }

    console.log('✅ Inventory allocated for order');

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

      console.log('⚠️ Razorpay config missing, rolling back allocation...');
      await releaseInventoryAllocation(newOrder);

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
      amount: Math.round((currency === "INR" ? calculatedTotal : displayTotal) * 100),
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
        currency: currency,
      });
    } catch (razorpayError) {
      // Razorpay order creation failed - mark order as failed and rollback reservations
      console.error("❌ Razorpay order creation failed, marking order as failed...");

      newOrder.status = 'Failed';
      await newOrder.save();

      await releaseInventoryAllocation(newOrder);

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
