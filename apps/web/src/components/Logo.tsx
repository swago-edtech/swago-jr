import Link from 'next/link';
import Image from 'next/image';

export default function Logo() {
  return (
    <Link href="/" aria-label="Go to homepage">
      <Image
        src="/Swago_logo.png"
        alt="Swago Logo"
        // 1. Use the actual dimensions to maintain the correct aspect ratio
        width={2902}
        height={1145}
        // 2. Use CSS classes to control the displayed size in the navbar
        className="h-8 md:h-12 w-auto" // Responsive height to prevent overlap on mobile
      />
    </Link>
  );
}