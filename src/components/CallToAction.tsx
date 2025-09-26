import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="relative rounded-2xl overflow-hidden p-12 text-center bg-gradient-to-r from-[hsl(var(--swago-teal))] to-[hsl(var(--swago-purple))]">
        <div className="flex flex-col items-center text-white">
          <h2 className="text-4xl font-bold">Build Your Swago Score Today</h2>
          <p className="mt-2 max-w-2xl">
            Earn your Swago Score, unlock badges, and join the Swago community.
          </p>
          <Link
            href="/products" // This can be changed to a signup page later
            className="mt-6 bg-[hsl(var(--swago-pink))] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          >
            Start Now
          </Link>
        </div>
      </div>
    </section>
  );
}