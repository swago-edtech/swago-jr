import { redirect } from "next/navigation";
import { getLoginSession } from "@/lib/auth";
import ApplicationForm from "../ApplicationForm";

export const metadata = {
  title: "Create Your Swago Hero Profile | Swago Ambassador",
  description: "Join the Swago Ambassador Journey - Create your child's hero profile and enter the Swagoverse",
};

export default async function RegisterPage() {
  // ✅ Check if user is already logged in (server-side)
  const session = await getLoginSession();
  
  if (session) {
    console.log("✅ User already logged in, redirecting to /kids");
    redirect("/kids/dashboard");
  }

  // Only render form if not logged in
  return <ApplicationForm />;
}
