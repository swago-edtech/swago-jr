import { redirect } from "next/navigation";
import { getLoginSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/User";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connectDB();
  const session = await getLoginSession();

  if (!session) {
    redirect("/"); // Redirect if not logged in
  }

  const user = await User.findOne({ phone: session.phone });

  if (!user || !user.isAdmin) {
    redirect("/"); // Redirect if user is not an admin
  }

  // If the user is an admin, show the admin page content.
  return (
    <section>
      {/* You can add admin-specific navigation or headers here later */}
      {children}
    </section>
  );
}