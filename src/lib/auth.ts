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
    return payload as { phone: string };
  } catch {
    return null;
  }
}
