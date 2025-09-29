import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET
);
const cookieName = "session";

// ✅ Read and verify session cookie
export async function getLoginSession() {
  const cookieStore = await cookies(); // <- await is required in your version
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { phone: string; isDemo?: boolean };
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