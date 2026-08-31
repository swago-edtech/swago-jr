// apps/admin/components/AdminSidebar.tsx

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, Package, Users, MessageSquare, X, Menu, HelpCircle, TrendingUp, Award, ChevronDown, ChevronRight, Mail, Ticket, Megaphone, Trophy, Gift, Target, GraduationCap, BarChart3, Warehouse } from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Analytics',
    icon: BarChart3,
    submenu: [
      { name: 'Overview', href: '/analytics' },
      { name: 'Orders', href: '/analytics/orders' },
      { name: 'Products', href: '/analytics/products' },
      { name: 'Revenue', href: '/analytics/revenue' },
      { name: 'Payments', href: '/analytics/payments' },
      { name: 'Customers', href: '/analytics/customers' },
      { name: 'Locations', href: '/analytics/locations' },
      { name: 'Coupons', href: '/analytics/coupons' },
      { name: 'Inventory', href: '/analytics/inventory' },
      { name: 'Marketing', href: '/analytics/marketing' },
    ]
  },
  {
    name: 'Marketing & Comm.',
    icon: Megaphone,
    submenu: [
      { name: 'Announcement Banner', href: '/announcement' },
      { name: 'Home Pop-up', href: '/home-popup' },
      { name: 'Rush Timer Countdown', href: '/express-config' },
    ]
  },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Coupons', href: '/coupons', icon: Ticket },
  { name: 'Promotions', href: '/promotions', icon: Gift },
  { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  { name: 'Products', href: '/products', icon: Package },
  {
    name: 'Inventory',
    icon: Warehouse,
    submenu: [
      { name: 'Dashboard', href: '/inventory' },
      { name: 'Configurations', href: '/inventory/config' },
      { name: 'Transactions', href: '/inventory/transactions' },
    ]
  },
  { name: 'Quests', href: '/quests', icon: Trophy },
  {
    name: 'Masterclass',
    icon: GraduationCap,
    submenu: [
      { name: 'Page Builder', href: '/masterclass' },
      { name: 'Sessions', href: '/masterclass/sessions' },
      { name: 'Bookings', href: '/masterclass/bookings' },
    ]
  },
  { name: 'Banners', href: '/banners', icon: LayoutDashboard },
  {
    name: 'Lottery',
    icon: Ticket,
    submenu: [
      { name: 'Code Generator', href: '/lottery-generator' },
      { name: 'Code Batches', href: '/lottery-batches' },
      { name: 'Lottery Tickets', href: '/lottery-tickets' },
      { name: 'Weekly Winners', href: '/lottery-draws' },
      { name: 'Manual Deposits', href: '/users/manual-deposits' },
    ]
  },
  { name: 'FAQs', href: '/faqs', icon: HelpCircle },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Contact', href: '/contact', icon: Mail },
  {
    name: 'Ambassadors',
    icon: Award,
    submenu: [
      { name: 'Reel Submissions', href: '/ambassadors/reels' },
      { name: 'Brain Gym', href: '/ambassadors/brain-gym' },
    ]
  },
  { name: 'Price Ranges', href: '/price-ranges', icon: Gift },
  { name: 'Blogs', href: '/blogs', icon: MessageSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [unviewedCount, setUnviewedCount] = useState(0);

  // Fetch unviewed contact count
  const fetchUnviewedCount = async () => {
    try {
      const response = await fetch('/api/contact/unviewed-count');
      if (response.ok) {
        const data = await response.json();
        setUnviewedCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unviewed count:', error);
    }
  };

  // Fetch on mount and when pathname changes
  useEffect(() => {
    fetchUnviewedCount();
  }, [pathname]);

  // Auto-expand submenu if current path matches
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.submenu) {
        const isActive = item.submenu.some((sub) => pathname.startsWith(sub.href));
        if (isActive && !expandedMenus.includes(item.name)) {
          setExpandedMenus((prev) => [...prev, item.name]);
        }
      }
    });
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleSubmenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  return (
    <>
      {/* Mobile Menu Button (Fixed) */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-gray-900 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Swago </h1>
            <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
          </div>

          {/* Close Button (Mobile Only) */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;

            // Menu item with submenu
            if (item.submenu) {
              const isExpanded = expandedMenus.includes(item.name);
              const isActive = item.submenu.some((sub) => pathname.startsWith(sub.href));

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  {/* Submenu */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subItem) => {
                        // If it's a base path like /masterclass or /analytics, only match exactly to avoid highlighting everything in the submenu
                        const isBasePath = subItem.href === '/masterclass' || subItem.href === '/lottery' || subItem.href === '/ambassadors' || subItem.href === '/analytics' || subItem.href === '/users' || subItem.href === '/inventory';
                        const isSubActive = isBasePath 
                          ? pathname === subItem.href 
                          : (pathname === subItem.href || pathname.startsWith(subItem.href + '/'));

                        return (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-4 py-2 rounded-lg text-sm transition-colors ${isSubActive
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              }`}
                          >
                            {subItem.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular menu item without submenu
            const isManualDepositConflict = item.href === '/users' && pathname.startsWith('/users/manual-deposits');
            const isActive = isManualDepositConflict 
              ? false 
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors relative ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}

                {/* Notification Badge for Contact */}
                {item.name === 'Contact' && unviewedCount > 0 && (
                  <span className="ml-auto flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                    {unviewedCount > 9 ? '9+' : unviewedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer (Optional) */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 text-center">
            v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
