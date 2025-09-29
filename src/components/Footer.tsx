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
    <footer className="bg-slate-50 text-slate-700 py-16 border-t">
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
              <span>swago.club@gmail.com</span>
            </p>
          </div>
        </div>

        {/* Column 2: Shop by Age */}
        <div>
          <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-4">Shop by Age</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products?age=5-7" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">5-7 Years</Link></li>
            <li><Link href="/products?age=8-10" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">8-10 Years</Link></li>
          </ul>
        </div>

        {/* Column 3: Shop by Elements */}
        <div>
          <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-4">Shop by Elements</h3>
          <ul className="space-y-2 text-sm">
            {swagoElements.map(element => (
              <li key={element.id}>
                <Link href={`/products?elements=${element.id}`} className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">{element.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Company - UPDATED */}
        <div>
          <h3 className="font-bold text-slate-800 uppercase tracking-wider mb-4">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">About Us</Link></li>
            <li><Link href="/contact" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Contact Us</Link></li>
            <li><Link href="/terms" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Terms & Conditions</Link></li>
            <li><Link href="/privacy" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Privacy Policy</Link></li>
            <li><Link href="/shipping" className="text-slate-600 hover:text-[hsl(var(--swago-purple))] transition-colors hover:underline">Shipping & Delivery</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}