import { redirect } from "next/navigation";
import { getLoginSession } from "@/lib/auth";
import { connectDB, User } from "@swago/database";
import ApplicationForm from "../ApplicationForm";

export const metadata = {
  title: "Create Your Swago Hero Profile | Swago Ambassador",
  description: "Join the Swago Ambassador Journey - Create your child's hero profile and enter the Swagoverse",
};

export default async function RegisterPage() {
  // ✅ Check if user is already logged in (server-side)
  const session = await getLoginSession();

  if (session && !session.isDemo) {
    try {
      await connectDB();

      // Find user by email or phone
      let user;
      if (session.email) {
        user = await User.findOne({ email: session.email });
      } else if (session.phone) {
        user = await User.findOne({ phone: session.phone });
      }

      if (user) {
        // ✅ User exists → redirect directly to profile
        console.log("✅ User logged in, redirecting to /profile");
        redirect("/profile");
      }
    } catch (error) {
      // ✅ Re-throw NEXT_REDIRECT errors (this is how redirect() works internally)
      if (error && typeof error === 'object' && 'digest' in error) {
        throw error;
      }
      console.error("❌ Error checking user:", error);
      redirect("/profile");
    }
  }

  // Only render form if not logged in
  return <ApplicationForm />;
}
