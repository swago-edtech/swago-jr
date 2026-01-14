import Link from "next/link";
import Image from "next/image";

// Hardcoded categories to ensure only two sections are shown.
// Each category now includes its specific background color and image source.
const categories = [
  {
    age: '5-7',
    bgColor: 'bg-teal-500', 
    href: '/products?age=5-7',
    imageSrc: '/images/gibbson_jump.gif', // src for the 5-7 category
  },
  {
    age: '8-10',
    bgColor: 'bg-orange-400',
    href: '/products?age=8-10',
    imageSrc: '/images/age-8-10.png', // src for the 8-10 category
  }
];

export default function ChooseYourKit() {
  return (
    // MODIFICATION 1: Reduced vertical padding from py-20 to py-16
    <section className="py-16 bg-white"> 
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-4 uppercase">
          Shop by <span className="text-purple-700">Age</span>
        </h2>
        
        {/* MODIFICATION 2: Reduced margin-bottom from mb-16 to mb-12 */}
        <p className="text-slate-600 mb-12">
          Learning kits for 5-10 years
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto gap-8 sm:gap-12">
          {categories.map((category) => (
            <Link 
              key={category.age} 
              href={category.href} 
              className={`relative block h-36 ${category.bgColor} rounded-l-2xl rounded-r-[3rem] text-white text-left shadow-lg transform transition-transform duration-300 hover:scale-105 overflow-visible`}
            >
              <div className="p-6">
                <p className="text-4xl font-extrabold">{category.age}</p>
                <p className="text-3xl font-semibold">Years</p>
              </div>

              <Image 
  src={category.imageSrc}
  alt={`Child playing with kit for ages ${category.age}`}
  width={300} // Increased source resolution just in case
  height={300}
  // CHANGED: w-48 (192px) on mobile, sm:w-56 (224px) on desktop
  className="absolute -bottom-4 right-0 object-contain w-48 h-auto sm:w-56"
/>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}