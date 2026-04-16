import Link from 'next/link';
import Logo from './Logo';

// Data for the "Shop by Elements" links
const swagoElements = [
  { id: "S", name: "Smart Tech" },
  { id: "W", name: "Willpower" },
  { id: "A", name: "Ambition" },
  { id: "G", name: "Growth" },
  { id: "O", name: "Optimization" },
];

// Simple SVG Icon components for contact details
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z" />
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-slate-400 pt-16 pb-8">
      <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

        {/* Column 1: Brand & Contact */}
        <div className="lg:col-span-2">
          <Logo />
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <p className="flex items-start gap-3">
              <PhoneIcon />
              <span>+91 6283883397</span>
            </p>
            <p className="flex items-start gap-3">
              <EmailIcon />
              <span>support@swagojr.com</span>
            </p>
          </div>
        </div>

        {/* Column 2: Company (Split into two sub-columns on larger screens) */}
        {process.env.NEXT_PUBLIC_BLOG_ONLY_MODE !== "true" && (
          <div className="lg:col-span-3">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-6">Company</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">About Us</Link></li>
                <li><Link href="/contact" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Contact Us</Link></li>
                <li><Link href="/faq" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">FAQ</Link></li>
                <li><Link href="/terms" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Terms & Conditions</Link></li>
              </ul>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Privacy Policy</Link></li>
                <li><Link href="/shipping" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Shipping & Delivery</Link></li>
                <li><Link href="/cancellation-policy" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Cancellation Policy</Link></li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Copyright Section */}
      {process.env.NEXT_PUBLIC_BLOG_ONLY_MODE !== "true" && (
        <div className="container mx-auto px-4 mt-12 border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-500">Adi anant - All copyrights reserved 2025</p>
        </div>
      )}
    </footer>
  );
}