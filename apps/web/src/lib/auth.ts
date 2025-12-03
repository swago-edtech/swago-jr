import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET
);
const cookieName = "session";

// ✅ FIXED: Session can have phone OR email
export async function getLoginSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    // ✅ Support both phone and email sessions
    return payload as { phone?: string; email?: string; isDemo?: boolean };
  } catch {
    return null;
  }
}

// ✅ Check if current user is demo user
export async function isDemoUser() {
  const session = await getLoginSession();
  return session?.isDemo === true;
}

// ✅ Get demo user data
export function getDemoUserData() {
  return {
    phone: "+91 9999999999",
    name: "Demo User",
    email: "demo@swago.com",
    isDemo: true,
  };
}
