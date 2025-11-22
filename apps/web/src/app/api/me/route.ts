import { NextResponse } from "next/server";
import { getLoginSession, getDemoUserData } from "@/lib/auth";
import { connectDB, User } from "@swago/database";

// ✅ FIX 1: Define proper User type based on your schema
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
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ FIX 2: Type the cache with IUser instead of any
const userCache = new Map<string, { data: IUser; timestamp: number }>();
const CACHE_TTL = 30000 + Math.random() * 10000; // 30-40 seconds (staggered)

// ✅ FIX 3: Prefix unused parameter with underscore
export async function GET(_request: Request) {
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

    // Check in-memory cache first
    const cacheKey = session.phone;
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

    // ✅ FIX 4: Properly type the lean() result
    await connectDB();
    const user = await User.findOne({ phone: session.phone }).lean() as IUser | null;

    if (!user) {
      return NextResponse.json(
        { loggedIn: false, message: "User not found" },
        { status: 401 }
      );
    }

    // Prepare user data
    const userData: IUser = {
      ...user,
      orders: []
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
