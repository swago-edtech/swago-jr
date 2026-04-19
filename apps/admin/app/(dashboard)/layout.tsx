import { getAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';

// Admin dashboard pages always depend on the admin session cookie, so they
// must be rendered dynamically. This prevents Next.js from attempting static
// generation (and emitting DYNAMIC_SERVER_USAGE noise) during `next build`.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();
  
  if (!session) {
    redirect('/login');
  }

  // Pass only serializable session data
  const sessionData = {
    name: session.name,
    email: session.email,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader session={sessionData} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}