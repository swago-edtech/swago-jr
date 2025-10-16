import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { User, connectDB } from '@swago/database';

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-me';
const COOKIE_NAME = 'admin_token';

export interface AdminSession {
  userId: string;
  email: string;
  name: string;
}

/**
 * Hash password for storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create admin session (set cookie)
 */
export async function createAdminSession(user: any) {
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '24h' }
  );

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400, // 24 hours
    path: '/',
  });
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminSession;
    
    // Verify user still exists and is admin
    await connectDB();
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isAdmin) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Admin session error:', error);
    return null;
  }
}

/**
 * Clear admin session (logout)
 */
export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Require admin session (for API routes)
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  
  if (!session) {
    throw new Error('Unauthorized - Admin access required');
  }
  
  return session;
}