import Link from "next/link";
import Image from "next/image";

// Hardcoded categories with mascot images
const categories = [
  {
    age: '5-7',
    bgColor: 'bg-[hsl(var(--swago-orange))]',
    href: '/products?age=5-7',
    imageSrc: '/images/kid_girl1.png',
  },
  {
    age: '8-10',
    bgColor: 'bg-[hsl(var(--swago-purple))]',
    href: '/products?age=8-10',
    imageSrc: '/images/kid_boy1.png',
  }
];

export default function ChooseYourKit() {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-black mb-3 uppercase tracking-tight text-slate-900">
          Shop by Age
        </h2>

        <p className="text-slate-500 font-medium mb-16 text-lg">
          Learning kits for 5-10 years
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-16 sm:gap-12 max-w-4xl mx-auto">
          {categories.map((category) => (
            <Link
              key={category.age}
              href={category.href}
              className={`relative block w-full sm:w-1/2 h-44 ${category.bgColor} rounded-2xl rounded-tr-[5rem] text-white text-left shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-500 hover:scale-[1.03] hover:-translate-y-2 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-visible group`}
            >
              <div className="p-8 h-full flex flex-col justify-center">
                <p className="text-5xl font-black leading-tight">{category.age}</p>
                <p className="text-4xl font-bold opacity-90">Years</p>
              </div>

              <div className="absolute -top-10 -right-4 w-44 h-56 sm:w-52 sm:h-64 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2">
                <Image
                  src={category.imageSrc}
                  alt={`Swago mascot for ages ${category.age}`}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}