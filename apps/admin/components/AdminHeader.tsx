'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface AdminHeaderProps {
  session: {
    name: string;
    email: string;
  };
}

export default function AdminHeader({ session }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Welcome Text - Adjusted for mobile hamburger */}
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 pl-12 md:pl-0">
          Welcome back!
        </h2>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* User Info - Hidden on small mobile, visible on larger screens */}
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">{session.name}</p>
            <p className="text-xs text-gray-500">{session.email}</p>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}