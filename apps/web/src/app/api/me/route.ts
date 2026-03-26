import { NextResponse } from "next/server";
import { getLoginSession, getDemoUserData } from "@/lib/auth";
import { connectDB, User } from "@swago/database";

// ✅ Define proper User type based on your schema
interface IUser {
  _id: string;
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  isAdmin?: boolean;
  wishlist?: number[];
  age?: number;
  address?: string;
  orders?: string[];
  swagoMoney?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ Type the cache with IUser instead of any
const userCache = new Map<string, { data: IUser; timestamp: number }>();
const CACHE_TTL = 30000 + Math.random() * 10000; // 30-40 seconds (staggered)

// ✅ FIXED: Changed _request to _ to indicate unused parameter
export async function GET() {
  try {
    const session = await getLoginSession();

    if (!session) {
      return NextResponse.json(
        { loggedIn: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Handle demo user
    if (session.isDemo) {
      const demoUser = getDemoUserData();
      const response = NextResponse.json({
        loggedIn: true,
        user: {
          ...demoUser,
          orders: [],
          _id: "demo-user-id",
        },
      });
      
      response.headers.set('Cache-Control', 'private, max-age=60');
      return response;
    }

    // ✅ FIXED: Create cache key based on phone OR email
    const cacheKey = session.phone || session.email || 'unknown';
    const cached = userCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Cache hit for ${cacheKey}`);
      const response = NextResponse.json({
        loggedIn: true,
        user: cached.data
      });
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
      return response;
    }

    // ✅ FIXED: Look up user by phone OR email
    await connectDB();
    let user: IUser | null = null;
    
    if (session.phone) {
      user = await User.findOne({ phone: session.phone }).populate('orders').lean() as IUser | null;
    } else if (session.email) {
      user = await User.findOne({ email: session.email }).populate('orders').lean() as IUser | null;
    }

    if (!user) {
      return NextResponse.json(
        { loggedIn: false, message: "User not found" },
        { status: 401 }
      );
    }

    // Prepare user data
    const userData: IUser = {
      ...user,
      orders: user.orders || []
    };

    // Store in cache
    userCache.set(cacheKey, {
      data: userData,
      timestamp: Date.now()
    });

    // Clean up old cache entries (simple cleanup)
    if (userCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > CACHE_TTL * 2) {
          userCache.delete(key);
        }
      }
    }

    // Return response with cache headers
    const response = NextResponse.json({
      loggedIn: true,
      user: userData
    });

    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=30');
    
    const updatedAt = user.updatedAt || user.createdAt || new Date();
    const etag = `"${user._id}-${new Date(updatedAt).getTime()}"`;
    response.headers.set('ETag', etag);

    return response;
  } catch (error) {
    console.error("Error in /api/me:", error);
    return NextResponse.json(
      { loggedIn: false, error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
